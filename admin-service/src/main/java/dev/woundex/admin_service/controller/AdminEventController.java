package dev.woundex.admin_service.controller;

import dev.woundex.admin_service.Entity.Event;
import dev.woundex.admin_service.Entity.SeatType;
import dev.woundex.admin_service.Enum.SeatStatus;
import dev.woundex.admin_service.dto.*;
import dev.woundex.admin_service.service.AdminEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/events")
@RequiredArgsConstructor
public class AdminEventController {

    private final AdminEventService adminService;

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(adminService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getEventById(id));
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody EventRequest request) {
        return ResponseEntity.ok(adminService.createEvent(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody EventRequest request) {
        return ResponseEntity.ok(adminService.updateEvent(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEvent(@PathVariable Long id) {
        adminService.deleteEvent(id);
        return ResponseEntity.ok("Event deleted successfully");
    }

    @PostMapping("/{id}/seat-types")
    public ResponseEntity<SeatType> addSeatType(@PathVariable Long id, @RequestBody SeatTypeRequest request) {
        return ResponseEntity.ok(adminService.addSeatType(id, request));
    }

    @PostMapping("/{id}/seats/generate")
    public ResponseEntity<String> generateSeats(@PathVariable Long id, @RequestBody SeatGenerationRequest request) {
        adminService.generateSeats(id, request);
        return ResponseEntity.ok("Seats generated successfully");
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<String> publishEvent(@PathVariable Long id) {
        adminService.publishEvent(id);
        return ResponseEntity.ok("Event Published. Inventory syncing to Booking Engine.");
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<String> cancelEvent(@PathVariable Long id) {
        adminService.cancelEvent(id);
        return ResponseEntity.ok("Event cancelled successfully");
    }

    @GetMapping("/{id}/inventory")
    public ResponseEntity<EventInventoryResponse> getEventInventory(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getEventInventory(id));
    }

    @PutMapping("/seats/{seatId}")
    public ResponseEntity<SeatResponse> updateSeatStatus(
            @PathVariable Long seatId,
            @RequestParam SeatStatus status) {
        return ResponseEntity.ok(adminService.updateSeatStatus(seatId, status));
    }

}