package dev.woundex.admin_service.service;


import dev.woundex.admin_service.Entity.Event;
import dev.woundex.admin_service.Entity.Seat;
import dev.woundex.admin_service.Entity.SeatType;
import dev.woundex.admin_service.Enum.EventStatus;
import dev.woundex.admin_service.Enum.SeatStatus;
import dev.woundex.admin_service.Repository.EventRepository;
import dev.woundex.admin_service.Repository.SeatRepository;
import dev.woundex.admin_service.Repository.SeatTypeRepository;
import dev.woundex.admin_service.dto.*;
import dev.woundex.admin_service.kafka.KafkaProducerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminEventService {

    private final EventRepository eventRepository;
    private final SeatTypeRepository seatTypeRepository;
    private final SeatRepository seatRepository;
    private final KafkaProducerService kafkaProducer;

    @Transactional
    public Event createEvent(EventRequest request) {
        Event event = Event.builder()
                .name(request.getName())
                .type(request.getType())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(EventStatus.DRAFT) // Default to DRAFT
                .build();

        Event savedEvent = eventRepository.save(event);

        kafkaProducer.sendEventCreated(savedEvent.getId(), savedEvent.getName());

        return savedEvent;
    }

    public SeatType addSeatType(Long eventId, SeatTypeRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        SeatType type = SeatType.builder()
                .event(event)
                .name(request.getName())
                .price(request.getPrice())
                .build();

        return seatTypeRepository.save(type);
    }

    @Transactional
    public void generateSeats(Long eventId, SeatGenerationRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        SeatType seatType = seatTypeRepository.findById(request.getSeatTypeId())
                .orElseThrow(() -> new RuntimeException("Seat Type not found"));

        List<Seat> seats = new ArrayList<>();
        for (int i = request.getStartSeatNumber(); i <= request.getEndSeatNumber(); i++) {
            seats.add(Seat.builder()
                    .event(event)
                    .seatType(seatType)
                    .rowNumber(request.getRowPrefix())
                    .seatNumber(String.valueOf(i))
                    .status(SeatStatus.AVAILABLE)
                    .build());
        }

        seatRepository.saveAll(seats);

    }

    @Transactional
    public void publishEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new IllegalStateException("Event must be DRAFT to publish");
        }

        int totalSeats = seatRepository.countByEventId(eventId);
        if (totalSeats == 0) {
            throw new IllegalStateException("Cannot publish event with 0 seats");
        }

        event.setStatus(EventStatus.PUBLISHED);
        eventRepository.save(event);

        kafkaProducer.sendEventPublished(event.getId(), event.getName(), totalSeats);
    }

    public EventInventoryResponse getEventInventory(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        List<Seat> seats = seatRepository.findByEventId(eventId);

        List<SeatResponse> seatResponses = seats.stream()
                .map(seat -> SeatResponse.builder()
                        .id(seat.getId())
                        .row(seat.getRowNumber())
                        .number(seat.getSeatNumber())
                        .status(seat.getStatus())
                        .typeName(seat.getSeatType().getName())
                        .price(seat.getSeatType().getPrice())
                        .build())
                .toList();

        int availableCount = (int) seats.stream()
                .filter(s -> s.getStatus() == SeatStatus.AVAILABLE)
                .count();

        return EventInventoryResponse.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .totalSeats(seats.size())
                .availableSeats(availableCount)
                .seats(seatResponses)
                .build();
    }

    @Transactional
    public SeatResponse updateSeatStatus(Long seatId, SeatStatus newStatus) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new RuntimeException("Seat not found"));

        if (seat.getStatus() == SeatStatus.SOLD) {
            throw new IllegalStateException("Cannot edit a SOLD seat");
        }

        seat.setStatus(newStatus);
        Seat savedSeat = seatRepository.save(seat);


        return SeatResponse.builder()
                .id(savedSeat.getId())
                .row(savedSeat.getRowNumber())
                .number(savedSeat.getSeatNumber())
                .status(savedSeat.getStatus())
                .typeName(savedSeat.getSeatType().getName())
                .price(savedSeat.getSeatType().getPrice())
                .build();
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    @Transactional
    public Event updateEvent(Long eventId, EventRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getStatus() == EventStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot edit a published event");
        }

        event.setName(request.getName());
        event.setType(request.getType());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());

        return eventRepository.save(event);
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getStatus() == EventStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot delete a published event");
        }

        // Delete all seats first
        seatRepository.deleteByEventId(eventId);
        
        // Delete all seat types
        seatTypeRepository.deleteByEventId(eventId);
        
        // Delete the event
        eventRepository.delete(event);
    }

    @Transactional
    public void cancelEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);

        kafkaProducer.sendEventCancelled(eventId, event.getName());
    }

}