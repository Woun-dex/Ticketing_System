package dev.woundex.search_service.repository;

import dev.woundex.search_service.document.SeatDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatSearchRepository extends ElasticsearchRepository<SeatDocument, String> {
    
    List<SeatDocument> findByEventId(Long eventId);
    
    List<SeatDocument> findByEventIdAndStatus(Long eventId, String status);
    
    long countByEventIdAndStatus(Long eventId, String status);
}
