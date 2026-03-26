package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/photojomo/photojomo-be/internal/repository"
)

type fileInput struct {
	FileName    string `json:"fileName"`
	ContentType string `json:"contentType"`
}

type contestEntryRequest struct {
	ContestantID string      `json:"contestantId"`
	SubmissionID string      `json:"submissionId"`
	ContestID    string      `json:"contestId"`
	Files        []fileInput `json:"files"`
}

type entryResult struct {
	EntryID   string `json:"entryId"`
	UploadURL string `json:"uploadUrl"`
	Key       string `json:"key"`
}

type ContestEntryHandler struct {
	db           *pgxpool.Pool
	entries      *repository.ContestEntryRepository
	presign      *s3.PresignClient
	imagesBucket string
}

func NewContestEntryHandler(
	db *pgxpool.Pool,
	entries *repository.ContestEntryRepository,
	s3Client *s3.Client,
	imagesBucket string,
) *ContestEntryHandler {
	return &ContestEntryHandler{
		db:           db,
		entries:      entries,
		presign:      s3.NewPresignClient(s3Client),
		imagesBucket: imagesBucket,
	}
}

func (h *ContestEntryHandler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body contestEntryRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "Invalid request body",
			"success": false,
		}), nil
	}

	if body.ContestantID == "" || body.SubmissionID == "" || body.ContestID == "" {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "contestantId, submissionId, and contestId are required",
			"success": false,
		}), nil
	}

	if len(body.Files) == 0 {
		return jsonResponse(http.StatusBadRequest, map[string]interface{}{
			"message": "at least one file is required",
			"success": false,
		}), nil
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		log.Printf("error beginning transaction: %v", err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": "Internal server error",
			"success": false,
		}), nil
	}
	defer tx.Rollback(ctx)

	results := make([]entryResult, 0, len(body.Files))

	for _, f := range body.Files {
		key := fmt.Sprintf("%s/%s/%s", body.ContestantID, body.SubmissionID, f.FileName)

		entryID, err := h.entries.Save(ctx, tx, repository.ContestEntry{
			SubmissionID: body.SubmissionID,
			ContestID:    body.ContestID,
			URI:          key,
		})
		if err != nil {
			log.Printf("error saving contest_entry: %v", err)
			return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
				"message": "Internal server error",
				"success": false,
			}), nil
		}

		presigned, err := h.presign.PresignPutObject(ctx, &s3.PutObjectInput{
			Bucket:      aws.String(h.imagesBucket),
			Key:         aws.String(key),
			ContentType: aws.String(f.ContentType),
		}, func(opts *s3.PresignOptions) {
			opts.Expires = 15 * time.Minute
		})
		if err != nil {
			log.Printf("error generating presigned URL: %v", err)
			return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
				"message": "Internal server error",
				"success": false,
			}), nil
		}

		results = append(results, entryResult{
			EntryID:   entryID,
			UploadURL: presigned.URL,
			Key:       key,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("error committing transaction: %v", err)
		return jsonResponse(http.StatusInternalServerError, map[string]interface{}{
			"message": "Internal server error",
			"success": false,
		}), nil
	}

	return jsonResponse(http.StatusCreated, map[string]interface{}{
		"entries": results,
		"success": true,
	}), nil
}
