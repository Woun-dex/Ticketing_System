package dev.woundex.admin_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public  class EventLifecycleMessage {
    private String action;
    private Long eventId;
    private String eventName;
    private int inventoryCount;
}