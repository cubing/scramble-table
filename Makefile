.PHONY: build
build: build-js build-types

.PHONY: check
check: lint build check-package.json

.PHONY: check-package.json
check-package.json: build
	bun x -- bun-dx --package @cubing/dev-config package.json -- check

.PHONY: setup
setup:
	@command -v bun > /dev/null || { echo "\nPlease install \`bun\` to work on this project:\n\n    # from npm\n    npm install --global bun\n\n    # macOS (Homebrew)\n    brew install oven-sh/bun/bun\n\n    # For other options, see: https://bun.sh/\n" && exit 1 ; }
	bun install --frozen-lockfile

.PHONY: build-js
build-js: setup
	bun run -- ./script/build-js.ts

.PHONY: build-types
build-types: setup
	bun x -- bun-dx --package typescript tsc -- --project ./tsconfig.types.json

.PHONY: dev
dev: setup
	bun run -- ./script/dev.ts

RM_RF = bun -e 'process.argv.slice(1).map(p => process.getBuiltinModule("node:fs").rmSync(p, {recursive: true, force: true, maxRetries: 5}))' --

.PHONY: clean
clean:
	${RM_RF} ./dist/

.PHONY: reset
reset: clean
	${RM_RF} ./node_modules/

.PHONY: lint
lint: setup
	bun x -- bun-dx --package @biomejs/biome biome -- check
	bun x -- bun-dx --package typescript tsc -- --project ./tsconfig.json

.PHONY: format
format: setup
	bun x -- bun-dx --package @biomejs/biome biome -- check

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
