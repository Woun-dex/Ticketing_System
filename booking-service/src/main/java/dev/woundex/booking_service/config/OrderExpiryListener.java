package dev.woundex.booking_service.config;

import dev.woundex.booking_service.Entity.Order;
import dev.woundex.booking_service.Entity.OrderStatus;
import dev.woundex.booking_service.Repository.OrderRepository;
import dev.woundex.booking_service.dto.TicketCancelledEvent;
import dev.woundex.booking_service.Entity.Seat;
import dev.woundex.booking_service.Enum.SeatStatus;
import dev.woundex.booking_service.Repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderExpiryListener implements MessageListener {
    
    private final OrderRepository orderRepository;
    private final SeatRepository seatRepository;
    private final RedissonClient redissonClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    private static final String ORDER_EXPIRY_PREFIX = "order_expiry:";
    
    @Override
    @Transactional
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = new String(message.getBody());
        log.info("Received expired key notification: {}", expiredKey);
        
        // Check if this is an order expiry key
        if (!expiredKey.startsWith(ORDER_EXPIRY_PREFIX)) {
            return;
        }
        
        // Extract order ID from the key
        String orderIdStr = expiredKey.substring(ORDER_EXPIRY_PREFIX.length());
        UUID orderId;
        try {
            orderId = UUID.fromString(orderIdStr);
        } catch (IllegalArgumentException e) {
            log.error("Invalid order ID in expired key: {}", orderIdStr);
            return;
        }
        
        // Find and process the order
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            log.warn("Order not found for expired key: {}", orderId);
            return;
        }
        
        Order order = orderOpt.get();
        
        // Only cancel if still PENDING
        if (order.getStatus() != OrderStatus.PENDING) {
            log.info("Order {} is not PENDING (status: {}), skipping cancellation", orderId, order.getStatus());
            return;
        }
        
        log.info("Cancelling expired order: {}", orderId);
        
        // Update order status to CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        
        // Release the seats back to AVAILABLE
        List<Long> seatIds = order.getSeatIds();
        if (seatIds != null && !seatIds.isEmpty()) {
            List<Seat> seats = seatRepository.findAllBySeatIds(seatIds);
            for (Seat seat : seats) {
                seat.setStatus(SeatStatus.AVAILABLE);
            }
            seatRepository.saveAll(seats);
            
            // Increment available tickets counter in Redis
            redissonClient.getAtomicLong("tickets:available:" + order.getEventId())
                    .addAndGet(seatIds.size());
            
            // Publish ticket-cancelled event to Kafka
            TicketCancelledEvent cancelledEvent = new TicketCancelledEvent(
                    orderId,
                    order.getEventId(),
                    seatIds,
                    "PAYMENT_TIMEOUT"
            );
            kafkaTemplate.send("ticket-cancelled", cancelledEvent);
            
            log.info("Order {} cancelled, released {} seats, published cancellation event", 
                    orderId, seatIds.size());
        }
    }
}
