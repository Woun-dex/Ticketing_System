package dev.woundex.search_service.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.math.BigDecimal;

@Document(indexName = "seats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatDocument {
    
    @Id
    private String id;
    
    @Field(type = FieldType.Long)
    private Long eventId;
    
    @Field(type = FieldType.Text)
    private String rowNumber;
    
    @Field(type = FieldType.Text)
    private String seatNumber;
    
    @Field(type = FieldType.Keyword)
    private String status;
    
    @Field(type = FieldType.Text)
    private String seatTypeName;
    
    @Field(type = FieldType.Double)
    private BigDecimal price;
}
