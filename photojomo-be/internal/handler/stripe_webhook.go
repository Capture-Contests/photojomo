package handler

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/photojomo/photojomo-be/internal/repository"
)

const stripeSignatureTolerance = 5 * time.Minute

type StripeWebhookHandler struct {
	secret      string
	submissions *repository.SubmissionRepository
}

func NewStripeWebhookHandler(secret string, submissions *repository.SubmissionRepository) *StripeWebhookHandler {
	return &StripeWebhookHandler{secret: secret, submissions: submissions}
}

func (h *StripeWebhookHandler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	sigHeader := req.Headers["stripe-signature"]
	if sigHeader == "" {
		return jsonResponse(http.StatusUnauthorized, map[string]interface{}{
			"message": "missing stripe-signature header",
			"success": false,
		}), nil
	}

	if err := h.verifySignature(req.Body, sigHeader); err != nil {
		log.Printf("stripe signature verification failed: %v", err)
		return jsonResponse(http.StatusUnauthorized, map[string]interface{}{
			"message": "invalid signature",
			"success": false,
		}), nil
	}

	var event stripeEvent
	if err := json.Unmarshal([]byte(req.Body), &event); err != nil {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "invalid event payload",
			"success": false,
		}), nil
	}

	log.Printf("stripe webhook received: type=%s id=%s", event.Type, event.ID)

	switch event.Type {
	case "payment_intent.succeeded":
		if err := h.handlePaymentIntentSucceeded(ctx, event); err != nil {
			log.Printf("error handling payment_intent.succeeded: %v", err)
			return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
				"message": "internal server error",
				"success": false,
			}), nil
		}

	case "payment_intent.payment_failed":
		if err := h.handlePaymentIntentFailed(ctx, event); err != nil {
			log.Printf("error handling payment_intent.payment_failed: %v", err)
			return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
				"message": "internal server error",
				"success": false,
			}), nil
		}

	case "checkout.session.completed":
		log.Printf("checkout.session.completed: id=%s", event.ID)

	default:
		log.Printf("unhandled stripe event type: %s", event.Type)
	}

	return jsonResponse(http.StatusOK, map[string]interface{}{"received": true}), nil
}

func (h *StripeWebhookHandler) handlePaymentIntentSucceeded(ctx context.Context, event stripeEvent) error {
	paymentIntentID, err := paymentIntentIDFromEvent(event)
	if err != nil {
		return err
	}
	log.Printf("payment_intent.succeeded: paymentIntentId=%s", paymentIntentID)
	return h.submissions.UpdatePaymentStatusByPaymentIntentID(ctx, paymentIntentID, "paid")
}

func (h *StripeWebhookHandler) handlePaymentIntentFailed(ctx context.Context, event stripeEvent) error {
	paymentIntentID, err := paymentIntentIDFromEvent(event)
	if err != nil {
		return err
	}
	log.Printf("payment_intent.payment_failed: paymentIntentId=%s", paymentIntentID)
	return h.submissions.UpdatePaymentStatusByPaymentIntentID(ctx, paymentIntentID, "failed")
}

// verifySignature validates the Stripe-Signature header using HMAC-SHA256.
// Header format: t=<timestamp>,v1=<signature>
func (h *StripeWebhookHandler) verifySignature(body, sigHeader string) error {
	var timestamp string
	var signature string

	for _, part := range strings.Split(sigHeader, ",") {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch kv[0] {
		case "t":
			timestamp = kv[1]
		case "v1":
			signature = kv[1]
		}
	}

	if timestamp == "" || signature == "" {
		return fmt.Errorf("malformed stripe-signature header")
	}

	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid timestamp in stripe-signature header")
	}

	age := time.Since(time.Unix(ts, 0))
	if age > stripeSignatureTolerance || age < -stripeSignatureTolerance {
		return fmt.Errorf("stripe webhook timestamp too old or in future: age=%v", age)
	}

	payload := timestamp + "." + body
	mac := hmac.New(sha256.New, []byte(h.secret))
	mac.Write([]byte(payload))
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(expected), []byte(signature)) {
		return fmt.Errorf("signature mismatch")
	}

	return nil
}

// ── Stripe event types ────────────────────────────────────────────────────────

type stripeEvent struct {
	ID   string          `json:"id"`
	Type string          `json:"type"`
	Data stripeEventData `json:"data"`
}

type stripeEventData struct {
	Object json.RawMessage `json:"object"`
}

type stripePaymentIntent struct {
	ID string `json:"id"`
}

func paymentIntentIDFromEvent(event stripeEvent) (string, error) {
	var pi stripePaymentIntent
	if err := json.Unmarshal(event.Data.Object, &pi); err != nil {
		return "", fmt.Errorf("unmarshalling payment intent: %w", err)
	}
	if pi.ID == "" {
		return "", fmt.Errorf("payment intent id not found in event")
	}
	return pi.ID, nil
}
