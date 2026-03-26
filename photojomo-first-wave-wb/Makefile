ACCOUNT_ID := e6a409663bf73140c8bd4caaadd9ebc2
PROJECT    := capture-caribbean-first-wave
DIST       := dist/photojomo-first-wave-wb/browser
NODE       := /Users/almorris/.nvm/versions/node/v20.19.6/bin/node
NPX        := /Users/almorris/.nvm/versions/node/v20.19.6/bin/npx

.PHONY: build deploy

build:
	$(NPX) ng build

deploy: build
	CLOUDFLARE_ACCOUNT_ID=$(ACCOUNT_ID) wrangler pages deploy $(DIST) \
		--project-name $(PROJECT) \
		--commit-dirty=true
