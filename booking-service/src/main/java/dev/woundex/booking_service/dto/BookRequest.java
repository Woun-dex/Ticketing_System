package dev.woundex.booking_service.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BookRequest {

    private Long eventId ;
    private List<UUID> seatIds;
}
