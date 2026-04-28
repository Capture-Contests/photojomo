PROJECT      = capture-caribbean-sweepstakes
DIST         = dist/capture-caribbean-sweepstakes-wb/browser
CF_ACCOUNT   = e6a409663bf73140c8bd4caaadd9ebc2
NPX          = npx
NODE         = node

# ── Targets ───────────────────────────────────────────────────────────────────

.PHONY: build deploy deploy-dev clean

# ── Build ─────────────────────────────────────────────────────────────────────

build:
	$(NPX) ng build
	@echo "Built: $(DIST)"

# ── Deploy ────────────────────────────────────────────────────────────────────

deploy: build
	CLOUDFLARE_ACCOUNT_ID=$(CF_ACCOUNT) $(NPX) wrangler pages deploy $(DIST) \
		--project-name $(PROJECT) \
		--branch=main \
		--commit-dirty=true
	@echo "Deployed to Cloudflare Pages: $(PROJECT)"

deploy-dev: build
	CLOUDFLARE_ACCOUNT_ID=$(CF_ACCOUNT) $(NPX) wrangler pages deploy $(DIST) \
		--project-name $(PROJECT)-dev \
		--branch=dev-sweepstakes \
		--commit-dirty=true
	@echo "Deployed to Cloudflare Pages: $(PROJECT)-dev"

# ── Helpers ───────────────────────────────────────────────────────────────────

clean:
	rm -rf dist
