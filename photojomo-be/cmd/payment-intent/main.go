package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/photojomo/photojomo-be/internal/handler"
)

func main() {
	_ = context.Background()

	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey == "" {
		panic("STRIPE_SECRET_KEY is not set")
	}

	h := handler.NewPaymentIntentHandler(stripeKey)
	lambda.Start(h.Handle)
}
