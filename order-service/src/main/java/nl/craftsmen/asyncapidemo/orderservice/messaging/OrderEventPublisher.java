package nl.craftsmen.asyncapidemo.orderservice.messaging;

import nl.craftsmen.asyncapidemo.orderservice.event.OrderCreated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Component;

@Component
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

    private static final String BINDING_NAME = "orderCreated-out-0";

    private final StreamBridge streamBridge;

    public OrderEventPublisher(StreamBridge streamBridge) {
        this.streamBridge = streamBridge;
    }

    public void publish(OrderCreated event) {
        streamBridge.send(BINDING_NAME, event);
        log.info("Published OrderCreated event with id {}", event.getId());
    }

}
