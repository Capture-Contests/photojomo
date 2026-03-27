ALTER TABLE submission ADD COLUMN stripe_payment_intent_id VARCHAR(255);

CREATE UNIQUE INDEX idx_submission_stripe_payment_intent ON submission (stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;
