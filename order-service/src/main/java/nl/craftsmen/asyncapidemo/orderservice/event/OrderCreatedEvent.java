package nl.craftsmen.asyncapidemo.orderservice.event;

public record OrderCreatedEvent(

        String id,
        String productId,
        int quantity

) {
}
