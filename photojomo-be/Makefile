GOOS        = linux
GOARCH      = amd64
CGO_ENABLED = 0
LDFLAGS     = -ldflags="-s -w"
DIST        = dist

# ── Targets ───────────────────────────────────────────────────────────────────

.PHONY: all clean $(DIST) build-contact deploy-contact build-submission deploy-submission build-contest-entry deploy-contest-entry build-stripe-webhook deploy-stripe-webhook build-payment-intent deploy-payment-intent

all: build-contact build-submission build-contest-entry build-stripe-webhook build-payment-intent

# ── Build ─────────────────────────────────────────────────────────────────────

build-contact: $(DIST)
	GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
		go build $(LDFLAGS) -o bootstrap ./cmd/contact/
	zip -j $(DIST)/contact.zip bootstrap
	rm bootstrap
	@echo "Built: $(DIST)/contact.zip"

build-submission: $(DIST)
	GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
		go build $(LDFLAGS) -o bootstrap ./cmd/submission/
	zip -j $(DIST)/submission.zip bootstrap
	rm bootstrap
	@echo "Built: $(DIST)/submission.zip"

deploy-submission: build-submission
	aws s3 cp $(DIST)/submission.zip \
		s3://$(PROJECT)-$(ENV)-lambda-artifacts/submission-service/submission.zip \
		--region $(REGION)
	aws lambda update-function-code \
		--function-name $(PROJECT)-$(ENV)-submission-service \
		--s3-bucket $(PROJECT)-$(ENV)-lambda-artifacts \
		--s3-key submission-service/submission.zip \
		--region $(REGION)
	@echo "Deployed submission lambda to $(ENV)"

build-contest-entry: $(DIST)
	GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
		go build $(LDFLAGS) -o bootstrap ./cmd/contest-entry/
	zip -j $(DIST)/contest-entry.zip bootstrap
	rm bootstrap
	@echo "Built: $(DIST)/contest-entry.zip"

build-payment-intent: $(DIST)
	GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
		go build $(LDFLAGS) -o bootstrap ./cmd/payment-intent/
	zip -j $(DIST)/payment-intent.zip bootstrap
	rm bootstrap
	@echo "Built: $(DIST)/payment-intent.zip"

build-stripe-webhook: $(DIST)
	GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
		go build $(LDFLAGS) -o bootstrap ./cmd/stripe-webhook/
	zip -j $(DIST)/stripe-webhook.zip bootstrap
	rm bootstrap
	@echo "Built: $(DIST)/stripe-webhook.zip"

# Add future lambdas here following the same pattern:
# build-<name>: $(DIST)
#   GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
#     go build $(LDFLAGS) -o bootstrap ./cmd/<name>/
#   zip -j $(DIST)/<name>.zip bootstrap
#   rm bootstrap

# ── Deploy ────────────────────────────────────────────────────────────────────

ENV     ?= dev
PROJECT ?= photojomo
REGION  ?= us-east-1

deploy-contest-entry: build-contest-entry
	aws s3 cp $(DIST)/contest-entry.zip \
		s3://$(PROJECT)-$(ENV)-lambda-artifacts/contest-entry-service/contest-entry.zip \
		--region $(REGION)
	aws lambda update-function-code \
		--function-name $(PROJECT)-$(ENV)-contest-entry-service \
		--s3-bucket $(PROJECT)-$(ENV)-lambda-artifacts \
		--s3-key contest-entry-service/contest-entry.zip \
		--region $(REGION)
	@echo "Deployed contest-entry lambda to $(ENV)"

deploy-payment-intent: build-payment-intent
	aws s3 cp $(DIST)/payment-intent.zip \
		s3://$(PROJECT)-$(ENV)-lambda-artifacts/payment-intent-service/payment-intent.zip \
		--region $(REGION)
	aws lambda update-function-code \
		--function-name $(PROJECT)-$(ENV)-payment-intent-service \
		--s3-bucket $(PROJECT)-$(ENV)-lambda-artifacts \
		--s3-key payment-intent-service/payment-intent.zip \
		--region $(REGION)
	@echo "Deployed payment-intent lambda to $(ENV)"

deploy-stripe-webhook: build-stripe-webhook
	aws s3 cp $(DIST)/stripe-webhook.zip \
		s3://$(PROJECT)-$(ENV)-lambda-artifacts/stripe-webhook-service/stripe-webhook.zip \
		--region $(REGION)
	aws lambda update-function-code \
		--function-name $(PROJECT)-$(ENV)-stripe-webhook-service \
		--s3-bucket $(PROJECT)-$(ENV)-lambda-artifacts \
		--s3-key stripe-webhook-service/stripe-webhook.zip \
		--region $(REGION)
	@echo "Deployed stripe-webhook lambda to $(ENV)"

deploy-contact: build-contact
	aws s3 cp $(DIST)/contact.zip \
		s3://$(PROJECT)-$(ENV)-lambda-artifacts/contact-service/contact.zip \
		--region $(REGION)
	aws lambda update-function-code \
		--function-name $(PROJECT)-$(ENV)-contact-service \
		--s3-bucket $(PROJECT)-$(ENV)-lambda-artifacts \
		--s3-key contact-service/contact.zip \
		--region $(REGION)
	@echo "Deployed contact lambda to $(ENV)"

# ── Helpers ───────────────────────────────────────────────────────────────────

$(DIST):
	mkdir -p $(DIST)

clean:
	rm -rf $(DIST) bootstrap

tidy:
	go mod tidy
