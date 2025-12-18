package dev.woundex.booking_service.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Custom metrics configuration for observability.
 * Tracks booking-specific metrics for Prometheus/Grafana dashboards.
 */
@Configuration
public class MetricsConfig {

    private final AtomicLong queueLength = new AtomicLong(0);

    @Bean
    public Counter lockFailuresCounter(MeterRegistry registry) {
        return Counter.builder("booking.lock.failures")
                .description("Total number of lock acquisition failures")
                .tag("service", "booking-service")
                .register(registry);
    }

    @Bean
    public Counter lockAcquisitionsCounter(MeterRegistry registry) {
        return Counter.builder("booking.lock.acquisitions")
                .description("Total number of successful lock acquisitions")
                .tag("service", "booking-service")
                .register(registry);
    }

    @Bean
    public Counter reservationExpirationsCounter(MeterRegistry registry) {
        return Counter.builder("booking.reservation.expirations")
                .description("Total number of reservation TTL expirations")
                .tag("service", "booking-service")
                .register(registry);
    }

    @Bean
    public Counter reservationsCreatedCounter(MeterRegistry registry) {
        return Counter.builder("booking.reservations.created")
                .description("Total number of reservations created")
                .tag("service", "booking-service")
                .register(registry);
    }

    @Bean
    public Counter bookingsCompletedCounter(MeterRegistry registry) {
        return Counter.builder("booking.completed")
                .description("Total number of completed bookings")
                .tag("service", "booking-service")
                .register(registry);
    }

    @Bean
    public Counter bookingsCancelledCounter(MeterRegistry registry) {
        return Counter.builder("booking.cancelled")
                .description("Total number of cancelled bookings")
                .tag("service", "booking-service")
                .register(registry);
    }

    @Bean
    public AtomicLong queueLengthGauge(MeterRegistry registry) {
        Gauge.builder("booking.queue.length", queueLength, AtomicLong::get)
                .description("Current booking queue length")
                .tag("service", "booking-service")
                .register(registry);
        return queueLength;
    }
}
