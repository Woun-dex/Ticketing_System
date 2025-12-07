package dev.woundex.admin_service.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder


public class EventInventoryResponse {
    private Long eventId;
    private String eventName;
    private int totalSeats;
    private int availableSeats;
    private List<SeatResponse> seats;
}

