package nl.craftsmen.asyncapidemo.orderservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import nl.craftsmen.asyncapidemo.orderservice.event.OrderCreatedEvent;
import nl.craftsmen.asyncapidemo.orderservice.event.OrderSource;
import nl.craftsmen.asyncapidemo.orderservice.messaging.OrderEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@Tag(name = "Orders", description = "Place orders that are published as OrderCreated events")
public class OrderController {

    private final OrderEventPublisher orderEventPublisher;

    public OrderController(OrderEventPublisher orderEventPublisher) {
        this.orderEventPublisher = orderEventPublisher;
    }

    @PostMapping
    @Operation(summary = "Place a new order",
            description = "Generates an order id and publishes an OrderCreated event")
    @ApiResponse(responseCode = "201", description = "Order accepted and OrderCreated event published")
    @ApiResponse(responseCode = "400", description = "Invalid order payload")
    public ResponseEntity<OrderCreatedResponse> createOrder(@Valid @RequestBody OrderRequest orderRequest) {
        List<nl.craftsmen.asyncapidemo.orderservice.event.OrderItem> items = orderRequest.items().stream()
                .map(item -> new nl.craftsmen.asyncapidemo.orderservice.event.OrderItem(item.productId(), item.quantity()))
                .toList();

        String id = UUID.randomUUID().toString();

        OrderCreatedEvent event = new OrderCreatedEvent(
                id,
                OrderSource.CUSTOMER,
                items
        );

        orderEventPublisher.publish(event);

        return ResponseEntity.status(HttpStatus.CREATED).body(new OrderCreatedResponse(id));
    }

}
