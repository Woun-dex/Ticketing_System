package dev.woundex.admin_service.dto;


import lombok.Data;

@Data
public class SeatGenerationRequest {
    private Long seatTypeId;
    private String rowPrefix;
    private int startSeatNumber;
    private int endSeatNumber;
}