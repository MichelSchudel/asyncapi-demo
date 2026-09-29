import { File } from '@asyncapi/generator-react-sdk';
import { readOperation, namedSchemas } from '../components/spec.js';
import KafkaBindingYaml from '../components/KafkaBindingYaml.js';
import MessagingClass from '../components/MessagingClass.js';
import ModelFile from '../components/ModelFile.js';

export default function ({ asyncapi, params }) {
  const operation = readOperation(asyncapi);
  const files = [];

  files.push(
    <File name="application-asyncapi.yml">
      <KafkaBindingYaml operation={operation} />
    </File>
  );

  const messagingClassName = `${operation.channelKeyCapitalized}${operation.isSend ? 'Publisher' : 'Consumer'}`;
  files.push(
    <File name={`${messagingClassName}.java`}>
      <MessagingClass operation={operation} messagingPackage={params.messagingPackage} modelsPackage={params.javaPackage} />
    </File>
  );

  namedSchemas(asyncapi).forEach((schema) => {
    files.push(
      <File name={`${schema.title()}.java`}>
        <ModelFile schema={schema} javaPackage={params.javaPackage} />
      </File>
    );
  });

  return files;
}
