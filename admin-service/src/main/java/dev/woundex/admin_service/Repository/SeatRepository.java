package dev.woundex.admin_service.Repository;

import dev.woundex.admin_service.Entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeatRepository extends JpaRepository<Seat,Integer> {
    int countByEventId(Long eventId);

    Optional<Seat> findById(long Id);

    List<Seat> findByEventId(Long eventId);

    void deleteByEventId(Long eventId);
}
