# prepare demo
* make sure mouse wheel zoom is active
* make sure screen is mirroring, not duplicating.
* have docker / rancher running.
* make sure ayncapi cli works, either through npx or shim
* run the maven build and start the apps
* stop the apps and clean again
* pre-load the asyncapi cli commands into the terminal. Test them.
* disable sendng online telemetrics: `asyncapi config analytics --disable `



# project structure
- explain the general structure of the project: the two services. 
  - Explain they're based on Spring Cloud Streaming, because it abstracts away protocols.
  - Tell that the messaging broker here is RedPanda, which is basically Kafka without Zookeeper so it's easier to set up.
- explain the controller is spec-first. show the openapi spec and preview window.
- then show asyncapi order-events.yaml
  - explain this file only contains the data structure, message, and channel. It's  shared thing that everybody needs.
- show the order-events-send.yaml. Explain that this contains operations specifically for the order service, and that it's different for the stock-service.
- also explain briefly the servers bit, this is just a simple kafka broker.
- then show the gcp example where you would have topics and subscriptions.

# cli

## validation
```
asyncapi validate order-service/src/main/resources/asyncapi/order-events-send.yaml
```

## html docs
```
asyncapi generate fromTemplate order-service/src/main/resources/asyncapi/order-events-send.yaml @asyncapi/html-template@latest -o ./html-docs --force-write -i
```
open the docs in a browser and explain you can easily wire this thing up in the maven build using the maven exec plugin.
## models
```
asyncapi generate models java order-service/src/main/resources/asyncapi/order-events-send.yaml -o ./java-models --packageName=nl.craftsmen.asyncapidemo.orderservice.kafka
```
show the models and that they're not very nice, old school java.

## Modelina: Java records
The CLI wraps Modelina, but doesn't expose all of its options. Records are one of those, so call the Modelina library directly (the globally installed AsyncAPI CLI bundles it, so `NODE_PATH` points there):
```
NODE_PATH="$(npm root -g)/@asyncapi/cli/node_modules" node -e "
const {JavaGenerator}=require('@asyncapi/modelina');
const {Parser,fromFile}=require('@asyncapi/parser');
const fs=require('fs');
fromFile(new Parser(),process.argv[1]).parse().then(({document})=>new JavaGenerator({modelType:'record',collectionType:'List'}).generateCompleteModels(document,{packageName:'nl.craftsmen.asyncapidemo.orderservice.kafka'})).then(ms=>{fs.mkdirSync('java-records',{recursive:true});ms.forEach(m=>fs.writeFileSync('java-records/'+m.modelName+'.java',m.result))})
" order-service/src/main/resources/asyncapi/order-events-send.yaml
```
- `modelType: 'record'`: generate Java records instead of classes with getters and setters.
- `collectionType: 'List'`: use `List<OrderItem>` instead of `OrderItem[]`.
- `generateCompleteModels` with `packageName`: adds the package and imports, so the files are ready to compile.

Show `java-records/OrderCreated.java`: one line instead of a page of boilerplate. Compare with `java-models`.

## Generator
Now explain that we not only want to generate some data classes, but the code for the consumer and producer as well.
So dive into the generator. Explain the templates. We need three things:
- The model files
- The producer and consumer
- the binding in the application.yml

### The command
This is what the maven build will run for the order-service. It runs from inside the template folder, just like the maven build does.

First, install the template's dependencies (it bundles the AsyncAPI CLI):
```
cd asyncapi-kafka-template
npm install
```
Then generate:
```
node node_modules/@asyncapi/cli/bin/run_bin generate fromTemplate \
 ../order-service/src/main/resources/asyncapi/order-events-send.yaml ./ \
 -o ../order-service \
 --param javaPackage=nl.craftsmen.asyncapidemo.orderservice.event \
 --param messagingPackage=nl.craftsmen.asyncapidemo.orderservice.messaging \
 --param javaSourceRoot=target/generated-sources/asyncapi-template \
 --param resourcesRoot=target/generated-resources \
 --force-write
```
- `generate fromTemplate <spec> <template>`: the spec is the order-service's send spec, the template is the current folder (`./`, keep the trailing slash: a bare `.` is treated as an npm package name and triggers a registry install, which hangs offline), our local `asyncapi-kafka-template`.
- `-o ../order-service`: output root; the `javaSourceRoot` and `resourcesRoot` params are relative to it. The template creates missing output folders itself (via a `generate:before` hook).
- `--param ...`: the Java packages for the models and the publisher, and where to put the generated sources and the `application-asyncapi.yml` with the Kafka bindings.

Output: the `OrderCreated`, `OrderItem` and `OrderSource` models, the `OrderCreatedPublisher`, and `application-asyncapi.yml`.

Show how you can integrate this into a maven build.

Run the build. Show the code. Start the application and demo.
Show the api docs: http://localhost:8080/asyncapi-docs/index.html
Run the POST endpoint and show the logs.