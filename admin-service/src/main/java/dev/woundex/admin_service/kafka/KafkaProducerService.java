package dev.woundex.admin_service.kafka;

import ch.qos.logback.classic.Logger;
import dev.woundex.admin_service.dto.EventLifecycleMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "events.lifecycle";

    public void sendEventCreated(Long eventId, String name) {
        kafkaTemplate.send(TOPIC, "CREATED", new EventLifecycleMessage("CREATED", eventId, name, 0));
        log.info("Sent CREATED event for id: {}", eventId);
    }

    public void sendEventPublished(Long eventId, String name, int totalInventory) {
        kafkaTemplate.send(TOPIC, "PUBLISH", new EventLifecycleMessage("PUBLISHED", eventId, name, totalInventory));
        log.info("Sent PUBLISHED event for id: {} with inventory: {}", eventId, totalInventory);
    }

    public void sendEventCancelled(Long eventId, String name) {
        kafkaTemplate.send(TOPIC, "CANCELLED", new EventLifecycleMessage("CANCELLED", eventId, name, 0));
        log.info("Sent CANCELLED event for id: {}", eventId);
    }

}
