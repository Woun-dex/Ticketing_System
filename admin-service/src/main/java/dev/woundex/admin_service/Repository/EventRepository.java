package dev.woundex.admin_service.Repository;

import dev.woundex.admin_service.Entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface EventRepository extends JpaRepository<Event,Integer> {
    Optional<Event> findById(long Id);
}
