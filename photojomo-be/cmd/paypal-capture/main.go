package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/photojomo/photojomo-be/internal/db"
	"github.com/photojomo/photojomo-be/internal/handler"
	"github.com/photojomo/photojomo-be/internal/repository"
	"github.com/photojomo/photojomo-be/internal/secrets"
)

func main() {
	ctx := context.Background()

	paypal, err := secrets.GetPaypal(ctx)
	if err != nil {
		panic("failed to fetch PayPal secret: " + err.Error())
	}

	pool, err := db.Connect(ctx)
	if err != nil {
		panic("failed to connect to database: " + err.Error())
	}
	defer pool.Close()

	live := os.Getenv("PAYPAL_ENV") == "live"
	tiers := repository.NewContestTierRepository(pool)
	h := handler.NewPaypalOrderHandler(paypal.ClientID, paypal.ClientSecret, live, tiers)
	lambda.Start(h.HandleCapture)
}
