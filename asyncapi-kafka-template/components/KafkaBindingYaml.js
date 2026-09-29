export default function KafkaBindingYaml({ operation }) {
  const bindingName = `${operation.channelKey}${operation.isSend ? '-out-0' : '-in-0'}`;

  if (operation.isSend) {
    return `spring:
  cloud:
    stream:
      bindings:
        ${bindingName}:
          destination: ${operation.channelAddress}
      kafka:
        binder:
          brokers: ${operation.brokerHost}
          configuration:
            client.id: ${operation.kafkaBindingValue}
`;
  }

  return `spring:
  cloud:
    function:
      definition: ${operation.channelKey}
    stream:
      bindings:
        ${bindingName}:
          destination: ${operation.channelAddress}
          group: ${operation.kafkaBindingValue}
      kafka:
        binder:
          brokers: ${operation.brokerHost}
`;
}
