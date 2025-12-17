package dev.woundex.search_service.dto;

import dev.woundex.search_service.document.SeatDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResponse {
    private Long eventId;
    private String eventName;
    private String eventType;
    private Integer totalSeats;
    private Integer availableSeats;
    private List<SeatDocument> seats;
}
