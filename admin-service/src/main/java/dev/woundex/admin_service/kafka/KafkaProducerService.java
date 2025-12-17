package dev.woundex.admin_service.kafka;

import dev.woundex.admin_service.dto.EventLifecycleMessage;
import dev.woundex.admin_service.dto.SeatIndexMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String EVENTS_TOPIC = "events.lifecycle";
    private static final String SEATS_TOPIC = "seats.index";

    public void sendEventCreated(Long eventId, String name) {
        EventLifecycleMessage message = new EventLifecycleMessage("CREATED", eventId, name, 0);
        kafkaTemplate.send(EVENTS_TOPIC, eventId.toString(), message);
        log.info("Sent CREATED event for id: {}, message: {}", eventId, message);
    }

    public void sendEventPublished(Long eventId, String name, int totalInventory) {
        EventLifecycleMessage message = new EventLifecycleMessage("PUBLISHED", eventId, name, totalInventory);
        kafkaTemplate.send(EVENTS_TOPIC, eventId.toString(), message);
        log.info("Sent PUBLISHED event for id: {} with inventory: {}, message: {}", eventId, totalInventory, message);
    }

    public void sendEventCancelled(Long eventId, String name) {
        EventLifecycleMessage message = new EventLifecycleMessage("CANCELLED", eventId, name, 0);
        kafkaTemplate.send(EVENTS_TOPIC, eventId.toString(), message);
        log.info("Sent CANCELLED event for id: {}, message: {}", eventId, message);
    }

    public void sendSeatsForIndexing(List<SeatIndexMessage> seats) {
        for (SeatIndexMessage seat : seats) {
            kafkaTemplate.send(SEATS_TOPIC, seat.getId().toString(), seat);
            log.debug("Sent seat for indexing: {}", seat.getId());
        }
        log.info("Sent {} seats for indexing", seats.size());
    }
}
