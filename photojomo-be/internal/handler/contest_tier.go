package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/photojomo/photojomo-be/internal/repository"
)

type ContestTierHandler struct {
	tiers *repository.ContestTierRepository
}

func NewContestTierHandler(tiers *repository.ContestTierRepository) *ContestTierHandler {
	return &ContestTierHandler{tiers: tiers}
}

type contestTierResponse struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Price     float64  `json:"price"`
	MaxImages int      `json:"maxImages"`
	Golden    bool     `json:"golden"`
	SortOrder int      `json:"sortOrder"`
	Benefits  []string `json:"benefits"`
}

func (h *ContestTierHandler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	contestID := req.PathParameters["contestId"]
	if contestID == "" {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "contestId path parameter is required",
			"success": false,
		}), nil
	}

	tiers, err := h.tiers.FindByContestID(ctx, contestID)
	if err != nil {
		log.Printf("error fetching tiers for contest %s: %v", contestID, err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": fmt.Sprintf("failed to fetch tiers"),
			"success": false,
		}), nil
	}

	resp := make([]contestTierResponse, len(tiers))
	for i, t := range tiers {
		benefits := t.Benefits
		if benefits == nil {
			benefits = []string{}
		}
		resp[i] = contestTierResponse{
			ID:        t.ID,
			Name:      t.Name,
			Price:     t.Price,
			MaxImages: t.MaxImages,
			Golden:    t.Golden,
			SortOrder: t.SortOrder,
			Benefits:  benefits,
		}
	}

	return jsonResponse(http.StatusOK, map[string]interface{}{
		"tiers": resp,
	}), nil
}
