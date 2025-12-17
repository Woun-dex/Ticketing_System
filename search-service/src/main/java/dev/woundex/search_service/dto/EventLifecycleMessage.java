package dev.woundex.search_service.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventLifecycleMessage {
    @JsonAlias({"type", "action"})
    private String type;
    
    private Long eventId;
    
    @JsonAlias({"name", "eventName"})
    private String name;
    
    @JsonAlias({"totalInventory", "inventoryCount"})
    private Integer totalInventory;
}
