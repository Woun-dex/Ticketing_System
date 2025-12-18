package dev.woundex.search_service.service;

import dev.woundex.search_service.document.EventDocument;
import dev.woundex.search_service.document.SeatDocument;
import dev.woundex.search_service.dto.SearchResponse;
import dev.woundex.search_service.repository.EventSearchRepository;
import dev.woundex.search_service.repository.SeatSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {
    
    private final EventSearchRepository eventSearchRepository;
    private final SeatSearchRepository seatSearchRepository;
    
    public SearchResponse searchByEventId(Long eventId) {
        Optional<EventDocument> eventOpt = eventSearchRepository.findById(eventId.toString());
        
        if (eventOpt.isEmpty()) {
            return SearchResponse.builder()
                    .eventId(eventId)
                    .availableSeats(0)
                    .seats(List.of())
                    .build();
        }
        
        EventDocument event = eventOpt.get();
        // Get ALL seats for the seat map display (not just available)
        List<SeatDocument> allSeats = seatSearchRepository.findByEventId(eventId);
        long availableCount = allSeats.stream().filter(s -> "AVAILABLE".equals(s.getStatus())).count();
        
        return SearchResponse.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .eventType(event.getType())
                .totalSeats(event.getTotalSeats())
                .availableSeats((int) availableCount)
                .seats(allSeats)
                .build();
    }
    
    public List<EventDocument> searchEvents(String query) {
        if (query == null || query.isBlank()) {
            List<EventDocument> events = new java.util.ArrayList<>();
            eventSearchRepository.findAll().forEach(events::add);
            return events;
        }
        return eventSearchRepository.findByNameContainingIgnoreCase(query);
    }
    
    public List<EventDocument> searchEventsByType(String type) {
        return eventSearchRepository.findByType(type);
    }
    
    public List<EventDocument> getAvailableEvents() {
        return eventSearchRepository.findByAvailableSeatsGreaterThan(0);
    }
    
    public void updateSeatStatus(Long seatId, Long eventId, String status) {
        Optional<SeatDocument> seatOpt = seatSearchRepository.findById(seatId.toString());
        
        if (seatOpt.isPresent()) {
            SeatDocument seat = seatOpt.get();
            seat.setStatus(status);
            seatSearchRepository.save(seat);
            log.info("Updated seat {} to status {}", seatId, status);
            
            // Update available seats count in event
            updateEventAvailableSeats(eventId);
        }
    }
    
    public void updateSeatsStatus(List<Long> seatIds, Long eventId, String status) {
        for (Long seatId : seatIds) {
            updateSeatStatus(seatId, eventId, status);
        }
    }
    
    private void updateEventAvailableSeats(Long eventId) {
        Optional<EventDocument> eventOpt = eventSearchRepository.findById(eventId.toString());
        if (eventOpt.isPresent()) {
            EventDocument event = eventOpt.get();
            long availableCount = seatSearchRepository.countByEventIdAndStatus(eventId, "AVAILABLE");
            event.setAvailableSeats((int) availableCount);
            eventSearchRepository.save(event);
            log.info("Updated event {} available seats to {}", eventId, availableCount);
        }
    }
    
    public void indexEvent(EventDocument event) {
        eventSearchRepository.save(event);
        log.info("Indexed event: {}", event.getId());
    }
    
    public void deleteEvent(Long eventId) {
        // Delete all seats for this event first
        List<SeatDocument> seats = seatSearchRepository.findByEventId(eventId);
        seatSearchRepository.deleteAll(seats);
        log.info("Deleted {} seats for event: {}", seats.size(), eventId);
        
        // Delete the event document
        eventSearchRepository.deleteById(eventId.toString());
        log.info("Deleted event from index: {}", eventId);
    }
    
    public void indexSeat(SeatDocument seat) {
        seatSearchRepository.save(seat);
        log.info("Indexed seat: {}", seat.getId());
    }

    public List<SeatDocument> getSeatsByEventId(Long eventId) {
        return seatSearchRepository.findByEventId(eventId);
    }

    public List<SeatDocument> getAvailableSeatsByEventId(Long eventId) {
        return seatSearchRepository.findByEventIdAndStatus(eventId, "AVAILABLE");
    }
}
