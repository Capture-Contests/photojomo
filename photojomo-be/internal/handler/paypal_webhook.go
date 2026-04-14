package handler

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/photojomo/photojomo-be/internal/mailchimp"
	"github.com/photojomo/photojomo-be/internal/repository"
)

type PaypalWebhookHandler struct {
	clientID     string
	clientSecret string
	webhookID    string
	submissions  *repository.SubmissionRepository
	mailchimp    *mailchimp.Client
	httpClient   *http.Client
}

func NewPaypalWebhookHandler(clientID, clientSecret, webhookID string, submissions *repository.SubmissionRepository, mc *mailchimp.Client) *PaypalWebhookHandler {
	return &PaypalWebhookHandler{
		clientID:     clientID,
		clientSecret: clientSecret,
		webhookID:    webhookID,
		submissions:  submissions,
		mailchimp:    mc,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (h *PaypalWebhookHandler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	if err := h.verifyWebhook(req); err != nil {
		log.Printf("paypal webhook verification failed: %v", err)
		return jsonResponse(http.StatusUnauthorized, map[string]interface{}{
			"message": "invalid webhook signature",
			"success": false,
		}), nil
	}

	type paypalWebhookEvent struct {
		EventType string          `json:"event_type"`
		Resource  json.RawMessage `json:"resource"`
	}

	var event paypalWebhookEvent
	if err := json.Unmarshal([]byte(req.Body), &event); err != nil {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "invalid event payload",
			"success": false,
		}), nil
	}

	log.Printf("paypal webhook received: event_type=%s", event.EventType)

	switch event.EventType {
	case "PAYMENT.CAPTURE.COMPLETED":
		if err := h.handleCaptureCompleted(ctx, event.Resource); err != nil {
			log.Printf("error handling PAYMENT.CAPTURE.COMPLETED: %v", err)
			return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
				"message": "internal server error",
				"success": false,
			}), nil
		}
	case "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REVERSED":
		if err := h.handleCaptureFailed(ctx, event.Resource); err != nil {
			log.Printf("error handling %s: %v", event.EventType, err)
			return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
				"message": "internal server error",
				"success": false,
			}), nil
		}
	default:
		log.Printf("unhandled paypal event type: %s", event.EventType)
	}

	return jsonResponse(http.StatusOK, map[string]interface{}{"received": true}), nil
}

func (h *PaypalWebhookHandler) verifyWebhook(req events.APIGatewayV2HTTPRequest) error {
	token, err := h.getWebhookAccessToken()
	if err != nil {
		return fmt.Errorf("getting access token for webhook verification: %w", err)
	}

	type verifyPayload struct {
		AuthAlgo         string          `json:"auth_algo"`
		CertURL          string          `json:"cert_url"`
		TransmissionID   string          `json:"transmission_id"`
		TransmissionSig  string          `json:"transmission_sig"`
		TransmissionTime string          `json:"transmission_time"`
		WebhookID        string          `json:"webhook_id"`
		WebhookEvent     json.RawMessage `json:"webhook_event"`
	}

	payload := verifyPayload{
		AuthAlgo:         req.Headers["paypal-auth-algo"],
		CertURL:          req.Headers["paypal-cert-url"],
		TransmissionID:   req.Headers["paypal-transmission-id"],
		TransmissionSig:  req.Headers["paypal-transmission-sig"],
		TransmissionTime: req.Headers["paypal-transmission-time"],
		WebhookID:        h.webhookID,
		WebhookEvent:     json.RawMessage(req.Body),
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshalling verify payload: %w", err)
	}

	verifyReq, err := http.NewRequest("POST", paypalBaseURL+"/v1/notifications/verify-webhook-signature", bytes.NewReader(payloadBytes))
	if err != nil {
		return fmt.Errorf("building verify request: %w", err)
	}
	verifyReq.Header.Set("Authorization", "Bearer "+token)
	verifyReq.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(verifyReq)
	if err != nil {
		return fmt.Errorf("calling paypal verify endpoint: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("paypal verify endpoint returned %d: %s", resp.StatusCode, respBody)
	}

	var verifyResp struct {
		VerificationStatus string `json:"verification_status"`
	}
	if err := json.Unmarshal(respBody, &verifyResp); err != nil {
		return fmt.Errorf("parsing paypal verify response: %w", err)
	}

	if verifyResp.VerificationStatus != "SUCCESS" {
		return fmt.Errorf("paypal webhook verification status: %s", verifyResp.VerificationStatus)
	}

	return nil
}

func (h *PaypalWebhookHandler) getWebhookAccessToken() (string, error) {
	form := url.Values{}
	form.Set("grant_type", "client_credentials")

	req, err := http.NewRequest("POST", paypalBaseURL+"/v1/oauth2/token", bytes.NewBufferString(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("building token request: %w", err)
	}

	credentials := base64.StdEncoding.EncodeToString([]byte(h.clientID + ":" + h.clientSecret))
	req.Header.Set("Authorization", "Basic "+credentials)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("calling paypal token endpoint: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("paypal token endpoint returned %d: %s", resp.StatusCode, respBody)
	}

	var tokenResp paypalTokenResponse
	if err := json.Unmarshal(respBody, &tokenResp); err != nil {
		return "", fmt.Errorf("parsing paypal token response: %w", err)
	}

	return tokenResp.AccessToken, nil
}

type paypalCapture struct {
	SupplementaryData struct {
		RelatedIDs struct {
			OrderID string `json:"order_id"`
		} `json:"related_ids"`
	} `json:"supplementary_data"`
}

func (h *PaypalWebhookHandler) handleCaptureCompleted(ctx context.Context, resource json.RawMessage) error {
	var capture paypalCapture
	if err := json.Unmarshal(resource, &capture); err != nil {
		return fmt.Errorf("unmarshalling capture resource: %w", err)
	}
	orderID := capture.SupplementaryData.RelatedIDs.OrderID
	log.Printf("PAYMENT.CAPTURE.COMPLETED: orderID=%s", orderID)

	if err := h.submissions.UpdatePaymentStatusByPaypalOrderID(ctx, orderID, "paid"); err != nil {
		return err
	}

	contact, err := h.submissions.FindContactByPaypalOrderID(ctx, orderID)
	if err != nil {
		log.Printf("warning: could not fetch contact for mailchimp after paypal order %s: %v", orderID, err)
		return nil
	}

	tag := contact.CategoryName + " Contest"
	if err := h.mailchimp.SubscribeWithTag(contact.Email, contact.FirstName, contact.LastName, tag); err != nil {
		log.Printf("warning: mailchimp subscribe failed for %s: %v", contact.Email, err)
	}

	return nil
}

func (h *PaypalWebhookHandler) handleCaptureFailed(ctx context.Context, resource json.RawMessage) error {
	var capture paypalCapture
	if err := json.Unmarshal(resource, &capture); err != nil {
		return fmt.Errorf("unmarshalling capture resource: %w", err)
	}
	orderID := capture.SupplementaryData.RelatedIDs.OrderID
	log.Printf("PAYMENT.CAPTURE.DENIED/REVERSED: orderID=%s", orderID)
	return h.submissions.UpdatePaymentStatusByPaypalOrderID(ctx, orderID, "failed")
}
