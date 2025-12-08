package dev.woundex.booking_service.service;

import dev.woundex.admin_service.Repository.SeatRepository;
import dev.woundex.auth_service.Controller.AuthClient;
import dev.woundex.auth_service.Entities.User;
import dev.woundex.auth_service.dto.UserResponse;
import dev.woundex.booking_service.Repository.OrderRepository;
import dev.woundex.booking_service.dto.BookRequest;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final RedissonClient redisson;
    public  AuthClient authClient;
    public  SeatRepository seatRepository;
    public final OrderRepository orderRepository;
    public final KafkaTemplate<String, Object> KafkaTemplate;



    public BookResponse createBooking(BookRequest req , String jwt){

        UserResponse user = authClient.validateToken(jwt);

        Long eventId = req.getEventId();
        List<UUID> seatIds = req.getSeatIds();

        RLock lock = redisson.getLock("seat_lock:" + eventId + ":" + seatIds);
        boolean locked = lock.tryLock(300,5000, TimeUnit.MILLISECONDS);
        if (locked) {
            metrics.counter("booking.lock.fail").increment();
        }


    }
}
