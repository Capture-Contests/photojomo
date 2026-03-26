package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/photojomo/photojomo-be/internal/idgen"
)

type ContestEntryRepository struct{}

func NewContestEntryRepository() *ContestEntryRepository {
	return &ContestEntryRepository{}
}

type ContestEntry struct {
	SubmissionID string
	ContestID    string
	URI          string
}

func (r *ContestEntryRepository) Save(ctx context.Context, tx pgx.Tx, e ContestEntry) (string, error) {
	id := idgen.New("cte")

	_, err := tx.Exec(ctx, `
		INSERT INTO contest_entry (id, submission_id, contest_id, uri, created_at)
		VALUES ($1, $2, $3, $4, NOW())
	`, id, e.SubmissionID, e.ContestID, e.URI)
	if err != nil {
		return "", fmt.Errorf("inserting contest_entry: %w", err)
	}

	return id, nil
}
