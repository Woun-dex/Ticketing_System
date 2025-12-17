package dev.woundex.booking_service.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@Getter @Setter
public class TicketReserved {
    private Long eventId ;
    private UUID orderId ;
    private UUID userId ;
    private List<UUID> seatIds ;
}
