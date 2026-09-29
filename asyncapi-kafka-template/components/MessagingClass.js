export default function MessagingClass({ operation, messagingPackage, modelsPackage }) {
  return operation.isSend
    ? publisher(operation, messagingPackage, modelsPackage)
    : consumer(operation, messagingPackage, modelsPackage);
}

function publisher(operation, messagingPackage, modelsPackage) {
  const className = `${operation.channelKeyCapitalized}Publisher`;
  const bindingName = `${operation.channelKey}-out-0`;
  return `package ${messagingPackage};

import ${modelsPackage}.${operation.payloadTypeName};
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Component;

@Component
public class ${className} {

    private static final Logger log = LoggerFactory.getLogger(${className}.class);

    private static final String BINDING_NAME = "${bindingName}";

    private final StreamBridge streamBridge;

    public ${className}(StreamBridge streamBridge) {
        this.streamBridge = streamBridge;
    }

    public void publish(${operation.payloadTypeName} event) {
        streamBridge.send(BINDING_NAME, event);
        log.info("Published {} event", event.getClass().getSimpleName());
    }

}
`;
}

function consumer(operation, messagingPackage, modelsPackage) {
  const className = `${operation.channelKeyCapitalized}Consumer`;
  return `package ${messagingPackage};

import ${modelsPackage}.${operation.payloadTypeName};
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Consumer;

@Configuration
public class ${className} {

    private static final Logger log = LoggerFactory.getLogger(${className}.class);

    @Bean
    public Consumer<${operation.payloadTypeName}> ${operation.channelKey}() {
        return event -> log.info("Received {} event: {}", event.getClass().getSimpleName(), event);
    }

}
`;
}
