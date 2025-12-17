package dev.woundex.search_service.controller;

import dev.woundex.search_service.document.EventDocument;
import dev.woundex.search_service.document.SeatDocument;
import dev.woundex.search_service.dto.SearchResponse;
import dev.woundex.search_service.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {
    
    private final SearchService searchService;
    
    @GetMapping("/{eventId}")
    public ResponseEntity<SearchResponse> searchByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(searchService.searchByEventId(eventId));
    }
    
    @GetMapping("/events")
    public ResponseEntity<List<EventDocument>> searchEvents(
            @RequestParam(required = false) String query) {
        try {
            log.info("Searching events with query: {}", query);
            List<EventDocument> events = searchService.searchEvents(query);
            log.info("Found {} events", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("Error searching events", e);
            throw e;
        }
    }
    
    @GetMapping("/events/type/{type}")
    public ResponseEntity<List<EventDocument>> searchEventsByType(@PathVariable String type) {
        return ResponseEntity.ok(searchService.searchEventsByType(type));
    }
    
    @GetMapping("/events/available")
    public ResponseEntity<List<EventDocument>> getAvailableEvents() {
        try {
            log.info("Getting available events");
            List<EventDocument> events = searchService.getAvailableEvents();
            log.info("Found {} available events", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("Error getting available events", e);
            throw e;
        }
    }

    @GetMapping("/seats/{eventId}")
    public ResponseEntity<List<SeatDocument>> getSeatsByEventId(@PathVariable Long eventId) {
        try {
            log.info("Getting seats for event: {}", eventId);
            List<SeatDocument> seats = searchService.getSeatsByEventId(eventId);
            log.info("Found {} seats for event {}", seats.size(), eventId);
            return ResponseEntity.ok(seats);
        } catch (Exception e) {
            log.error("Error getting seats for event: {}", eventId, e);
            throw e;
        }
    }

    @GetMapping("/seats/{eventId}/available")
    public ResponseEntity<List<SeatDocument>> getAvailableSeatsByEventId(@PathVariable Long eventId) {
        try {
            log.info("Getting available seats for event: {}", eventId);
            List<SeatDocument> seats = searchService.getAvailableSeatsByEventId(eventId);
            log.info("Found {} available seats for event {}", seats.size(), eventId);
            return ResponseEntity.ok(seats);
        } catch (Exception e) {
            log.error("Error getting available seats for event: {}", eventId, e);
            throw e;
        }
    }
}
