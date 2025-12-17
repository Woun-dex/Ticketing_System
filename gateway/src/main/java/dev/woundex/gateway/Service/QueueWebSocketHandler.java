package dev.woundex.gateway.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class QueueWebSocketHandler implements WebSocketHandler {

    private final ReactiveRedisTemplate<String, String> redisTemplate;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        log.info("WebSocket connection received: {}", session.getHandshakeInfo().getUri());
        
        // Extract query parameters from the URI
        Map<String, String> queryParams = UriComponentsBuilder
                .fromUri(session.getHandshakeInfo().getUri())
                .build()
                .getQueryParams()
                .toSingleValueMap();

        String userId = queryParams.get("userId");
        String eventId = queryParams.get("eventId");

        log.info("WebSocket params - userId: {}, eventId: {}", userId, eventId);

        if (userId == null || eventId == null) {
            log.warn("Missing userId or eventId in WebSocket connection");
            return session.send(Mono.just(session.textMessage("{\"error\": \"Missing userId or eventId\"}")))
                    .then(session.close());
        }

        // Add user to the waiting queue in Redis
        String queueKey = "queue:waiting:" + eventId;
        double score = System.currentTimeMillis();

        return redisTemplate.opsForZSet().add(queueKey, userId, score)
                .doOnSuccess(added -> log.info("User {} added to queue {} with score {}", userId, queueKey, score))
                .doOnError(e -> log.error("Error adding user to queue", e))
                .then(Mono.defer(() -> {
                    String activeKey = "queue:active:" + eventId;
                    
                    Flux<String> queueStatusFlux = Flux.interval(Duration.ZERO, Duration.ofSeconds(2))
                            .flatMap(i -> 
                                // First check if user is in active queue (promoted)
                                redisTemplate.opsForSet().isMember(activeKey, userId)
                                    .flatMap(isActive -> {
                                        if (Boolean.TRUE.equals(isActive)) {
                                            log.info("User {} has been promoted to active queue", userId);
                                            return Mono.just("{\"status\": \"PROMOTED\", \"userId\": \"" + userId + "\"}");
                                        }
                                        // Check waiting queue position
                                        return redisTemplate.opsForZSet().rank(queueKey, userId)
                                            .map(rank -> {
                                                long position = (rank != null) ? rank + 1 : 0;
                                                // Position 0 means user was removed from waiting (promoted)
                                                if (position == 0) {
                                                    return "{\"status\": \"PROMOTED\", \"userId\": \"" + userId + "\"}";
                                                }
                                                log.debug("User {} position in queue: {}", userId, position);
                                                return "{\"position\": " + position + ", \"userId\": \"" + userId + "\"}";
                                            })
                                            .defaultIfEmpty("{\"status\": \"PROMOTED\", \"userId\": \"" + userId + "\"}");
                                    })
                            )
                            .onErrorResume(e -> {
                                log.error("Error getting queue status", e);
                                return Flux.just("{\"error\": \"" + e.getMessage() + "\"}");
                            });

                    return session.send(queueStatusFlux.map(session::textMessage));
                }));
    }
}
