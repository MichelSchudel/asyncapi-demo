/**
 * Plain-JS helpers that pull the same facts out of the parsed AsyncAPI document that the
 * asyncapi-codegen Java module extracts by hand — except here the parser has already resolved
 * every $ref (including the cross-file one into order-events.yaml), so there's no ref-walking
 * to do ourselves.
 */

export function readOperation(asyncapi) {
  const operation = asyncapi.operations().all()[0];
  const channel = operation.channels().all()[0];
  const message = channel.messages().all()[0];
  const payload = message.payload();
  const server = asyncapi.servers().all()[0];

  const kafkaBinding = operation.bindings().all()
    .find((binding) => binding.protocol() === 'kafka')
    .json();
  const kafkaBindingKey = Object.prototype.hasOwnProperty.call(kafkaBinding, 'clientId') ? 'clientId' : 'groupId';
  const kafkaBindingValue = kafkaBinding[kafkaBindingKey].enum[0];

  const channelKey = channel.id();
  const isSend = operation.action() === 'send';

  return {
    isSend,
    channelKey,
    channelKeyCapitalized: channelKey.charAt(0).toUpperCase() + channelKey.slice(1),
    channelAddress: channel.address(),
    brokerHost: server.host(),
    kafkaBindingKey,
    kafkaBindingValue,
    payloadTypeName: payload.title() || payload.id(),
  };
}

/** Turns a Java package name into its directory path, e.g. "a.b.c" -> "a/b/c". */
export function packagePath(javaPackage) {
  return javaPackage.replace(/\./g, '/');
}

/** Named object/enum schemas, i.e. the ones that should become a Java record or enum. */
export function namedSchemas(asyncapi) {
  return asyncapi.allSchemas().all()
    .filter((schema) => schema.title() && (schema.type() === 'object' || (schema.type() === 'string' && schema.enum())));
}

export function javaTypeName(schema) {
  const type = schema.type();
  if (type === 'array') {
    return `List<${javaTypeName(schema.items())}>`;
  }
  if (type === 'object' || (type === 'string' && schema.enum())) {
    return schema.title();
  }
  switch (type) {
    case 'string': return 'String';
    case 'integer': return 'int';
    case 'number': return 'double';
    case 'boolean': return 'boolean';
    default: throw new Error(`Unsupported schema type: ${type}`);
  }
}
