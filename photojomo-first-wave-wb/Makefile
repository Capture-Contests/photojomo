ACCOUNT_ID := e6a409663bf73140c8bd4caaadd9ebc2
PROJECT    := capture-caribbean-first-wave
PROJECT_DEV:= capture-caribbean-first-wave-dev
DIST       := dist/photojomo-first-wave-wb/browser
NODE       := /Users/almorris/.nvm/versions/node/v20.19.6/bin/node
NPX        := /Users/almorris/.nvm/versions/node/v20.19.6/bin/npx

.PHONY: deploy-dev

build:
	$(NPX) ng build

deploy: build
	CLOUDFLARE_ACCOUNT_ID=$(ACCOUNT_ID) $(NPX) wrangler pages deploy $(DIST) \
		--project-name $(PROJECT) \
		--commit-dirty=true

build-dev:
	$(NPX) ng build --configuration development

deploy-dev: build-dev
	CLOUDFLARE_ACCOUNT_ID=$(ACCOUNT_ID) $(NPX) wrangler pages deploy $(DIST) \
		--project-name $(PROJECT_DEV) \
		--branch=development \
		--commit-dirty=true
