package dev.woundex.booking_service.kafka;

import dev.woundex.booking_service.dto.EventLifecycleMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventLifecycleConsumer {

    private final RedissonClient redissonClient;

    @KafkaListener(topics = "events.lifecycle", groupId = "booking-service-group")
    public void handleEventLifecycle(EventLifecycleMessage message) {
        log.info("Received event lifecycle message: type={}, eventId={}, totalInventory={}", 
                message.getType(), message.getEventId(), message.getTotalInventory());

        switch (message.getType()) {
            case "PUBLISHED" -> initializeInventory(message);
            case "CANCELLED" -> clearInventory(message);
            default -> log.debug("Ignoring event type: {}", message.getType());
        }
    }

    private void initializeInventory(EventLifecycleMessage message) {
        String key = "tickets:available:" + message.getEventId();
        redissonClient.getAtomicLong(key).set(message.getTotalInventory());
        log.info("Initialized Redis inventory for event {}: {} tickets available", 
                message.getEventId(), message.getTotalInventory());
    }

    private void clearInventory(EventLifecycleMessage message) {
        String key = "tickets:available:" + message.getEventId();
        redissonClient.getAtomicLong(key).delete();
        log.info("Cleared Redis inventory for cancelled event {}", message.getEventId());
    }
}
