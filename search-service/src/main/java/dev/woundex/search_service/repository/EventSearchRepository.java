package dev.woundex.search_service.repository;

import dev.woundex.search_service.document.EventDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventSearchRepository extends ElasticsearchRepository<EventDocument, String> {
    
    List<EventDocument> findByNameContainingIgnoreCase(String name);
    
    List<EventDocument> findByType(String type);
    
    List<EventDocument> findByStatus(String status);
    
    List<EventDocument> findByAvailableSeatsGreaterThan(Integer minSeats);
}
