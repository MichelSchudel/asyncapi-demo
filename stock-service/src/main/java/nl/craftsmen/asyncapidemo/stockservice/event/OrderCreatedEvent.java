package nl.craftsmen.asyncapidemo.stockservice.event;

import java.util.List;

public record OrderCreatedEvent(

        String id,
        OrderSource source,
        List<OrderItem> items

) {
}
