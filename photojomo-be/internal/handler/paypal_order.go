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
	"github.com/photojomo/photojomo-be/internal/repository"
)

const (
	paypalSandboxBaseURL = "https://api-m.sandbox.paypal.com"
	paypalLiveBaseURL    = "https://api-m.paypal.com"
)

type paypalOrderRequest struct {
	ContestTierID string `json:"contestTierId"`
	Currency      string `json:"currency"`
}

type paypalOrderResponse struct {
	OrderID string `json:"orderId"`
}

type paypalCaptureResponse struct {
	OrderID string `json:"orderId"`
	Status  string `json:"status"`
}

type PaypalOrderHandler struct {
	clientID     string
	clientSecret string
	baseURL      string
	tiers        *repository.ContestTierRepository
	httpClient   *http.Client
}

func NewPaypalOrderHandler(clientID, clientSecret string, live bool, tiers *repository.ContestTierRepository) *PaypalOrderHandler {
	baseURL := paypalSandboxBaseURL
	if live {
		baseURL = paypalLiveBaseURL
	}
	return &PaypalOrderHandler{
		clientID:     clientID,
		clientSecret: clientSecret,
		baseURL:      baseURL,
		tiers:        tiers,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (h *PaypalOrderHandler) HandleCreate(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body paypalOrderRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "invalid request body",
			"success": false,
		}), nil
	}

	if body.ContestTierID == "" {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "contestTierId is required",
			"success": false,
		}), nil
	}

	tier, err := h.tiers.FindByID(ctx, body.ContestTierID)
	if err != nil {
		log.Printf("error looking up tier %s: %v", body.ContestTierID, err)
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "invalid contestTierId",
			"success": false,
		}), nil
	}

	currency := body.Currency
	if currency == "" {
		currency = "USD"
	}

	token, err := h.getAccessToken()
	if err != nil {
		log.Printf("error getting paypal access token: %v", err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": "failed to authenticate with PayPal",
			"success": false,
		}), nil
	}

	orderID, err := h.createOrder(token, tier.Price, currency)
	if err != nil {
		log.Printf("error creating paypal order: %v", err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": "failed to create PayPal order",
			"success": false,
		}), nil
	}

	return jsonResponse(http.StatusCreated, paypalOrderResponse{OrderID: orderID}), nil
}

func (h *PaypalOrderHandler) HandleCapture(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	orderID := req.PathParameters["orderId"]
	if orderID == "" {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "orderId path parameter is required",
			"success": false,
		}), nil
	}

	token, err := h.getAccessToken()
	if err != nil {
		log.Printf("error getting paypal access token: %v", err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": "failed to authenticate with PayPal",
			"success": false,
		}), nil
	}

	if err := h.captureOrder(token, orderID); err != nil {
		log.Printf("error capturing paypal order %s: %v", orderID, err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": "failed to capture PayPal order",
			"success": false,
		}), nil
	}

	return jsonResponse(http.StatusOK, paypalCaptureResponse{
		OrderID: orderID,
		Status:  "COMPLETED",
	}), nil
}

// ── PayPal API helpers ────────────────────────────────────────────────────────

type paypalTokenResponse struct {
	AccessToken string `json:"access_token"`
}

func (h *PaypalOrderHandler) getAccessToken() (string, error) {
	form := url.Values{}
	form.Set("grant_type", "client_credentials")

	req, err := http.NewRequest("POST", h.baseURL+"/v1/oauth2/token", bytes.NewBufferString(form.Encode()))
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

type paypalCreateOrderRequest struct {
	Intent        string               `json:"intent"`
	PurchaseUnits []paypalPurchaseUnit `json:"purchase_units"`
}

type paypalPurchaseUnit struct {
	Amount paypalAmount `json:"amount"`
}

type paypalAmount struct {
	CurrencyCode string `json:"currency_code"`
	Value        string `json:"value"`
}

type paypalCreateOrderResponse struct {
	ID string `json:"id"`
}

func (h *PaypalOrderHandler) createOrder(token string, amount float64, currency string) (string, error) {
	orderBody := paypalCreateOrderRequest{
		Intent: "CAPTURE",
		PurchaseUnits: []paypalPurchaseUnit{
			{
				Amount: paypalAmount{
					CurrencyCode: currency,
					Value:        fmt.Sprintf("%.2f", amount),
				},
			},
		},
	}

	bodyBytes, err := json.Marshal(orderBody)
	if err != nil {
		return "", fmt.Errorf("marshalling order request: %w", err)
	}

	req, err := http.NewRequest("POST", h.baseURL+"/v2/checkout/orders", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("building create order request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("calling paypal create order: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("paypal create order returned %d: %s", resp.StatusCode, respBody)
	}

	var orderResp paypalCreateOrderResponse
	if err := json.Unmarshal(respBody, &orderResp); err != nil {
		return "", fmt.Errorf("parsing paypal create order response: %w", err)
	}

	return orderResp.ID, nil
}

func (h *PaypalOrderHandler) captureOrder(token, orderID string) error {
	req, err := http.NewRequest("POST", h.baseURL+"/v2/checkout/orders/"+orderID+"/capture", bytes.NewReader([]byte("{}")))
	if err != nil {
		return fmt.Errorf("building capture request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("calling paypal capture: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("paypal capture returned %d: %s", resp.StatusCode, respBody)
	}

	return nil
}
