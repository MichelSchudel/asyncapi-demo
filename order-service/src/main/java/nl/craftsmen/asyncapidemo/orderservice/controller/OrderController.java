package nl.craftsmen.asyncapidemo.orderservice.controller;

import nl.craftsmen.asyncapidemo.orderservice.api.OrdersApi;
import nl.craftsmen.asyncapidemo.orderservice.api.model.OrderCreatedResponse;
import nl.craftsmen.asyncapidemo.orderservice.api.model.OrderRequest;
import nl.craftsmen.asyncapidemo.orderservice.event.OrderCreated;
import nl.craftsmen.asyncapidemo.orderservice.event.OrderItem;
import nl.craftsmen.asyncapidemo.orderservice.event.OrderSource;
import nl.craftsmen.asyncapidemo.orderservice.messaging.OrderCreatedPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class OrderController implements OrdersApi {

    private final OrderCreatedPublisher orderCreatedPublisher;

    public OrderController(OrderCreatedPublisher orderCreatedPublisher) {
        this.orderCreatedPublisher = orderCreatedPublisher;
    }

    @Override
    public ResponseEntity<OrderCreatedResponse> createOrder(OrderRequest orderRequest) {
        List<OrderItem> items = orderRequest.getItems().stream()
                .map(item -> new OrderItem(item.getProductId(), item.getQuantity()))
                .toList();

        String id = UUID.randomUUID().toString();

        orderCreatedPublisher.publish(new OrderCreated(id, OrderSource.CUSTOMER, items));

        return ResponseEntity.status(HttpStatus.CREATED).body(new OrderCreatedResponse().id(id));
    }

}
