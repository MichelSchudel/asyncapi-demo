# asyncapi-kafka-spring-template

An [AsyncAPI Generator](https://www.asyncapi.com/docs/tools/generator) template that reads one
AsyncAPI 3.0 operation (a `send` or `receive`) and generates:

- `application-asyncapi.yml` — the Spring Cloud Stream Kafka binder config (brokers, destination,
  group/client-id), meant to be pulled in via `spring.config.import`.
- `<Channel>Publisher.java` or `<Channel>Consumer.java` — the class wiring the model into Spring
  Cloud Stream, depending on the operation's `action`.
- one Java record per object schema and one Java enum per string+enum schema referenced by the
  operation's message payload.

This is a React-based reimplementation of the same idea as the `asyncapi-codegen` Java module on
the `feature/asyncapi-kafka-codegen` branch, built with the official AsyncAPI Generator template
mechanism instead of a hand-rolled Java tool. See `components/spec.js` for how the parsed
`asyncapi` document is read — the AsyncAPI Parser resolves every `$ref` (including the cross-file
one into the shared `order-events.yaml`) before the template ever sees it, so unlike the Java
module there's no manual ref-resolution code here.

## Layout

```
package.json        generator config (apiVersion, supportedProtocols, parameters)
template/index.js    entry point: decides which files to emit
components/
  spec.js             plain-JS helpers that read the parsed AsyncAPI document
  KafkaBindingYaml.js  -> application-asyncapi.yml
  MessagingClass.js    -> <Channel>Publisher.java / <Channel>Consumer.java
  ModelFile.js          -> one Java record or enum per named schema
hooks/index.js       generate:before hook - pre-creates the output package directories
                      (see the "directories" caveat below for why this is needed)
test/
  fixtures/*.yaml     self-contained AsyncAPI specs (send + receive) used only by this template's
                      own tests - deliberately not the order-service/stock-service specs
  generate.test.mjs    node:test suite; runs the real `asyncapi generate fromTemplate` CLI
                      entrypoint (not the Generator class directly - see the file's own comment
                      for why that distinction matters) and asserts on the generated output
```

Run the tests with `npm test` (needs `npm install` first).

## Running it

This template deliberately has no knowledge of its consumers — no hard-coded paths to
`order-service`/`stock-service` anywhere in here. That knowledge lives in each consuming service's
own build (see "How order-service/stock-service invoke this" below). To run it against any
AsyncAPI operation spec by hand:

```bash
npm install
node node_modules/@asyncapi/cli/bin/run_bin generate fromTemplate \
  <path-to-spec.yaml> ./ \
  -o <output-dir> \
  --param javaPackage=<package for models> \
  --param messagingPackage=<package for the publisher/consumer> \
  --param javaSourceRoot=<root Java sources are written under, relative to -o> \
  --param resourcesRoot=<root the Kafka binder config is written under, relative to -o> \
  --force-write
```

The template writes into full package-path-nested `<File name="...">`s, e.g.
`${javaSourceRoot}/nl/craftsmen/.../event/OrderCreated.java`. Point `javaSourceRoot`/`resourcesRoot`
at something like `target/generated-sources/asyncapi-template` / `target/generated-resources` to
keep generated code out of a hand-written `src/main` tree, or at `src/main/java` /
`src/main/resources` directly if you want the output checked into source control.

## How order-service/stock-service invoke this

Both `pom.xml`s run this template via two `exec-maven-plugin` executions in the `generate-sources`
phase: `install-asyncapi-template` (`npm install` in this directory) and
`generate-asyncapi-kafka-artifacts` (`node node_modules/@asyncapi/cli/bin/run_bin generate
fromTemplate ...`, invoking this template's *own* pinned `@asyncapi/cli` install directly rather
than going through `npx`, precisely to avoid the `uuid` ESM issue below depending on whatever npx
happens to resolve that day). See the `asyncapi.template.*`/`node.executable`/`npm.executable`
properties and the two executions in either service's `pom.xml` for the exact wiring.

## A known environment caveat (not a template bug)

At the time this was built, `@asyncapi/cli@6.1.0`/`6.2.0` depend on `uuid@^14`, which ships
ESM-only — but the CLI still does `require('uuid')` internally, so generation fails immediately
with `ERR_REQUIRE_ESM` on a plain `npm install`. This template's `package.json` works around it
with an `"overrides": { "uuid": "9.0.1" }` entry (an older, CJS-compatible major). If a future CLI
release fixes this itself, the override can be dropped.

Separately, `@asyncapi/generator@3.4.1`'s `utils.exists()` calls `fs.promises.stat(path, fs.constants.F_OK)`
— passing an access-flag number where `stat()` expects an options *object* — which is undoubtedly a bug
in this specific version of the generator. Older Node releases silently tolerated it; Node 26 validates
`fs.promises.stat`'s second argument and throws. **Verified: Node 22.11.0 and Node 24.21.0 both work;
Node 26.9.0 doesn't.** The exact version this started breaking at (25 or 26) hasn't been pinned down —
only those three were tested. `package.json`'s `engines` field (`>=22 <26`) reflects this; `npm test`
reproduces the failure directly if you want to see it (or re-check it against a future generator release).

## Directories aren't created automatically (also not a template bug)

`@asyncapi/generator@3.4.1`'s React file writer (`saveContentToFile` in `lib/renderer/react.js`)
writes every `<File>` with a plain `fs.writeFile` and never creates the file's parent directory
first. That's harmless for a flat output folder, but `javaSourceRoot`/`resourcesRoot` here are
usually brand-new, multi-level paths (`target/generated-sources/asyncapi-template/nl/craftsmen/...`)
that don't exist yet, so generation fails with `ENOENT` on the first file that needs a genuinely new
directory. `hooks/index.js` works around it with a `generate:before` hook that pre-creates the two
package directories and the resources root from `generator.templateParams` before rendering starts.

## One Node version that satisfies everything

The html-docs step's toolchain (`@asyncapi/bundler`, `jsdom`, ...) declares `"node": ">=24"` in its
own `engines` field, and fails outright under Node 22. Combined with the generator bug above
(broken on Node 26, fine on 22), that looked like an unsatisfiable window until **Node 24.21.0
was tested directly and works for both** — the html-docs step (needs ≥24) and this template's
generation step (broken only starting somewhere after 24, confirmed on 26). So: put Node 24.x on
`PATH` and both `generate-asyncapi-docs` and `generate-asyncapi-kafka-artifacts` work without
touching `node.executable`/`npm.executable` at all. Those properties stay in the `pom.xml`s as an
override point (e.g. if a future Node breaks something again), not because they're required today.

## Publishing this for others to use

Structurally this follows the [AsyncAPI Generator's template requirements](https://www.asyncapi.com/docs/tools/generator/template-development):
a `template/index.js` using the React render engine, a `generator` config block in `package.json`,
and a dependency on `@asyncapi/generator-react-sdk`. `LICENSE` is included so it's actually reusable,
not just labeled as such.

The AsyncAPI docs only document resolving templates from an **npm registry** (public or private via
`.npmrc`/Verdaccio/Nexus) — `asyncapi generate fromTemplate <spec> <package-name>[@version]`. They
don't confirm whether a bare `github:user/repo` git specifier works as the template argument (the
underlying installer, npm's Arborist, generally supports git specifiers the same way `npm install`
does, so it plausibly works, but this hasn't been tested). The reliable, documented path is
`npm publish` to a registry: pick a scope you actually own (`@craftsmen` here is a placeholder — one
of these apply before publishing) or drop the scope entirely.
