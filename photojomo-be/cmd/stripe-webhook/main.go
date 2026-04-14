package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/photojomo/photojomo-be/internal/db"
	"github.com/photojomo/photojomo-be/internal/handler"
	"github.com/photojomo/photojomo-be/internal/mailchimp"
	"github.com/photojomo/photojomo-be/internal/repository"
	"github.com/photojomo/photojomo-be/internal/secrets"
)

func main() {
	ctx := context.Background()

	pool, err := db.Connect(ctx)
	if err != nil {
		panic("failed to connect to database: " + err.Error())
	}
	defer pool.Close()

	stripe, err := secrets.GetStripe(ctx)
	if err != nil {
		panic("failed to fetch Stripe secret: " + err.Error())
	}

	mc, err := secrets.GetMailchimp(ctx)
	if err != nil {
		panic("failed to fetch Mailchimp secret: " + err.Error())
	}

	submissions := repository.NewSubmissionRepository(pool)
	h := handler.NewStripeWebhookHandler(stripe.WebhookSecret, submissions, mailchimp.NewClient(mc.APIKey, mc.AudienceID))

	lambda.Start(h.Handle)
}
