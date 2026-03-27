package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

type paymentIntentRequest struct {
	SubmissionID string  `json:"submissionId"`
	Amount       float64 `json:"amount"`
	Currency     string  `json:"currency"`
}

type paymentIntentResponse struct {
	ClientSecret    string `json:"clientSecret"`
	PaymentIntentID string `json:"paymentIntentId"`
}

type PaymentIntentHandler struct {
	stripeKey string
}

func NewPaymentIntentHandler(stripeKey string) *PaymentIntentHandler {
	return &PaymentIntentHandler{stripeKey: stripeKey}
}

func (h *PaymentIntentHandler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body paymentIntentRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "invalid request body",
			"success": false,
		}), nil
	}

	if body.Amount <= 0 {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "amount is required",
			"success": false,
		}), nil
	}

	currency := body.Currency
	if currency == "" {
		currency = "usd"
	}

	pi, err := h.createPaymentIntent(body.SubmissionID, body.Amount, currency)
	if err != nil {
		log.Printf("error creating payment intent: %v", err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": "failed to create payment intent",
			"success": false,
		}), nil
	}

	return jsonResponse(http.StatusCreated, paymentIntentResponse{
		ClientSecret:    pi.ClientSecret,
		PaymentIntentID: pi.ID,
	}), nil
}

type stripePaymentIntentResult struct {
	ID           string `json:"id"`
	ClientSecret string `json:"client_secret"`
}

func (h *PaymentIntentHandler) createPaymentIntent(submissionID string, amount float64, currency string) (*stripePaymentIntentResult, error) {
	amountCents := strconv.FormatInt(int64(amount*100), 10)

	form := url.Values{}
	form.Set("amount", amountCents)
	form.Set("currency", currency)
	form.Set("automatic_payment_methods[enabled]", "true")
	if submissionID != "" {
		form.Set("metadata[submissionId]", submissionID)
	}

	req, err := http.NewRequest("POST", "https://api.stripe.com/v1/payment_intents", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+h.stripeKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("calling stripe: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("stripe returned %d: %s", resp.StatusCode, respBody)
	}

	var pi stripePaymentIntentResult
	if err := json.Unmarshal(respBody, &pi); err != nil {
		return nil, fmt.Errorf("parsing stripe response: %w", err)
	}

	return &pi, nil
}
