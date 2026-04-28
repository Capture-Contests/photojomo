package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SweepstakesEntry struct {
	FirstName           string
	LastName            string
	Email               string
	PhoneNumber         string
	Address             string
	City                string
	StateProvince       string
	ZipPostalCode       string
	CountryOfResidence  string
	ContentType         string
	AgreedToRules       bool
	Descriptors         []string
	TravelContentDetail string
	SharingPlatforms    []string
	TopExperiences      []string
	TypicalSpend        string
	ReferralSource      string
	BonusEntry          bool
}

type SweepstakesRepository struct {
	db *pgxpool.Pool
}

func NewSweepstakesRepository(db *pgxpool.Pool) *SweepstakesRepository {
	return &SweepstakesRepository{db: db}
}

func (r *SweepstakesRepository) Save(ctx context.Context, entry SweepstakesEntry) (string, error) {
	id := "swp-" + uuid.New().String()

	_, err := r.db.Exec(ctx, `
		INSERT INTO sweepstakes_entry (
			id, first_name, last_name, email, phone_number,
			address, city, state_province, zip_postal_code,
			country_of_residence, content_type, agreed_to_rules,
			descriptors, travel_content_detail, sharing_platforms,
			top_experiences, typical_spend, referral_source, bonus_entry,
			created_at
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9,
			$10, $11, $12,
			$13, $14, $15,
			$16, $17, $18, $19,
			NOW()
		)
	`,
		id,
		entry.FirstName,
		entry.LastName,
		entry.Email,
		entry.PhoneNumber,
		entry.Address,
		entry.City,
		entry.StateProvince,
		entry.ZipPostalCode,
		entry.CountryOfResidence,
		nullableString(entry.ContentType),
		entry.AgreedToRules,
		entry.Descriptors,
		nullableString(entry.TravelContentDetail),
		entry.SharingPlatforms,
		entry.TopExperiences,
		nullableString(entry.TypicalSpend),
		nullableString(entry.ReferralSource),
		entry.BonusEntry,
	)
	if err != nil {
		return "", fmt.Errorf("inserting sweepstakes entry: %w", err)
	}

	return id, nil
}
