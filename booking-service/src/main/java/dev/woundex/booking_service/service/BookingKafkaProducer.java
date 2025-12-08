package dev.woundex.booking_service.service;

import dev.woundex.booking_service.dto.TicketReserved;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class BookingKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public BookingKafkaProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishTicketReserved(TicketReserved event) {
        kafkaTemplate.send("ticket-reserved", event.getOrderId().toString(), event);
    }
}
