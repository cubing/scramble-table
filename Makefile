
.PHONY: build
build: build-package build-types

.PHONY: build-package
build-package:
	node script/build-package.js

.PHONY: build-types
build-types:
	npx tsc

.PHONY: dev
dev:
	node script/dev.js

.PHONY: clean
clean:
	rm -rf ./dist

.PHONY: upgrade-cubing
upgrade-cubing:
	npm install --save cubing@latest

.PHONY: lint
lint:
	npx @biomejs/biome check ./src

.PHONY: format
format:
	npx @biomejs/biome format --write ./src

.PHONY: encrypt-fake-competition
encrypt-fake-competition:
	bun run src/bin/encrypt.ts \
		"./src/dev/fake-competition/Fake Test Competition.json" \
		"./src/dev/fake-competition/Fake Test Competition - Computer Display PDF Passcodes - SECRET.txt" \
		"./src/dev/fake-competition/Fake Test Competition.encrypted-scrambles.json"

.PHONY: prepublishOnly
prepublishOnly: clean build

.PHONY: publish
publish:
	npm publish
