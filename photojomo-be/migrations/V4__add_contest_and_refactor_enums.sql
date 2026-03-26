-- ── Clear existing demo data ──────────────────────────────────────────────────

TRUNCATE TABLE contest_entry, submission, contestant;

-- ── contest ───────────────────────────────────────────────────────────────────

CREATE TABLE contest (
    id         VARCHAR(41)              NOT NULL,
    name       VARCHAR(255)             NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT pk_contest PRIMARY KEY (id)
);

-- ── contest_category ──────────────────────────────────────────────────────────

CREATE TABLE contest_category (
    id         VARCHAR(41)              NOT NULL,
    contest_id VARCHAR(41)              NOT NULL,
    name       VARCHAR(100)             NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT pk_contest_category         PRIMARY KEY (id),
    CONSTRAINT fk_contest_category_contest FOREIGN KEY (contest_id) REFERENCES contest (id)
);

CREATE INDEX idx_contest_category_contest ON contest_category (contest_id);

-- ── contest_tier ──────────────────────────────────────────────────────────────

CREATE TABLE contest_tier (
    id         VARCHAR(41)              NOT NULL,
    contest_id VARCHAR(41)              NOT NULL,
    name       VARCHAR(100)             NOT NULL,
    price      DECIMAL(10,2)            NOT NULL,
    max_images INT                      NOT NULL,
    golden     BOOLEAN                  NOT NULL DEFAULT FALSE,
    sort_order INT                      NOT NULL,
    benefits   TEXT[]                   NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT pk_contest_tier         PRIMARY KEY (id),
    CONSTRAINT fk_contest_tier_contest FOREIGN KEY (contest_id) REFERENCES contest (id)
);

CREATE INDEX idx_contest_tier_contest ON contest_tier (contest_id);

-- ── add contest_id to contestant ──────────────────────────────────────────────

ALTER TABLE contestant
    ADD COLUMN contest_id VARCHAR(41),
    ADD CONSTRAINT fk_contestant_contest FOREIGN KEY (contest_id) REFERENCES contest (id);

CREATE INDEX idx_contestant_contest ON contestant (contest_id);

-- ── refactor submission: replace enum columns with FK columns ─────────────────

DROP INDEX idx_submission_category;

ALTER TABLE submission
    DROP COLUMN category,
    DROP COLUMN tier,
    ADD COLUMN contest_id          VARCHAR(41),
    ADD COLUMN contest_category_id VARCHAR(41),
    ADD COLUMN contest_tier_id     VARCHAR(41),
    ADD CONSTRAINT fk_submission_contest          FOREIGN KEY (contest_id)          REFERENCES contest (id),
    ADD CONSTRAINT fk_submission_contest_category FOREIGN KEY (contest_category_id) REFERENCES contest_category (id),
    ADD CONSTRAINT fk_submission_contest_tier     FOREIGN KEY (contest_tier_id)     REFERENCES contest_tier (id);

CREATE INDEX idx_submission_contest          ON submission (contest_id);
CREATE INDEX idx_submission_contest_category ON submission (contest_category_id);
CREATE INDEX idx_submission_contest_tier     ON submission (contest_tier_id);
CREATE UNIQUE INDEX idx_submission_contestant_category ON submission (contestant_id, contest_category_id);

-- ── add contest_id to contest_entry ──────────────────────────────────────────

ALTER TABLE contest_entry
    ADD COLUMN contest_id VARCHAR(41),
    ADD CONSTRAINT fk_contest_entry_contest FOREIGN KEY (contest_id) REFERENCES contest (id);

CREATE INDEX idx_contest_entry_contest ON contest_entry (contest_id);

-- ── drop unused enums ─────────────────────────────────────────────────────────

DROP TYPE category_enum;
DROP TYPE tier_enum;

-- ── seed: contests ────────────────────────────────────────────────────────────

INSERT INTO contest (id, name, created_at) VALUES
    ('con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'Capture Caribbean',             NOW()),
    ('con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'Capture Caribbean: First Wave', NOW());

-- ── seed: contest_category ────────────────────────────────────────────────────

-- Capture Caribbean
INSERT INTO contest_category (id, contest_id, name, created_at) VALUES
    ('cat-48f67277-313d-45af-8ef1-51c2be069cab', 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'General',           NOW()),
    ('cat-70a8624d-4b6c-40e5-988f-1e919ad69c01', 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'Emerging Creator',  NOW()),
    ('cat-edac2543-f68c-4f92-b30f-c04bbe77f676', 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'College Creator',   NOW()),
    ('cat-08455cbb-f706-4452-b7e4-dba8768f5aa4', 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'Master Your Craft', NOW());

-- Capture Caribbean: First Wave
INSERT INTO contest_category (id, contest_id, name, created_at) VALUES
    ('cat-fd72cc65-2e4e-4ddd-8fb4-3baa81e6994d', 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'General',           NOW()),
    ('cat-f09e8657-a3f7-4d62-bcd8-66e949aaaa99', 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'Emerging Creator',  NOW()),
    ('cat-6348b22a-6e80-4dd6-a7fd-98baeca7521f', 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'College Creator',   NOW()),
    ('cat-ad124888-7c4b-480b-a4c4-cf2f39f33afa', 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'Master Your Craft', NOW());

-- ── seed: contest_tier ────────────────────────────────────────────────────────

-- Capture Caribbean
INSERT INTO contest_tier (id, contest_id, name, price, max_images, golden, sort_order, benefits, created_at) VALUES
    ('tie-5b9d6c78-1bdc-42b4-b32c-20a45f3581a7', 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'Tier 1 – Explorer',   25.00,  5, FALSE, 1, ARRAY['Eligible for judging', 'Founding Class Member Badge'], NOW()),
    ('tie-1e1246fb-51b2-4f4b-a768-de4ca698a789', 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'Tier 2 – Enthusiast', 45.00, 10, FALSE, 2, ARRAY['Eligible for judging', 'Founding Class Member Badge'], NOW()),
    ('tie-11932a50-ef36-4840-86fc-ef328ff77225', 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'Tier 3 – Visionary',  65.00, 15, FALSE, 3, ARRAY['Eligible for judging', 'Founding Class Member Badge'], NOW()),
    ('tie-0376c878-1d85-4be5-ab24-945aedcdf353', 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776', 'Tier 4 – Master',     95.00, 25, TRUE,  4, ARRAY['Eligible for judging', 'Founding Class Member Badge', 'Golden Ticket'], NOW());

-- Capture Caribbean: First Wave
INSERT INTO contest_tier (id, contest_id, name, price, max_images, golden, sort_order, benefits, created_at) VALUES
    ('tie-87b8ff19-7632-454b-a2f2-fafa473d930d', 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'Tier 1 – Explorer',   25.00,  5, FALSE, 1, ARRAY['Eligible for judging', 'Founding Class Member Badge'], NOW()),
    ('tie-113874c3-37a1-437c-b961-b4eeec7c178b', 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'Tier 2 – Enthusiast', 45.00, 10, FALSE, 2, ARRAY['Eligible for judging', 'Founding Class Member Badge'], NOW()),
    ('tie-708b7942-7538-47ca-b1ed-cc184757fe68', 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'Tier 3 – Visionary',  65.00, 15, FALSE, 3, ARRAY['Eligible for judging', 'Founding Class Member Badge'], NOW()),
    ('tie-a5fd1747-4d05-4c8c-ac08-13671177c3de', 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346', 'Tier 4 – Master',     95.00, 25, TRUE,  4, ARRAY['Eligible for judging', 'Founding Class Member Badge', 'Golden Ticket'], NOW());
