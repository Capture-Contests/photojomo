package secrets

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

// StripeSecret holds Stripe API credentials fetched from Secrets Manager.
type StripeSecret struct {
	SecretKey     string `json:"secretKey"`
	WebhookSecret string `json:"webhookSecret"`
}

// PaypalSecret holds PayPal API credentials fetched from Secrets Manager.
type PaypalSecret struct {
	ClientID     string `json:"clientId"`
	ClientSecret string `json:"clientSecret"`
	WebhookID    string `json:"webhookId"`
}

func fetchSecret(ctx context.Context, arn string, out interface{}) error {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return fmt.Errorf("loading AWS config: %w", err)
	}

	sm := secretsmanager.NewFromConfig(cfg)
	result, err := sm.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(arn),
	})
	if err != nil {
		return fmt.Errorf("fetching secret: %w", err)
	}

	if err := json.Unmarshal([]byte(*result.SecretString), out); err != nil {
		return fmt.Errorf("parsing secret: %w", err)
	}

	return nil
}

// GetStripe fetches Stripe credentials from the ARN in env var STRIPE_SECRET_ARN.
func GetStripe(ctx context.Context) (*StripeSecret, error) {
	arn := os.Getenv("STRIPE_SECRET_ARN")
	if arn == "" {
		return nil, fmt.Errorf("STRIPE_SECRET_ARN environment variable not set")
	}

	var s StripeSecret
	if err := fetchSecret(ctx, arn, &s); err != nil {
		return nil, err
	}

	return &s, nil
}

// GetPaypal fetches PayPal credentials from the ARN in env var PAYPAL_SECRET_ARN.
func GetPaypal(ctx context.Context) (*PaypalSecret, error) {
	arn := os.Getenv("PAYPAL_SECRET_ARN")
	if arn == "" {
		return nil, fmt.Errorf("PAYPAL_SECRET_ARN environment variable not set")
	}

	var p PaypalSecret
	if err := fetchSecret(ctx, arn, &p); err != nil {
		return nil, err
	}

	return &p, nil
}

// MailchimpSecret holds Mailchimp credentials fetched from Secrets Manager.
type MailchimpSecret struct {
	APIKey     string `json:"apiKey"`
	AudienceID string `json:"audienceId"`
}

// GetMailchimp fetches Mailchimp credentials from the ARN in env var MAILCHIMP_SECRET_ARN.
func GetMailchimp(ctx context.Context) (*MailchimpSecret, error) {
	arn := os.Getenv("MAILCHIMP_SECRET_ARN")
	if arn == "" {
		return nil, fmt.Errorf("MAILCHIMP_SECRET_ARN environment variable not set")
	}

	var m MailchimpSecret
	if err := fetchSecret(ctx, arn, &m); err != nil {
		return nil, err
	}

	return &m, nil
}
