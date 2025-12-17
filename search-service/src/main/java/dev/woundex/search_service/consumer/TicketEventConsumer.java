package dev.woundex.search_service.consumer;

import dev.woundex.search_service.dto.TicketCancelledEvent;
import dev.woundex.search_service.dto.TicketReservedEvent;
import dev.woundex.search_service.dto.TicketSoldEvent;
import dev.woundex.search_service.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketEventConsumer {
    
    private final SearchService searchService;
    
    @KafkaListener(topics = "ticket-reserved", groupId = "search-service-group",
                   containerFactory = "ticketReservedKafkaListenerContainerFactory")
    public void handleTicketReserved(TicketReservedEvent event) {
        log.info("Received ticket-reserved event for order: {}", event.getOrderId());
        try {
            searchService.updateSeatsStatus(event.getSeatIds(), event.getEventId(), "RESERVED");
        } catch (Exception e) {
            log.error("Error processing ticket-reserved event", e);
        }
    }
    
    @KafkaListener(topics = "ticket-sold", groupId = "search-service-group",
                   containerFactory = "ticketSoldKafkaListenerContainerFactory")
    public void handleTicketSold(TicketSoldEvent event) {
        log.info("Received ticket-sold event for order: {}", event.getOrderId());
        try {
            searchService.updateSeatsStatus(event.getSeatIds(), event.getEventId(), "SOLD");
        } catch (Exception e) {
            log.error("Error processing ticket-sold event", e);
        }
    }
    
    @KafkaListener(topics = "ticket-cancelled", groupId = "search-service-group",
                   containerFactory = "ticketCancelledKafkaListenerContainerFactory")
    public void handleTicketCancelled(TicketCancelledEvent event) {
        log.info("Received ticket-cancelled event for order: {}, reason: {}", event.getOrderId(), event.getReason());
        try {
            searchService.updateSeatsStatus(event.getSeatIds(), event.getEventId(), "AVAILABLE");
        } catch (Exception e) {
            log.error("Error processing ticket-cancelled event", e);
        }
    }
}
