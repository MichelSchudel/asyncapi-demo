package nl.craftsmen.asyncapidemo.orderservice.kafka;

public record OrderCreatedEvent(

        String id,
        String productId,
        int quantity

) {
}
