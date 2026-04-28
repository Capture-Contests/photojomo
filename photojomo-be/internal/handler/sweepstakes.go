package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/photojomo/photojomo-be/internal/repository"
)

type SweepstakesRequest struct {
	FirstName           string   `json:"firstName"`
	LastName            string   `json:"lastName"`
	Email               string   `json:"email"`
	ConfirmEmail        string   `json:"confirmEmail"`
	PhoneNumber         string   `json:"phoneNumber"`
	Address             string   `json:"address"`
	City                string   `json:"city"`
	StateProvince       string   `json:"stateProvince"`
	ZipPostalCode       string   `json:"zipPostalCode"`
	CountryOfResidence  string   `json:"countryOfResidence"`
	ContentType         string   `json:"contentType,omitempty"`
	AgreedToRules       bool     `json:"agreedToRules"`
	Descriptors         []string `json:"descriptors,omitempty"`
	TravelContentDetail string   `json:"travelContentDetail,omitempty"`
	SharingPlatforms    []string `json:"sharingPlatforms,omitempty"`
	TopExperiences      []string `json:"topExperiences,omitempty"`
	TypicalSpend        string   `json:"typicalSpend,omitempty"`
	ReferralSource      string   `json:"referralSource,omitempty"`
	BonusEntry          bool     `json:"bonusEntry"`
}

type SweepstakesResponse struct {
	ID      string `json:"id"`
	Message string `json:"message"`
	Success bool   `json:"success"`
}

type SweepstakesHandler struct {
	repo *repository.SweepstakesRepository
}

func NewSweepstakesHandler(repo *repository.SweepstakesRepository) *SweepstakesHandler {
	return &SweepstakesHandler{repo: repo}
}

func (h *SweepstakesHandler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body SweepstakesRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "Invalid request body",
			"success": false,
		}), nil
	}

	if strings.TrimSpace(body.FirstName) == "" ||
		strings.TrimSpace(body.LastName) == "" ||
		strings.TrimSpace(body.Email) == "" ||
		strings.TrimSpace(body.PhoneNumber) == "" ||
		strings.TrimSpace(body.Address) == "" ||
		strings.TrimSpace(body.City) == "" ||
		strings.TrimSpace(body.StateProvince) == "" ||
		strings.TrimSpace(body.ZipPostalCode) == "" ||
		strings.TrimSpace(body.CountryOfResidence) == "" {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "All required fields must be provided",
			"success": false,
		}), nil
	}

	if !strings.EqualFold(body.Email, body.ConfirmEmail) {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "Email and confirm email do not match",
			"success": false,
		}), nil
	}

	if !body.AgreedToRules {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "You must agree to the Sweepstakes Official Rules",
			"success": false,
		}), nil
	}

	id, err := h.repo.Save(ctx, repository.SweepstakesEntry{
		FirstName:           strings.TrimSpace(body.FirstName),
		LastName:            strings.TrimSpace(body.LastName),
		Email:               strings.ToLower(strings.TrimSpace(body.Email)),
		PhoneNumber:         strings.TrimSpace(body.PhoneNumber),
		Address:             strings.TrimSpace(body.Address),
		City:                strings.TrimSpace(body.City),
		StateProvince:       strings.TrimSpace(body.StateProvince),
		ZipPostalCode:       strings.TrimSpace(body.ZipPostalCode),
		CountryOfResidence:  strings.TrimSpace(body.CountryOfResidence),
		ContentType:         strings.TrimSpace(body.ContentType),
		AgreedToRules:       body.AgreedToRules,
		Descriptors:         body.Descriptors,
		TravelContentDetail: strings.TrimSpace(body.TravelContentDetail),
		SharingPlatforms:    body.SharingPlatforms,
		TopExperiences:      body.TopExperiences,
		TypicalSpend:        strings.TrimSpace(body.TypicalSpend),
		ReferralSource:      strings.TrimSpace(body.ReferralSource),
		BonusEntry:          body.BonusEntry,
	})
	if err != nil {
		log.Printf("error saving sweepstakes entry: %v", err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": "Failed to save entry",
			"success": false,
		}), nil
	}

	return jsonResponse(http.StatusCreated, SweepstakesResponse{
		ID:      id,
		Message: "Sweepstakes entry submitted successfully.",
		Success: true,
	}), nil
}
