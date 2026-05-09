package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ContestTier struct {
	ID        string
	ContestID string
	Name      string
	Price     float64
	MaxImages int
	Golden    bool
	SortOrder int
	Benefits  []string
}

type ContestTierRepository struct {
	db *pgxpool.Pool
}

func NewContestTierRepository(db *pgxpool.Pool) *ContestTierRepository {
	return &ContestTierRepository{db: db}
}

func (r *ContestTierRepository) FindByContestID(ctx context.Context, contestID string) ([]ContestTier, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, contest_id, name, price, max_images, golden, sort_order, benefits
		FROM contest_tier
		WHERE contest_id = $1
		ORDER BY sort_order ASC
	`, contestID)
	if err != nil {
		return nil, fmt.Errorf("querying contest tiers: %w", err)
	}
	defer rows.Close()

	var tiers []ContestTier
	for rows.Next() {
		var t ContestTier
		if err := rows.Scan(&t.ID, &t.ContestID, &t.Name, &t.Price, &t.MaxImages, &t.Golden, &t.SortOrder, &t.Benefits); err != nil {
			return nil, fmt.Errorf("scanning contest tier: %w", err)
		}
		tiers = append(tiers, t)
	}
	return tiers, rows.Err()
}

func (r *ContestTierRepository) FindByID(ctx context.Context, id string) (*ContestTier, error) {
	var t ContestTier
	err := r.db.QueryRow(ctx, `
		SELECT id, contest_id, name, price, max_images, golden, sort_order, benefits
		FROM contest_tier
		WHERE id = $1
	`, id).Scan(&t.ID, &t.ContestID, &t.Name, &t.Price, &t.MaxImages, &t.Golden, &t.SortOrder, &t.Benefits)
	if err != nil {
		return nil, fmt.Errorf("finding contest tier by id: %w", err)
	}
	return &t, nil
}
