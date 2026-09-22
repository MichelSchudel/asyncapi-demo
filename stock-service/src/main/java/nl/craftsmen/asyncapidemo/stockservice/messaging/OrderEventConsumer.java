package nl.craftsmen.asyncapidemo.stockservice.messaging;

import nl.craftsmen.asyncapidemo.stockservice.event.OrderCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Consumer;

@Configuration
public class OrderEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);

    @Bean
    public Consumer<OrderCreatedEvent> stockUpdate() {
        return event -> log.info("Received OrderCreated event: id={}, productId={}, quantity={}",
                event.id(), event.productId(), event.quantity());
    }

}
