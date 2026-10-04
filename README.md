# AsyncAPI demo

This project demonstrates the use of AsyncAPI through two Spring Boot applications:

* The order-service that has a RESt endpoint for POSting orders. It will send an order creation message to a topic.
* The stock-service that listens to the topic, consumes the order creation message, and logs it.

The project's infrastructure is based on Kafka, using RedPanda as a lightweight implementation.

## Prerequisites
* Docker
* npm / npx (to run AsyncAPI's CLI tool)
* This project uses the Maven Wrapper, so you don't need Maven to be installed.

### Install npm on MacOS
```
brew install nvm
npm install -g @asyncapi/cli
```

Verify the installation has succeeded:
```
npx @asyncapi/cli --help
```

## AsyncAPI CLI Commands to try out

First, set ```PUPPETEER_SKIP_DOWNLOAD=true``` so chrome isn't installed, we don't need it.

Start the interactive spec editor
```
npx @asyncapi/cli start studio
```

Validate the spec in the order-service:
```
npx @asyncapi/cli validate order-service/src/main/resources/asyncapi/order-events-send.yaml

```
Generate html docs for the message spec:
```
npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/asyncapi/order-events.yaml @asyncapi/html-template@latest -o ./html-docs --force-write -i    
```


Generate html docs for the order service including operations (this is also integrated into the build already)::
```
npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/asyncapi/order-events-send.yaml @asyncapi/html-template@latest -o ./html-docs --force-write -i
```

Merge spec parts into one bundle and generate html docs:

```
npx @asyncapi/cli bundle order-service/src/main/resources/asyncapi/order-events-send.yaml -o order-events-send.bundled.yaml
npx @asyncapi/cli generate fromTemplate order-events-send.bundled.yaml @asyncapi/html-template@latest -o ./html-docs --force-write -i
```


Generate example for gcp, showing broker bindings:
```
npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/asyncapi/order-events-send-gcp.yaml @asyncapi/html-template@latest -o ./html-docs-gcp --force-write -i
```

#generate java models (this is also integrated into the build already):
```
npx @asyncapi/cli generate models java order-service/src/main/resources/asyncapi/order-events-send.yaml -o ./java-models --packageName=nl.craftsmen.asyncapidemo.orderservice.kafka
```

#generate kotlin models:
```
npx @asyncapi/cli generate models kotlin order-service/src/main/resources/asyncapi/order-events-send.yaml -o ./kotlin-models --packageName=nl.craftsmen.asyncapidemo.orderservice.kafka
```

## Running the build

```
  mvnw clean verify
```
* Generates the AsyncAPI spec html documents in ```/target/generated-resources```
* Generates the AsyncAPI spec generated code in ```/target/generated-sources```

After this, your IDE should be able to find them, and the html static content should be served from the Spring Boot applications.

## Starting Kafka
```docker compose up -d```

## Starting the apps
* ```mvnw -pl order-service spring-boot:run```
* ```mvnw -pl stock-service spring-boot:run```

## Access the web pages
* REST Swagger pages run on http://localhost:8080/swagger-ui/index.html
* AsyncAPI HTML docs for the order service are on http://localhost:8080/asyncapi-docs/index.html
* AsyncAPI HTML docs for the stock service are on http://localhost:8081/asyncapi-docs/index.html
* RedPanda UI runs on http://localhost:9000

## Smoke test
* do a POST through the order-service's Swagger page and see the logging in the stock-service.
