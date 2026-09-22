package nl.craftsmen.asyncapidemo.stockservice.kafka;

public record OrderCreatedEvent(

        String id,
        String productId,
        int quantity

) {
}
