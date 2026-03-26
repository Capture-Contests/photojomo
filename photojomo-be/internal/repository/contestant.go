package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/photojomo/photojomo-be/internal/idgen"
)

type ContestantRepository struct {
	db *pgxpool.Pool
}

func NewContestantRepository(db *pgxpool.Pool) *ContestantRepository {
	return &ContestantRepository{db: db}
}

type Contestant struct {
	ID                 string
	FirstName          string
	LastName           string
	Email              string
	Country            string
	ConfirmImagesDates bool
	ConfirmAge         bool
	ConfirmRules       bool
	MarketingConsent   bool
	ContestID          string
}

func (r *ContestantRepository) FindByEmail(ctx context.Context, email string) (*Contestant, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, first_name, last_name, email, country,
		       confirm_images_dates, confirm_age, confirm_rules, marketing_consent
		FROM contestant
		WHERE email = $1
	`, email)

	var c Contestant
	err := row.Scan(
		&c.ID, &c.FirstName, &c.LastName, &c.Email, &c.Country,
		&c.ConfirmImagesDates, &c.ConfirmAge, &c.ConfirmRules, &c.MarketingConsent,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("querying contestant by email: %w", err)
	}

	return &c, nil
}

func (r *ContestantRepository) Save(ctx context.Context, tx pgx.Tx, c Contestant) (string, error) {
	id := idgen.New("cnt")

	_, err := tx.Exec(ctx, `
		INSERT INTO contestant (
			id, first_name, last_name, email, country,
			confirm_images_dates, confirm_age, confirm_rules, marketing_consent,
			contest_id, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
	`, id, c.FirstName, c.LastName, c.Email, c.Country,
		c.ConfirmImagesDates, c.ConfirmAge, c.ConfirmRules, c.MarketingConsent,
		c.ContestID,
	)
	if err != nil {
		return "", fmt.Errorf("inserting contestant: %w", err)
	}

	return id, nil
}
