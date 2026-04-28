ACCOUNT_ID := e6a409663bf73140c8bd4caaadd9ebc2
PROJECT    := capturecaribbean
PROJECT_DEV:= capturecaribbean
DIST       := dist/photojomo-web
NODE       := /Users/almorris/.nvm/versions/node/v20.19.6/bin/node
NPX        := /Users/almorris/.nvm/versions/node/v20.19.6/bin/npx

.PHONY: build build-dev deploy deploy-dev

build:
	$(NPX) ng build

deploy: build
	CLOUDFLARE_ACCOUNT_ID=$(ACCOUNT_ID) $(NPX) wrangler pages deploy $(DIST) \
		--project-name $(PROJECT) \
		--branch=main \
		--commit-dirty=true

build-dev:
	$(NPX) ng build --configuration development

deploy-dev: build-dev
	CLOUDFLARE_ACCOUNT_ID=$(ACCOUNT_ID) $(NPX) wrangler pages deploy $(DIST) \
		--project-name $(PROJECT_DEV) \
		--branch=dev \
		--commit-dirty=true
