package dev.woundex.booking_service;

import dev.woundex.admin_service.Entity.Event;
import dev.woundex.admin_service.Entity.Seat;
import dev.woundex.admin_service.Entity.SeatType;
import dev.woundex.admin_service.Enum.EventStatus;
import dev.woundex.admin_service.Enum.SeatStatus;
import dev.woundex.admin_service.Repository.SeatRepository;
import dev.woundex.auth_service.Controller.AuthClient;
import dev.woundex.auth_service.dto.UserResponse;
import dev.woundex.booking_service.Repository.OrderRepository;
import dev.woundex.booking_service.dto.BookRequest;
import dev.woundex.booking_service.dto.BookResponse;
import dev.woundex.booking_service.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@EnableAutoConfiguration
@EnableJpaRepositories(basePackages = "dev.woundex.admin_service.Repository")
@EntityScan(basePackages = {"dev.woundex.admin_service.Entity", "dev.woundex.booking_service.Entity"})
public class BookingConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RedissonClient redissonClient;

    @MockBean
    private AuthClient authClient;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static final Long TEST_EVENT_ID = 1L;
    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final String TEST_JWT = "test-jwt-token";
    
    private List<Long> testSeatIds;

    @BeforeEach
    public void setup() {
        // Clean up database
        orderRepository.deleteAll();
        seatRepository.deleteAll();
        
        // Mock AuthClient to return a valid user without needing real JWT validation
        UserResponse mockUser = UserResponse.builder()
                .id(TEST_USER_ID)
                .username("testuser")
                .email("test@example.com")
                .role("USER")
                .build();
        
        when(authClient.validateToken(anyString())).thenReturn(mockUser);
        
        // Mock Kafka to prevent actual message sending
        when(kafkaTemplate.send(anyString(), any())).thenReturn(null);
        
        // Initialize Redis ticket counter
        redissonClient.getAtomicLong("tickets:available:" + TEST_EVENT_ID).set(10);
        
        // Create test seats in database and store their IDs
        testSeatIds = createTestSeats(10);
    }

    @Test
    public void testConcurrentBookings_shouldOnlyAllowCorrectNumberOfBookings() throws InterruptedException {
        int numberOfThreads = 15; // More threads than available seats
        int availableSeats = 10;
        
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        
        List<Future<BookResponse>> futures = new ArrayList<>();

        // Each thread tries to book 1 seat
        for (int i = 0; i < numberOfThreads; i++) {
            final int threadNum = i;
            Future<BookResponse> future = executorService.submit(() -> {
                try {
                    // Each thread tries to book a seat (reusing seat IDs will cause conflicts)
                    int seatIndex = threadNum % testSeatIds.size();
                    
                    BookRequest req = new BookRequest();
                    req.setEventId(TEST_EVENT_ID);
                    req.setSeatIds(List.of(testSeatIds.get(seatIndex)));
                    
                    BookResponse response = bookingService.createBooking(req, TEST_JWT);
                    successCount.incrementAndGet();
                    return response;
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                    System.out.println("Booking failed for thread " + threadNum + ": " + e.getMessage());
                    return null;
                } finally {
                    latch.countDown();
                }
            });
            futures.add(future);
        }

        latch.await(30, TimeUnit.SECONDS);
        executorService.shutdown();
        executorService.awaitTermination(10, TimeUnit.SECONDS);

        // Verify results
        System.out.println("Successful bookings: " + successCount.get());
        System.out.println("Failed bookings: " + failureCount.get());
        
        assertThat(successCount.get()).isLessThanOrEqualTo(availableSeats);
        assertThat(successCount.get() + failureCount.get()).isEqualTo(numberOfThreads);
        
        // Verify database state
        long reservedSeats = seatRepository.findAll().stream()
                .filter(seat -> seat.getStatus() == SeatStatus.RESERVED)
                .count();
        
        assertEquals(successCount.get(), reservedSeats, 
                "Reserved seats in DB should match successful bookings");
        
        // Verify Redis counter
        long remainingTickets = redissonClient.getAtomicLong("tickets:available:" + TEST_EVENT_ID).get();
        assertThat(remainingTickets).isGreaterThanOrEqualTo(0);
    }

    @Test
    public void testConcurrentBookings_multipleSeatsPerUser() throws InterruptedException {
        int numberOfThreads = 5;
        int seatsPerBooking = 2;
        int totalSeatsNeeded = numberOfThreads * seatsPerBooking; // 10 seats needed
        
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        
        ConcurrentHashMap<Integer, BookResponse> results = new ConcurrentHashMap<>();
        ConcurrentHashMap<Integer, Exception> errors = new ConcurrentHashMap<>();

        for (int i = 0; i < numberOfThreads; i++) {
            final int threadNum = i;
            executorService.submit(() -> {
                try {
                    int startIdx = threadNum * seatsPerBooking;
                    
                    if (startIdx + seatsPerBooking <= testSeatIds.size()) {
                        List<Long> seatIds = testSeatIds.subList(startIdx, startIdx + seatsPerBooking);
                        
                        BookRequest req = new BookRequest();
                        req.setEventId(TEST_EVENT_ID);
                        req.setSeatIds(seatIds);
                        
                        BookResponse response = bookingService.createBooking(req, TEST_JWT);
                        results.put(threadNum, response);
                    }
                } catch (Exception e) {
                    errors.put(threadNum, e);
                    System.out.println("Error in thread " + threadNum + ": " + e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(30, TimeUnit.SECONDS);
        executorService.shutdown();

        System.out.println("Successful bookings: " + results.size());
        System.out.println("Failed bookings: " + errors.size());
        
        // Check that we have reasonable results
        assertThat(results.size()).isGreaterThan(0);
        
        // Verify seats are reserved
        long reservedCount = seatRepository.findAll().stream()
                .filter(seat -> seat.getStatus() == SeatStatus.RESERVED)
                .count();
        
        assertThat(reservedCount).isEqualTo(results.size() * seatsPerBooking);
    }

    private List<Long> createTestSeats(int count) {
        Event event = new Event();
        event.setId(TEST_EVENT_ID);

        SeatType seatType = new SeatType();
        seatType.setName("Standard");
        seatType.setPrice(new BigDecimal("50.00"));
        
        List<Seat> seats = new ArrayList<>();
        List<Long> seatIds = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            Seat seat = new Seat();
            seat.setRowNumber("A");
            seat.setSeatNumber("A" + (i + 1));
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setSeatType(seatType);
            seat.setEvent(event);
            seats.add(seat);
        }
        
        List<Seat> savedSeats = seatRepository.saveAll(seats);
        for (Seat seat : savedSeats) {
            seatIds.add(seat.getId());
        }
        
        return seatIds;
    }
}

