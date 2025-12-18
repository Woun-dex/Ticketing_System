package dev.woundex.booking_service.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import dev.woundex.booking_service.dto.BookRequest;
import dev.woundex.booking_service.dto.BookResponse;
import dev.woundex.booking_service.service.BookingService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/book")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookResponse> book(@RequestBody BookRequest req , @RequestHeader("Authorization") String jwt){
        BookResponse response = bookingService.createBooking(req,jwt);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<BookResponse> getOrder(@PathVariable String id){
        BookResponse response = bookingService.getOrder(id);
        return ResponseEntity.ok(response); 
    }
    
}
