package dev.woundex.admin_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventLifecycleMessage {
    private String type;
    private Long eventId;
    private String name;
    private Integer totalInventory;
}