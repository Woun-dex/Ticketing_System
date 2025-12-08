package dev.woundex.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookResponse {
    private UUID orderId;
    private int expiresInSeconds;
    private String message;
}