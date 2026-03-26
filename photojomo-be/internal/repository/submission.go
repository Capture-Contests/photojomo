package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/photojomo/photojomo-be/internal/idgen"
)

type SubmissionRepository struct {
	db *pgxpool.Pool
}

func NewSubmissionRepository(db *pgxpool.Pool) *SubmissionRepository {
	return &SubmissionRepository{db: db}
}

type Submission struct {
	ContestantID      string
	ContestID         string
	ContestCategoryID string
	ContestTierID     string
	AmountPaid        float64
	PaymentMethod     string
}

func (r *SubmissionRepository) Save(ctx context.Context, tx pgx.Tx, s Submission) (string, error) {
	id := idgen.New("sub")

	_, err := tx.Exec(ctx, `
		INSERT INTO submission (
			id, contestant_id, contest_id, contest_category_id, contest_tier_id,
			amount_paid, payment_method, payment_status,
			created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
	`, id, s.ContestantID, s.ContestID, s.ContestCategoryID, s.ContestTierID, s.AmountPaid, s.PaymentMethod,
	)
	if err != nil {
		return "", fmt.Errorf("inserting submission: %w", err)
	}

	return id, nil
}
