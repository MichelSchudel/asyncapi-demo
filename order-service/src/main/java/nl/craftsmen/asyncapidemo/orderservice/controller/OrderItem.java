package nl.craftsmen.asyncapidemo.orderservice.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record OrderItem(

        @NotBlank
        String productId,

        @Positive
        int quantity

) {
}
