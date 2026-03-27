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
	ContestantID          string
	ContestID             string
	ContestCategoryID     string
	ContestTierID         string
	AmountPaid            float64
	PaymentMethod         string
	StripePaymentIntentID string
}

func (r *SubmissionRepository) UpdatePaymentStatus(ctx context.Context, id string, status string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE submission SET payment_status = $1 WHERE id = $2
	`, status, id)
	if err != nil {
		return fmt.Errorf("updating payment status: %w", err)
	}
	return nil
}

func (r *SubmissionRepository) FindIDByPaymentIntentID(ctx context.Context, paymentIntentID string) (string, error) {
	var id string
	err := r.db.QueryRow(ctx, `
		SELECT id FROM submission WHERE stripe_payment_intent_id = $1
	`, paymentIntentID).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("finding submission by payment intent id: %w", err)
	}
	return id, nil
}

func (r *SubmissionRepository) UpdatePaymentStatusByPaymentIntentID(ctx context.Context, paymentIntentID string, status string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE submission SET payment_status = $1 WHERE stripe_payment_intent_id = $2
	`, status, paymentIntentID)
	if err != nil {
		return fmt.Errorf("updating payment status by payment intent id: %w", err)
	}
	return nil
}

func (r *SubmissionRepository) Save(ctx context.Context, tx pgx.Tx, s Submission) (string, error) {
	id := idgen.New("sub")

	var stripePaymentIntentID *string
	if s.StripePaymentIntentID != "" {
		stripePaymentIntentID = &s.StripePaymentIntentID
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO submission (
			id, contestant_id, contest_id, contest_category_id, contest_tier_id,
			amount_paid, payment_method, payment_status, stripe_payment_intent_id,
			created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW())
	`, id, s.ContestantID, s.ContestID, s.ContestCategoryID, s.ContestTierID, s.AmountPaid, s.PaymentMethod, stripePaymentIntentID,
	)
	if err != nil {
		return "", fmt.Errorf("inserting submission: %w", err)
	}

	return id, nil
}
