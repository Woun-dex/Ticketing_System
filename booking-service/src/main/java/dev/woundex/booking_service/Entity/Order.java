package dev.woundex.booking_service.Entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name="orders")
@Builder
@Getter @Setter
public class Order {
    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;
    private UUID userId;
    private Long eventId;
    private BigDecimal totalAmount;
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    private LocalDateTime createdAt;
}
