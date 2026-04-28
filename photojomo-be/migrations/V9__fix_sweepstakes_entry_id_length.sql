-- ── sweepstakes_entry: fix id column length (swp- prefix + UUID = 40 chars) ──

ALTER TABLE sweepstakes_entry ALTER COLUMN id TYPE VARCHAR(40);
