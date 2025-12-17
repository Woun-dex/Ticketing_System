package dev.woundex.search_service.consumer;

import dev.woundex.search_service.document.SeatDocument;
import dev.woundex.search_service.dto.SeatIndexMessage;
import dev.woundex.search_service.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SeatIndexConsumer {

    private final SearchService searchService;

    @KafkaListener(topics = "seats.index", groupId = "search-service-seats-group", 
                   containerFactory = "seatIndexKafkaListenerContainerFactory")
    public void handleSeatIndex(SeatIndexMessage message) {
        log.info("Received seat index message: seatId={}, eventId={}", message.getId(), message.getEventId());

        try {
            SeatDocument seatDocument = SeatDocument.builder()
                    .id(message.getId().toString())
                    .eventId(message.getEventId())
                    .rowNumber(message.getRowNumber())
                    .seatNumber(message.getSeatNumber())
                    .status(message.getStatus())
                    .seatTypeName(message.getSeatTypeName())
                    .price(message.getPrice())
                    .build();

            searchService.indexSeat(seatDocument);
            log.info("Indexed seat: {} for event: {}", message.getId(), message.getEventId());
        } catch (Exception e) {
            log.error("Error indexing seat: {}", message.getId(), e);
        }
    }
}
