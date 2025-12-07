package dev.woundex.admin_service.Entity;

import java.time.LocalDateTime;
import java.util.List;

import dev.woundex.admin_service.Enum.EventStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Table(name = "events")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type ;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @OneToMany(mappedBy = "event" , cascade = CascadeType.ALL)
    private List<SeatType> seatTypes;

}
