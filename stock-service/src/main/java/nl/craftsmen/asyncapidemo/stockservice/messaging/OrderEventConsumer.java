package nl.craftsmen.asyncapidemo.stockservice.messaging;

import nl.craftsmen.asyncapidemo.stockservice.event.OrderCreated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Consumer;

@Configuration
public class OrderEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);

    @Bean
    public Consumer<OrderCreated> stockUpdate() {
        return event -> log.info("Received OrderCreated event: id={}, source={}, items={}",
                event.getId(), event.getSource(), event.getItems());
    }

}
