package dev.woundex.booking_service.service;

import dev.woundex.booking_service.Entity.Seat;
import dev.woundex.booking_service.Enum.SeatStatus;
import dev.woundex.booking_service.Repository.SeatRepository;
import dev.woundex.booking_service.client.AuthClient;
import dev.woundex.booking_service.dto.UserResponse;
import dev.woundex.booking_service.Entity.Order;
import dev.woundex.booking_service.Entity.OrderStatus;
import dev.woundex.booking_service.Repository.OrderRepository;
import dev.woundex.booking_service.dto.BookRequest;
import dev.woundex.booking_service.dto.BookResponse;
import dev.woundex.booking_service.dto.OrderCreatedEvent;
import dev.woundex.booking_service.dto.TicketReservedEvent;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RScript;
import org.redisson.api.RedissonClient;
import org.redisson.client.codec.StringCodec;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final RedissonClient redisson;
    private final AuthClient authClient;
    private final SeatRepository seatRepository;
    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String DECREMENT_SCRIPT = 
        "local cur = tonumber(redis.call('get', KEYS[1])); " +
        "if cur and cur >= tonumber(ARGV[1]) then redis.call('decrby', KEYS[1], ARGV[1]); return 1; end; return 0;";



    @Transactional
    public BookResponse createBooking(BookRequest req , String jwt){
        String token = jwt.startsWith("Bearer ") ? jwt.substring(7) : jwt;
        UserResponse user = authClient.validateToken(token);

        Long eventId = req.getEventId();
        List<Long> seatIds = req.getSeatIds();
        UUID userId = user.getId();

        String inventoryKey = "tickets:available:" + eventId;
        if (!redisson.getBucket(inventoryKey).isExists()) {
            int availableSeats = seatRepository.countByEventIdAndStatus(eventId, SeatStatus.AVAILABLE);
            redisson.getAtomicLong(inventoryKey).set(availableSeats);
        }

        Long stockResult = redisson.getScript(StringCodec.INSTANCE).eval(
            RScript.Mode.READ_WRITE,
            DECREMENT_SCRIPT,
            RScript.ReturnType.INTEGER,
            Collections.singletonList(inventoryKey),
            seatIds.size()
        );

        if (stockResult == null || stockResult == 0) {
            throw new RuntimeException("Not enough tickets available");
        }

        List<RLock> locks = new ArrayList<>();
        for (Long seatId : seatIds) {
            locks.add(redisson.getLock("seat:lock:" + eventId + ":" + seatId));
        }

        RLock multiLock = redisson.getMultiLock(locks.toArray(new RLock[0]));
        boolean lockAcquired = false;

        try {
            lockAcquired = multiLock.tryLock(2, 10, TimeUnit.SECONDS);

            if (!lockAcquired) {
                redisson.getAtomicLong("tickets:available:" + eventId).addAndGet(seatIds.size());
                throw new RuntimeException("Seats are currently being booked by someone else.");
            }

            List<Seat> seats = seatRepository.findAllBySeatIds(seatIds);
            
            for (Seat seat : seats) {
                if (seat.getStatus() != SeatStatus.AVAILABLE) {
                    redisson.getAtomicLong("tickets:available:" + eventId).addAndGet(seatIds.size());
                    throw new RuntimeException("Seat " + seat.getId() + " is already taken.");
                }
            }

            Order order = Order.builder()
                    .userId(userId)
                    .eventId(Long.valueOf(eventId))
                    .status(OrderStatus.PENDING)
                    .totalAmount(calculateTotal(seats))
                    .createdAt(LocalDateTime.now())
                    .seatIds(seatIds)
                    .build();
            orderRepository.save(order);

            for (Seat seat : seats) {
                seat.setStatus(SeatStatus.RESERVED);
            }
            seatRepository.saveAll(seats);

            redisson.getBucket("order_expiry:" + order.getId())
                    .set("PENDING", 5, TimeUnit.MINUTES);

            kafkaTemplate.send("orders.topic", new OrderCreatedEvent(order.getId(), userId, order.getTotalAmount()));
            
            kafkaTemplate.send("ticket-reserved", new TicketReservedEvent(order.getId(), eventId, seatIds, userId));

            return new BookResponse(order.getId(), "RESERVED_WAITING_PAYMENT");

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            redisson.getAtomicLong("tickets:available:" + eventId).addAndGet(seatIds.size());
            throw new RuntimeException("System Error during locking");
        } finally {
            if (lockAcquired) {
                multiLock.unlock();
            }
        }


    }

    private BigDecimal calculateTotal(List<Seat> seats) {
    return seats.stream()
            .map(seat -> seat.getSeatType().getPrice())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
}

    public BookResponse getOrder(String id){
        UUID orderId = UUID.fromString(id);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        return new BookResponse(order.getId(), order.getStatus().name());
    }
}
