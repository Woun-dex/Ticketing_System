package dev.woundex.booking_service.Repository;

import dev.woundex.booking_service.Entity.Seat;
import dev.woundex.booking_service.Enum.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Integer> {

    int countByEventId(Long eventId);
    
    int countByEventIdAndStatus(Long eventId, SeatStatus status);

    List<Seat> findByEventId(Long eventId);

    Optional<Seat> findById(Long id);

    @Query("SELECT s FROM Seat s WHERE s.id IN :ids")
    List<Seat> findAllBySeatIds(@Param("ids") List<Long> ids);

    void deleteByEventId(Long eventId);
}
