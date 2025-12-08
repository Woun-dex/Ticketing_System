package dev.woundex.booking_service.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Data
@Table(name="orders")
@Getter @Setter
public class Order {
    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;
    private UUID userId;
    private Long eventId;
    private UUID seatId;
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    private java.time.OffsetDateTime createdAt;
    private java.time.OffsetDateTime updatedAt;
}
