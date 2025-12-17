package dev.woundex.booking_service.dto;

import lombok.Data;

import java.util.List;

@Data
public class BookRequest {

    private Long eventId ;
    private List<Long> seatIds;
}
