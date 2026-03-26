# Photojomo Backend — Technical Specification

## Overview

Photojomo is a photography platform with a serverless backend built on AWS. The backend is composed of Go AWS Lambda functions, a PostgreSQL database hosted on RDS, and infrastructure managed via Terraform.

---

## Repository Structure

```
photojomo-be/
├── cmd/
│   ├── contact/           # Lambda entrypoint: contact service
│   ├── submission/        # Lambda entrypoint: submission service
│   └── contest-entry/     # Lambda entrypoint: contest entry service
├── internal/
│   ├── db/                # Database connection (pgx pool, Secrets Manager)
│   ├── handler/           # Lambda request/response handlers
│   │   ├── contact.go
│   │   ├── submission.go
│   │   └── contest_entry.go
│   ├── repository/        # Database access layer
│   │   ├── contact.go
│   │   ├── contestant.go
│   │   ├── submission.go
│   │   └── contest_entry.go
│   └── idgen/             # Prefixed UUID generation
├── migrations/            # SQL migration scripts (applied manually)
├── infrastructure/        # Terraform infrastructure
├── contact-service/       # Legacy Java/Spring Boot contact service (not active)
├── Makefile               # Build and deploy targets
├── go.mod
└── go.sum
```

---

## Technology Stack

| Concern | Choice |
|---|---|
| Language | Go 1.22 |
| Lambda runtime | `provided.al2023` (custom runtime, handler: `bootstrap`) |
| Database driver | `jackc/pgx/v5` |
| Database | PostgreSQL 16.3 on Amazon RDS |
| Secrets | AWS SDK v2 — Secrets Manager |
| Image storage | AWS S3 (presigned PUT URLs) |
| Build | Go binary → zip → S3 → Lambda |
| Infrastructure | Terraform |

---

## Services

### submission-service

Registers a contestant and creates a submission for a specific contest, category, and tier.

**Endpoint:** `POST /submissions`

**Request:**
```json
{
  "firstName":         "Jane",
  "lastName":          "Doe",
  "email":             "jane@example.com",
  "country":           "Trinidad",
  "confirmImagesDates": true,
  "confirmAge":         true,
  "confirmRules":       true,
  "marketingConsent":   false,
  "contestId":          "con-eea0aef2-df89-49ab-ac26-e05cb0ee6346",
  "contestCategoryId":  "cat-fd72cc65-2e4e-4ddd-8fb4-3baa81e6994d",
  "contestTierId":      "tie-87b8ff19-7632-454b-a2f2-fafa473d930d",
  "amountPaid":         25.00,
  "paymentMethod":      "stripe"
}
```

**Required fields:** `firstName`, `lastName`, `email`, `country`, `contestId`, `contestCategoryId`, `contestTierId`, `paymentMethod`

**Response:**
```json
{
  "contestantId": "cnt-{uuid}",
  "submissionId": "sub-{uuid}",
  "message":      "Submission created successfully.",
  "success":      true
}
```

**Logic:**
1. Validate required fields
2. Begin transaction
3. Look up contestant by email — create if not found
4. Insert submission with `payment_status = pending`
5. Commit

---

### contest-entry-service

Records photo upload entries for a submission and returns presigned S3 PUT URLs for direct upload.

**Endpoint:** `POST /contest-entries/presigned-urls`

**Request:**
```json
{
  "contestantId": "cnt-{uuid}",
  "submissionId": "sub-{uuid}",
  "contestId":    "con-eea0aef2-df89-49ab-ac26-e05cb0ee6346",
  "files": [
    { "fileName": "photo.jpg", "contentType": "image/jpeg" }
  ]
}
```

**Required fields:** `contestantId`, `submissionId`, `contestId`, at least one file

**Response:**
```json
{
  "entries": [
    {
      "entryId":   "cte-{uuid}",
      "uploadUrl": "https://s3.amazonaws.com/...",
      "key":       "{contestantId}/{submissionId}/photo.jpg"
    }
  ],
  "success": true
}
```

**Logic:**
1. Validate required fields
2. Begin transaction
3. For each file: insert `contest_entry` row + generate 15-min presigned S3 PUT URL
4. Commit
5. Return all upload URLs

**S3 key format:** `{contestantId}/{submissionId}/{fileName}`

---

### contact-service

Saves general contact form submissions.

**Endpoint:** `POST /contacts`

**Request:**
```json
{
  "firstName": "Jane",
  "lastName":  "Doe",
  "email":     "jane@example.com",
  "phone":     "555-1234",
  "message":   "Hello!"
}
```

**Response:**
```json
{
  "id":      "uuid",
  "message": "Contact information saved successfully.",
  "success": true
}
```

---

## ID Format

All entity IDs use a prefixed UUID format: `{prefix}-{uuid}` (41 chars total).

| Entity | Prefix | Example |
|---|---|---|
| contest | `con` | `con-f3a04fa9-f728-44af-a1f9-39f1b9a59776` |
| contest_category | `cat` | `cat-48f67277-313d-45af-8ef1-51c2be069cab` |
| contest_tier | `tie` | `tie-5b9d6c78-1bdc-42b4-b32c-20a45f3581a7` |
| contestant | `cnt` | `cnt-{uuid}` |
| submission | `sub` | `sub-{uuid}` |
| contest_entry | `cte` | `cte-{uuid}` |

Generated via `internal/idgen/idgen.go`.

---

## Database

### Engine

PostgreSQL 16.3 on Amazon RDS (`db.t3.micro` for dev).

### Connecting Locally

Credentials are stored in `/Users/almorris/workspace/photojomo-creds/.pgpass` (gitignored). The `.pgpass` format is `host:port:database:user:password` — psql picks it up automatically.

```bash
# Dev
psql -h photojomo-dev-postgres.cijkgu6ccmfk.us-east-1.rds.amazonaws.com \
     -U photojomo_admin \
     -d photojomo
```

### Lambda Credentials

Stored in AWS Secrets Manager as a JSON secret:

```json
{
  "username": "photojomo_admin",
  "password": "...",
  "host":     "photojomo-dev-postgres.cijkgu6ccmfk.us-east-1.rds.amazonaws.com",
  "port":     "5432",
  "dbname":   "photojomo"
}
```

The Lambda fetches this secret at cold start via `internal/db/db.go`. Only the secret ARN (`DB_SECRET_ARN`) is stored as a Lambda environment variable.

### Access

- **Publicly accessible** — `publicly_accessible = true`, security group allows inbound on port `5432` from `0.0.0.0/0`
- RDS lives in **public subnets** with an internet gateway

### Connection Pool (pgx)

| Setting | Value |
|---|---|
| `MaxConns` | 2 |
| SSL | required |

### Migrations

Migration scripts live at:

```
photojomo-be/migrations/
```

Naming convention: `V{n}__{description}.sql`. Applied manually against the target environment:

```bash
psql -h <host> -U photojomo_admin -d photojomo -f migrations/V{n}__<description>.sql
```

| Version | Description |
|---|---|
| V1 | Create contacts table |
| V2 | Create contestant, submission, contest_entry tables (with enums) |
| V3 | Fix ID column lengths to VARCHAR(41) |
| V4 | Add contest, contest_category, contest_tier tables; replace category/tier enums with FK references; seed both contests |

### Schema

#### Entity Relationships

```
contest (1) ──< contest_category (*)
            ──< contest_tier (*)
            ──< contestant (*) ──< submission (*) ──< contest_entry (*)
                                        │
                                   contest_category_id (FK)
                                   contest_tier_id     (FK)
                                   contest_id          (FK)
```

#### `contacts`
General contact form submissions. Standalone — no FK relationships.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) | UUID |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `email` | VARCHAR(255) | indexed |
| `phone` | VARCHAR(30) | nullable |
| `message` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | |

#### `contest`
Top-level contest record.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(41) | `con-{uuid}` |
| `name` | VARCHAR(255) | e.g. "Capture Caribbean: First Wave" |
| `created_at` | TIMESTAMPTZ | |

#### `contest_category`
Divisions within a contest. Defined per contest so they can differ between contests.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(41) | `cat-{uuid}` |
| `contest_id` | VARCHAR(41) | FK → `contest` |
| `name` | VARCHAR(100) | e.g. "Master Your Craft" |
| `created_at` | TIMESTAMPTZ | |

#### `contest_tier`
Submission tiers within a contest. Defined per contest so pricing and limits can differ.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(41) | `tie-{uuid}` |
| `contest_id` | VARCHAR(41) | FK → `contest` |
| `name` | VARCHAR(100) | e.g. "Tier 1 – Explorer" |
| `price` | DECIMAL(10,2) | entry fee |
| `max_images` | INT | max photos per submission |
| `golden` | BOOLEAN | drives "Most Popular" badge + Golden Ticket benefit |
| `sort_order` | INT | display ordering |
| `benefits` | TEXT[] | list of benefit strings |
| `created_at` | TIMESTAMPTZ | |

#### `contestant`
One row per person entering a contest.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(41) | `cnt-{uuid}` |
| `contest_id` | VARCHAR(41) | FK → `contest` (nullable) |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `email` | VARCHAR(255) | unique |
| `country` | VARCHAR(100) | |
| `confirm_images_dates` | BOOLEAN | |
| `confirm_age` | BOOLEAN | |
| `confirm_rules` | BOOLEAN | |
| `marketing_consent` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `submission`
One entry per contestant per category. Unique on `(contestant_id, contest_category_id)`.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(41) | `sub-{uuid}` |
| `contestant_id` | VARCHAR(41) | FK → `contestant` |
| `contest_id` | VARCHAR(41) | FK → `contest` (nullable) |
| `contest_category_id` | VARCHAR(41) | FK → `contest_category` (nullable) |
| `contest_tier_id` | VARCHAR(41) | FK → `contest_tier` (nullable) |
| `amount_paid` | DECIMAL(10,2) | actual charged amount |
| `payment_method` | `payment_method_enum` | `stripe` \| `paypal` |
| `payment_status` | `payment_status_enum` | `pending` \| `paid` \| `failed` |
| `created_at` | TIMESTAMPTZ | |

#### `contest_entry`
Individual photo uploads within a submission.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(41) | `cte-{uuid}` |
| `submission_id` | VARCHAR(41) | FK → `submission` |
| `contest_id` | VARCHAR(41) | FK → `contest` (nullable) |
| `uri` | VARCHAR(500) | S3 object key |
| `created_at` | TIMESTAMPTZ | |

#### Remaining Enums

| Enum | Values |
|---|---|
| `payment_method_enum` | `stripe`, `paypal` |
| `payment_status_enum` | `pending`, `paid`, `failed` |

#### Seed Data

Two contests are pre-seeded with categories and tiers:

| Contest | ID |
|---|---|
| Capture Caribbean | `con-f3a04fa9-f728-44af-a1f9-39f1b9a59776` |
| Capture Caribbean: First Wave | `con-eea0aef2-df89-49ab-ac26-e05cb0ee6346` |

Each contest has 4 categories (General, Emerging Creator, College Creator, Master Your Craft) and 4 tiers:

| Tier | Price | Max Images | Golden |
|---|---|---|---|
| Tier 1 – Explorer | $25 | 5 | No |
| Tier 2 – Enthusiast | $45 | 10 | No |
| Tier 3 – Visionary | $65 | 15 | No |
| Tier 4 – Master | $95 | 25 | Yes |

---

## Infrastructure (Terraform)

### State Backend

Terraform state is stored remotely in S3:

| Setting | Value |
|---|---|
| Bucket | `photojomo-terraform-state` |
| Key | `photojomo-be/terraform.tfstate` |
| Region | `us-east-1` |
| Encryption | AES-256 (SSE-S3) |

### Networking

```
VPC: 10.0.0.0/16
├── Public Subnets  (RDS)
│   ├── public-a: 10.0.3.0/24  (us-east-1a)
│   └── public-b: 10.0.4.0/24  (us-east-1b)
└── Private Subnets (Lambda)
    ├── private-a: 10.0.1.0/24 (us-east-1a)
    └── private-b: 10.0.2.0/24 (us-east-1b)
```

**Security groups:**

| Group | Inbound |
|---|---|
| `lambda-sg` | none (egress all) |
| `rds-sg` | 5432 from `lambda-sg`, 5432 from `0.0.0.0/0` |
| `vpc-endpoints-sg` | 443 from `lambda-sg` |

### Lambda

| Setting | Value |
|---|---|
| Runtime | `provided.al2023` |
| Handler | `bootstrap` |
| Memory | 128 MB |
| Timeout | 10 s |
| VPC | Private subnets, `lambda-sg` |

**Environment variables (all functions):**

| Variable | Value |
|---|---|
| `DB_SECRET_ARN` | ARN of the Secrets Manager secret |

**Additional (contest-entry-service):**

| Variable | Value |
|---|---|
| `IMAGES_BUCKET` | S3 bucket name for contest images |

### API Gateway

HTTP API (v2):

| Route | Service |
|---|---|
| `POST /submissions` | submission-service |
| `POST /contest-entries/presigned-urls` | contest-entry-service |
| `POST /contacts` | contact-service |

CORS enabled for all origins (`*`).

### Artifacts Bucket

Lambda zips are uploaded to S3 before deployment:

| Setting | Value |
|---|---|
| Bucket | `photojomo-{environment}-lambda-artifacts` |
| Keys | `contact-service/contact.zip`, `submission-service/submission.zip`, `contest-entry-service/contest-entry.zip` |
| Versioning | Enabled |

### Images Bucket

| Setting | Value |
|---|---|
| Bucket | `photojomo-{environment}-contest-images` |
| CORS | PUT from all origins, 3000s max age |

---

## Build & Deploy

### Build all services

```bash
cd photojomo-be
make all
```

### Deploy a single service

```bash
# Available targets: deploy-contact, deploy-submission, deploy-contest-entry
make deploy-submission ENV=dev
make deploy-contest-entry ENV=dev
make deploy-contact ENV=dev
```

Each deploy target runs: build → upload zip to S3 → update Lambda function code.

### First-time infrastructure

```bash
cd photojomo-be/infrastructure
cp terraform.tfvars.example terraform.tfvars
# Set db_password in terraform.tfvars
terraform init
terraform plan
terraform apply
```

---

## Future Work

- [ ] Payment processing (Stripe/PayPal webhook to update `payment_status`)
- [ ] Input validation (email format, country allowlist)
- [ ] Global error handling and structured error responses
- [ ] Unit and integration tests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] RDS Proxy for connection pooling
- [ ] Tighten RDS security group to known IP ranges
- [ ] DynamoDB state locking for Terraform
