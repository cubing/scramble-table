
.PHONY: build
build: build-package build-types

.PHONY: setup
setup:
	@command -v bun > /dev/null || { echo "\nPlease install \`bun\` to work on this project:\n\n    # from npm\n    npm install --global bun\n\n    # macOS (Homebrew)\n    brew install oven-sh/bun/bun\n\n    # For other options, see: https://bun.sh/\n" && exit 1 ; }
	bun install --no-save

.PHONY: build-package
build-package: setup
	bun run script/build-package.ts

.PHONY: build-types
build-types: setup
	npx tsc

.PHONY: dev
dev: setup
	bun run script/dev.ts

.PHONY: clean
clean:
	rm -rf ./dist

.PHONY: reset
reset: clean
	rm -rf ./node_modules

.PHONY: upgrade-cubing
upgrade-cubing:
	bun add cubing@latest

.PHONY: lint
lint: setup
	npx @biomejs/biome check ./script ./src/bin ./src/lib

.PHONY: format
format: setup
	npx @biomejs/biome format --write ./script ./src/bin ./src/lib

.PHONY: encrypt-fake-competition
encrypt-fake-competition: setup
	bun run src/bin/main.ts \
		encrypt \
		"./src/dev/fake-competition/Fake Test Competition.json" \
		"./src/dev/fake-competition/Fake Test Competition - Computer Display PDF Passcodes - SECRET.txt" \
		"./src/dev/fake-competition/Fake Test Competition.encrypted-scrambles.json"

.PHONY: prepublishOnly
prepublishOnly: clean build

.PHONY: publish
publish:
	npm publish
