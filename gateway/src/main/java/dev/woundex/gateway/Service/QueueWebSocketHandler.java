package dev.woundex.gateway.Service;

import org.springframework.beans.factory.annotation.Autowired;
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
public class QueueWebSocketHandler implements WebSocketHandler {

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // Extract query parameters from the URI
        Map<String, String> queryParams = UriComponentsBuilder
                .fromUri(session.getHandshakeInfo().getUri())
                .build()
                .getQueryParams()
                .toSingleValueMap();

        String userId = queryParams.get("userId");
        String eventId = queryParams.get("eventId");

        if (userId == null || eventId == null) {
            return session.send(Mono.just(session.textMessage("{\"error\": \"Missing userId or eventId\"}")))
                    .then(session.close());
        }

        // Add user to the waiting queue in Redis
        String queueKey = "queue:waiting:" + eventId;
        double score = System.currentTimeMillis();

        return redisTemplate.opsForZSet().add(queueKey, userId, score)
                .then(Mono.defer(() -> {
                    Flux<String> queuePositionFlux = Flux.interval(Duration.ZERO, Duration.ofSeconds(3))
                            .flatMap(i -> redisTemplate.opsForZSet().rank(queueKey, userId))
                            .map(rank -> {
                                long position = (rank != null) ? rank + 1 : 0;
                                return "{\"position\": " + position + ", \"userId\": \"" + userId + "\"}";
                            })
                            .onErrorResume(e -> Flux.just("{\"error\": \"" + e.getMessage() + "\"}"));

                    return session.send(queuePositionFlux.map(session::textMessage));
                }));
    }
}

