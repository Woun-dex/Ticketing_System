package dev.woundex.admin_service.Repository;

import dev.woundex.admin_service.Entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SeatRepository extends JpaRepository<Seat,Integer> {

    int countByEventId(Long eventId);

    List<Seat> findByEventId(Long eventId);

    Optional<Seat> findById(Long id);
    
    @Query("SELECT s FROM Seat s WHERE s.id IN :ids")
    List<Seat> findAllBySeatIds(@Param("ids") List<Long> ids);


    void deleteByEventId(Long eventId);
}
