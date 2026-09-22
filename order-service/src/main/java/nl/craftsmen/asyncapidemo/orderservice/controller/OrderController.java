package nl.craftsmen.asyncapidemo.orderservice.controller;

import jakarta.validation.Valid;
import nl.craftsmen.asyncapidemo.orderservice.kafka.OrderCreatedEvent;
import nl.craftsmen.asyncapidemo.orderservice.kafka.OrderEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderEventPublisher orderEventPublisher;

    public OrderController(OrderEventPublisher orderEventPublisher) {
        this.orderEventPublisher = orderEventPublisher;
    }

    @PostMapping
    public ResponseEntity<OrderCreatedEvent> createOrder(@Valid @RequestBody OrderRequest orderRequest) {
        OrderCreatedEvent event = new OrderCreatedEvent(
                UUID.randomUUID().toString(),
                orderRequest.productId(),
                orderRequest.quantity()
        );

        orderEventPublisher.publish(event);

        return ResponseEntity.status(HttpStatus.CREATED).body(event);
    }

}
