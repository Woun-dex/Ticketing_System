package dev.woundex.admin_service.Repository;

import dev.woundex.admin_service.Entity.SeatType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SeatTypeRepository extends JpaRepository<SeatType,Integer> {
    Optional<SeatType> findById(long Id);

    void deleteByEventId(Long eventId);
}
