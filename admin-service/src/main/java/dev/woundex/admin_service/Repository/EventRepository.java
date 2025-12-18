package dev.woundex.admin_service.Repository;

import dev.woundex.admin_service.Entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface EventRepository extends JpaRepository<Event,Integer> {
    Optional<Event> findById(long Id);
    
    @Modifying
    @Query(value = "DELETE FROM order_seats WHERE order_id IN (SELECT id FROM orders WHERE event_id = :eventId)", nativeQuery = true)
    void deleteOrderSeatsByEventId(@Param("eventId") Long eventId);
    
    @Modifying
    @Query(value = "DELETE FROM orders WHERE event_id = :eventId", nativeQuery = true)
    void deleteOrdersByEventId(@Param("eventId") Long eventId);
}
