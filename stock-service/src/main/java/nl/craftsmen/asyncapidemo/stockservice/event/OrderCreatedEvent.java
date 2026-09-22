package nl.craftsmen.asyncapidemo.stockservice.event;

public record OrderCreatedEvent(

        String id,
        String productId,
        int quantity

) {
}
