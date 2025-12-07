package dev.woundex.admin_service.dto;


import dev.woundex.admin_service.Enum.SeatStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class SeatResponse {
    private Long id;
    private String row;        // e.g., "A"
    private String number;     // e.g., "101"
    private SeatStatus status; // AVAILABLE, BLOCKED, SOLD
    private String typeName;   // "VIP", "Standard"
    private BigDecimal price;  // 150.00
}