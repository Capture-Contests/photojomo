-- ── sweepstakes_entry: add Tier 2 fields ──────────────────────────────────────

ALTER TABLE sweepstakes_entry
    ADD COLUMN descriptors          TEXT[],
    ADD COLUMN travel_content_detail TEXT,
    ADD COLUMN sharing_platforms    TEXT[],
    ADD COLUMN top_experiences      TEXT[],
    ADD COLUMN typical_spend        VARCHAR(50),
    ADD COLUMN referral_source      VARCHAR(100),
    ADD COLUMN bonus_entry          BOOLEAN NOT NULL DEFAULT FALSE;
