---
name: contest-data
description: Query and display contest and contestant submission data from the Photojomo database
allowed-tools: Bash
---

Fetch and display contestant and submission data from the Photojomo PostgreSQL database.

## Steps

1. Run this query using `psql`:

```bash
psql -h photojomo-dev-postgres.cijkgu6ccmfk.us-east-1.rds.amazonaws.com -U photojomo_admin -d photojomo --no-psqlrc -c "<query>"
```

Using this SQL:

```sql
SELECT
  c.first_name,
  c.last_name,
  s.amount_paid,
  cont.name        AS contest,
  c.email,
  cat.name         AS category,
  tier.name        AS tier,
  s.payment_status,
  s.payment_method,
  COALESCE(s.stripe_payment_intent_id, s.paypal_order_id) AS payment_id
FROM contestant c
JOIN submission s           ON c.id = s.contestant_id
JOIN contest_category cat   ON s.contest_category_id = cat.id
JOIN contest cont            ON cont.id = c.contest_id
JOIN contest_tier tier       ON tier.id = s.contest_tier_id;
```

3. Display the results as a clean markdown table with columns:
First Name | Last Name | Email | Contest | Category | Tier | Amount Paid | Payment Status | Payment Method | Payment ID
