package dev.woundex.search_service.consumer;

import dev.woundex.search_service.document.EventDocument;
import dev.woundex.search_service.dto.EventLifecycleMessage;
import dev.woundex.search_service.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventLifecycleConsumer {
    
    private final SearchService searchService;
    
    @KafkaListener(topics = "events.lifecycle", groupId = "search-service-lifecycle-group",
                   containerFactory = "eventLifecycleKafkaListenerContainerFactory")
    public void handleEventLifecycle(EventLifecycleMessage message) {
        log.info("Received event lifecycle message: type={}, eventId={}, name={}", 
                message.getType(), message.getEventId(), message.getName());
        
        try {
            String type = message.getType();
            if (type == null) {
                log.warn("Received message with null type: {}", message);
                return;
            }
            
            switch (type.toUpperCase()) {
                case "CREATED":
                    handleEventCreated(message);
                    break;
                case "PUBLISHED":
                    handleEventPublished(message);
                    break;
                case "CANCELLED":
                    handleEventCancelled(message);
                    break;
                case "DELETED":
                    handleEventDeleted(message);
                    break;
                default:
                    log.warn("Unknown event type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error processing event lifecycle message: {}", message, e);
        }
    }
    
    private void handleEventCreated(EventLifecycleMessage message) {
        EventDocument event = EventDocument.builder()
                .id(message.getEventId().toString())
                .name(message.getName())
                .status("CREATED")
                .totalSeats(0)
                .availableSeats(0)
                .build();
        
        searchService.indexEvent(event);
        log.info("Indexed new event: {}", message.getEventId());
    }
    
    private void handleEventPublished(EventLifecycleMessage message) {
        EventDocument event = EventDocument.builder()
                .id(message.getEventId().toString())
                .name(message.getName())
                .status("PUBLISHED")
                .totalSeats(message.getTotalInventory())
                .availableSeats(message.getTotalInventory())
                .build();
        
        searchService.indexEvent(event);
        log.info("Updated event to published: {}", message.getEventId());
    }
    
    private void handleEventCancelled(EventLifecycleMessage message) {
        EventDocument event = EventDocument.builder()
                .id(message.getEventId().toString())
                .name(message.getName())
                .status("CANCELLED")
                .availableSeats(0)
                .build();
        
        searchService.indexEvent(event);
        log.info("Marked event as cancelled: {}", message.getEventId());
    }
    
    private void handleEventDeleted(EventLifecycleMessage message) {
        searchService.deleteEvent(message.getEventId());
        log.info("Deleted event from Elasticsearch: {}", message.getEventId());
    }
}
