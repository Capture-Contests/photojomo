package main

import (
	"context"
	"log"

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
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	mc, err := secrets.GetMailchimp(ctx)
	if err != nil {
		log.Fatalf("failed to fetch Mailchimp secret: %v", err)
	}

	repo := repository.NewSweepstakesRepository(pool)
	h := handler.NewSweepstakesHandler(repo, mailchimp.NewClient(mc.APIKey, mc.AudienceID))

	lambda.Start(h.Handle)
}
