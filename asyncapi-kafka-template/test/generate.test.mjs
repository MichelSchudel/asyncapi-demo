import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Shells out to the actual `asyncapi generate fromTemplate` entrypoint rather than calling the
// Generator class directly, because the two take different code paths: the CLI runs a template
// "installation" step (looking for hooks/, .ageneratorrc, etc.) before generation starts, and
// that's exactly where @asyncapi/generator@3.4.1's fs.promises.stat(path, fs.constants.F_OK) bug
// lives (see README). Calling Generator#generateFromFile directly skips that step entirely and
// would pass even on a broken Node version - a false negative for the thing this suite exists
// to catch.

const testDir = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(testDir, '..');
const outDir = path.resolve(testDir, '.output');
const cliEntrypoint = path.resolve(templateDir, 'node_modules/@asyncapi/cli/bin/run_bin');

function generate(specFile, params) {
  rmSync(outDir, { recursive: true, force: true });
  const args = [
    cliEntrypoint, 'generate', 'fromTemplate',
    path.resolve(testDir, 'fixtures', specFile),
    templateDir,
    '-o', outDir,
    '--force-write',
    ...Object.entries(params).flatMap(([key, value]) => ['--param', `${key}=${value}`]),
  ];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, `CLI exited ${result.status}\n${result.stdout}\n${result.stderr}`);
}

const params = {
  javaPackage: 'com.example.event',
  messagingPackage: 'com.example.messaging',
  javaSourceRoot: 'src',
  resourcesRoot: 'resources',
};

test('send operation generates records, an enum, and a Publisher wired to StreamBridge', () => {
  generate('send.yaml', params);

  const widget = readFileSync(path.join(outDir, 'src/com/example/event/WidgetCreated.java'), 'utf8');
  assert.match(widget, /public record WidgetCreated\(/);
  assert.match(widget, /@JsonProperty\("status"\) WidgetStatus status/);
  assert.match(widget, /@JsonProperty\("tags"\) List<Tag> tags/);

  const status = readFileSync(path.join(outDir, 'src/com/example/event/WidgetStatus.java'), 'utf8');
  assert.match(status, /public enum WidgetStatus/);
  assert.match(status, /NEW\("NEW"\)/);
  assert.match(status, /SHIPPED\("SHIPPED"\)/);

  const tag = readFileSync(path.join(outDir, 'src/com/example/event/Tag.java'), 'utf8');
  assert.match(tag, /public record Tag\(/);

  const publisher = readFileSync(path.join(outDir, 'src/com/example/messaging/WidgetCreatedPublisher.java'), 'utf8');
  assert.match(publisher, /class WidgetCreatedPublisher/);
  assert.match(publisher, /StreamBridge streamBridge/);
  assert.match(publisher, /BINDING_NAME = "widgetCreated-out-0"/);
  assert.match(publisher, /public void publish\(WidgetCreated event\)/);

  const yml = readFileSync(path.join(outDir, 'resources/application-asyncapi.yml'), 'utf8');
  assert.match(yml, /widgetCreated-out-0:/);
  assert.match(yml, /destination: widgets\.created/);
  assert.match(yml, /client\.id: widget-service/);
});

test('receive operation generates a Consumer wired to a function bean and a groupId binding', () => {
  generate('receive.yaml', params);

  const consumer = readFileSync(path.join(outDir, 'src/com/example/messaging/WidgetCreatedConsumer.java'), 'utf8');
  assert.match(consumer, /class WidgetCreatedConsumer/);
  assert.match(consumer, /Consumer<WidgetCreated> widgetCreated\(\)/);

  const yml = readFileSync(path.join(outDir, 'resources/application-asyncapi.yml'), 'utf8');
  assert.match(yml, /definition: widgetCreated/);
  assert.match(yml, /widgetCreated-in-0:/);
  assert.match(yml, /group: widget-consumer-service/);
});
