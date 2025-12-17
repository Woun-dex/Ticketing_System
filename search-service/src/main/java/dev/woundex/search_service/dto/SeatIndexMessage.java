package dev.woundex.search_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatIndexMessage {
    private Long id;
    private Long eventId;
    private String rowNumber;
    private String seatNumber;
    private String status;
    private String seatTypeName;
    private BigDecimal price;
}
