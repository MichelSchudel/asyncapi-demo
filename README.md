brew install nvm
npm install -g @asyncapi/cli


npx @asyncapi/cli --help


async api template:

PUPPETEER_SKIP_DOWNLOAD=true npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/order-events.yaml @asyncapi/html-template@latest -o ./html-docs --force-write -i    

npx @asyncapi/cli start

Generate a spring boot app 

npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/order-events-v2.yaml @asyncapi/java-spring-cloud-stream-template@latest -o ../sb-example --force-write -i




npx @asyncapi/cli start studio

#generate html complete:
npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/order-events-send.yaml @asyncapi/html-template@latest -o ./html-docs --force-write -i

#bundle everything together
npx @asyncapi/cli bundle order-service/src/main/resources/order-events-send.yaml -o order-events-send.bundled.yaml
npx @asyncapi/cli generate fromTemplate order-events-send.bundled.yaml @asyncapi/html-template@latest -o ./html-docs --force-write -i


#generate example:
npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/example.yaml @asyncapi/html-template@latest -o ./html-docs-example --force-write -i

#generate orders where everything is included:
npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/order-events-all.yaml @asyncapi/html-template@latest -o ./html-docs --force-write -i

#generate gcp:
npx @asyncapi/cli generate fromTemplate order-service/src/main/resources/order-events-send-gcp.yaml @asyncapi/html-template@latest -o ./html-docs-gcp --force-write -i

#generate java models:
npx @asyncapi/cli generate models java order-service/src/main/resources/order-events-send.yaml -o ./java-models-final-verify --packageName=nl.craftsmen.asyncapidemo.orderservice.kafka

#generate kotlin models:
npx @asyncapi/cli generate models kotlin order-service/src/main/resources/order-events-send.yaml -o ./kotlin-models-final-verify --packageName=nl.craftsmen.asyncapidemo.orderservice.kafka