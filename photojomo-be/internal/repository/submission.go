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
	PaypalOrderID         string
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

func (r *SubmissionRepository) UpdatePaymentStatusByPaypalOrderID(ctx context.Context, paypalOrderID string, status string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE submission SET payment_status = $1 WHERE paypal_order_id = $2
	`, status, paypalOrderID)
	if err != nil {
		return fmt.Errorf("updating payment status by paypal order id: %w", err)
	}
	return nil
}

// SubmissionContact holds the data needed to subscribe a contestant to Mailchimp.
type SubmissionContact struct {
	Email        string
	FirstName    string
	LastName     string
	CategoryName string
}

func (r *SubmissionRepository) FindContactByPaymentIntentID(ctx context.Context, paymentIntentID string) (*SubmissionContact, error) {
	var sc SubmissionContact
	err := r.db.QueryRow(ctx, `
		SELECT c.email, c.first_name, c.last_name, cc.name
		FROM submission s
		JOIN contestant c ON c.id = s.contestant_id
		JOIN contest_category cc ON cc.id = s.contest_category_id
		WHERE s.stripe_payment_intent_id = $1
	`, paymentIntentID).Scan(&sc.Email, &sc.FirstName, &sc.LastName, &sc.CategoryName)
	if err != nil {
		return nil, fmt.Errorf("finding contact by payment intent id: %w", err)
	}
	return &sc, nil
}

func (r *SubmissionRepository) FindContactByPaypalOrderID(ctx context.Context, paypalOrderID string) (*SubmissionContact, error) {
	var sc SubmissionContact
	err := r.db.QueryRow(ctx, `
		SELECT c.email, c.first_name, c.last_name, cc.name
		FROM submission s
		JOIN contestant c ON c.id = s.contestant_id
		JOIN contest_category cc ON cc.id = s.contest_category_id
		WHERE s.paypal_order_id = $1
	`, paypalOrderID).Scan(&sc.Email, &sc.FirstName, &sc.LastName, &sc.CategoryName)
	if err != nil {
		return nil, fmt.Errorf("finding contact by paypal order id: %w", err)
	}
	return &sc, nil
}

func (r *SubmissionRepository) Save(ctx context.Context, tx pgx.Tx, s Submission) (string, error) {
	id := idgen.New("sub")

	var stripePaymentIntentID *string
	if s.StripePaymentIntentID != "" {
		stripePaymentIntentID = &s.StripePaymentIntentID
	}

	var paypalOrderID *string
	if s.PaypalOrderID != "" {
		paypalOrderID = &s.PaypalOrderID
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO submission (
			id, contestant_id, contest_id, contest_category_id, contest_tier_id,
			amount_paid, payment_method, payment_status, stripe_payment_intent_id,
			paypal_order_id, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, NOW())
	`, id, s.ContestantID, s.ContestID, s.ContestCategoryID, s.ContestTierID, s.AmountPaid, s.PaymentMethod, stripePaymentIntentID, paypalOrderID,
	)
	if err != nil {
		return "", fmt.Errorf("inserting submission: %w", err)
	}

	return id, nil
}
