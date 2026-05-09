package main

import (
	"context"

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

	tiers := repository.NewContestTierRepository(pool)
	h := handler.NewContestTierHandler(tiers)

	lambda.Start(h.Handle)
}
