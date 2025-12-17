package dev.woundex.search_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketCancelledEvent {
    private UUID orderId;
    private Long eventId;
    private List<Long> seatIds;
    private String reason;
}
