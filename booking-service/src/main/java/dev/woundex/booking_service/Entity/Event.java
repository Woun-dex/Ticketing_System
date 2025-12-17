package dev.woundex.booking_service.Entity;

import java.time.LocalDateTime;
import java.util.List;

import dev.woundex.booking_service.Enum.EventStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AccessLevel;

@Entity
@Data
@Table(name = "events")
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private List<SeatType> seatTypes;
}
