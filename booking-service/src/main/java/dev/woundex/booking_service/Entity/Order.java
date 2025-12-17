package dev.woundex.booking_service.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Table(name="orders")
@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
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
    
    @ElementCollection
    @CollectionTable(name = "order_seats", joinColumns = @JoinColumn(name = "order_id"))
    @Column(name = "seat_id")
    private List<Long> seatIds;
}
