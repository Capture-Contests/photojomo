package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/photojomo/photojomo-be/internal/db"
	"github.com/photojomo/photojomo-be/internal/handler"
	"github.com/photojomo/photojomo-be/internal/repository"
)

func main() {
	ctx := context.Background()

	pool, err := db.Connect(ctx)
	if err != nil {
		panic("failed to connect to database: " + err.Error())
	}
	defer pool.Close()

	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	if webhookSecret == "" {
		panic("STRIPE_WEBHOOK_SECRET is not set")
	}

	submissions := repository.NewSubmissionRepository(pool)
	h := handler.NewStripeWebhookHandler(webhookSecret, submissions)

	lambda.Start(h.Handle)
}
