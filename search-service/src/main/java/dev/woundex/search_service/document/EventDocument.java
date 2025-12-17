package dev.woundex.search_service.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;

@Document(indexName = "events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDocument {
    
    @Id
    private String id;
    
    @Field(type = FieldType.Text)
    private String name;
    
    @Field(type = FieldType.Keyword)
    private String type;
    
    @Field(type = FieldType.Keyword)
    private String status;
    
    @Field(type = FieldType.Date)
    private LocalDateTime startTime;
    
    @Field(type = FieldType.Date)
    private LocalDateTime endTime;
    
    @Field(type = FieldType.Integer)
    private Integer totalSeats;
    
    @Field(type = FieldType.Integer)
    private Integer availableSeats;
}
