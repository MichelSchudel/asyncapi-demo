package nl.craftsmen.asyncapidemo.orderservice.event;

public record OrderItem(

        String productId,
        int quantity

) {
}
