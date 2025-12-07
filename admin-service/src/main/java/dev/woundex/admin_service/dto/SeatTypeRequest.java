package dev.woundex.admin_service.dto;


import java.math.BigDecimal;
import lombok.Data;

@Data
public class SeatTypeRequest {
    private String name;
    private BigDecimal price;
}