package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/photojomo/photojomo-be/internal/db"
	"github.com/photojomo/photojomo-be/internal/handler"
	"github.com/photojomo/photojomo-be/internal/repository"
	"github.com/photojomo/photojomo-be/internal/secrets"
)

func main() {
	ctx := context.Background()

	stripe, err := secrets.GetStripe(ctx)
	if err != nil {
		panic("failed to fetch Stripe secret: " + err.Error())
	}

	pool, err := db.Connect(ctx)
	if err != nil {
		panic("failed to connect to database: " + err.Error())
	}
	defer pool.Close()

	tiers := repository.NewContestTierRepository(pool)
	h := handler.NewPaymentIntentHandler(stripe.SecretKey, tiers)
	lambda.Start(h.Handle)
}
