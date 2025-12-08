package dev.woundex.booking_service.Repository;

import dev.woundex.booking_service.Entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
}
