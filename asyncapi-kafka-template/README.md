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
```

## Running it locally

```bash
npm install
npm run test:order-service   # generates into ../order-service/target/...
npm run test:stock-service   # generates into ../stock-service/target/...
npm test                     # both
```

Each script runs the template directly against the real spec files in the sibling
`order-service`/`stock-service` modules (not a toy fixture), with `-o` pointed at the module root
and four parameters:

- `javaPackage` — Java package for the generated record/enum models
- `messagingPackage` — Java package for the generated publisher/consumer class
- `javaSourceRoot` — root folder Java sources are written under (relative to `-o`)
- `resourcesRoot` — root folder the Kafka binder config is written under (relative to `-o`)

The template writes into full package-path-nested `<File name="...">`s, e.g.
`${javaSourceRoot}/nl/craftsmen/.../event/OrderCreated.java`. The test scripts point
`javaSourceRoot`/`resourcesRoot` at `target/generated-sources/asyncapi-template` and
`target/generated-resources`, so generated code stays out of the hand-written `src/main` tree —
same convention the `asyncapi-codegen` Java module uses. Point them at `src/main/java` /
`src/main/resources` instead if you want the output checked into source control.

## A known environment caveat (not a template bug)

At the time this was built, `@asyncapi/cli@6.1.0`/`6.2.0` depend on `uuid@^14`, which ships
ESM-only — but the CLI still does `require('uuid')` internally, so generation fails immediately
with `ERR_REQUIRE_ESM` on a plain `npm install`. This template's `package.json` works around it
with an `"overrides": { "uuid": "9.0.1" }` entry (an older, CJS-compatible major). If a future CLI
release fixes this itself, the override can be dropped.

Separately, `@asyncapi/generator@3.4.1`'s `utils.exists()` calls `fs.promises.stat(path, fs.constants.F_OK)`
— passing an access-flag number where `stat()` expects an options *object* — which is undoubtedly a bug
in this specific version of the generator. Older Node releases silently tolerated it; Node 26 validates
`fs.promises.stat`'s second argument and throws. Run this template's scripts under Node 22 (or any
version predating that stricter validation) until upstream fixes it.

## Directories aren't created automatically (also not a template bug)

`@asyncapi/generator@3.4.1`'s React file writer (`saveContentToFile` in `lib/renderer/react.js`)
writes every `<File>` with a plain `fs.writeFile` and never creates the file's parent directory
first. That's harmless for a flat output folder, but `javaSourceRoot`/`resourcesRoot` here are
usually brand-new, multi-level paths (`target/generated-sources/asyncapi-template/nl/craftsmen/...`)
that don't exist yet, so generation fails with `ENOENT` on the first file that needs a genuinely new
directory. `hooks/index.js` works around it with a `generate:before` hook that pre-creates the two
package directories and the resources root from `generator.templateParams` before rendering starts.

## This template does **not** run as part of the Maven build

It's a standalone proof of concept for comparing the official template mechanism against the
`asyncapi-codegen` Java module — not wired into `order-service`/`stock-service`'s `pom.xml`.
