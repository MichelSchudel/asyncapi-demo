package nl.craftsmen.asyncapidemo.stockservice.event;

public record OrderItem(

        String productId,
        int quantity

) {
}
