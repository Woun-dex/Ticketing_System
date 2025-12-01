package dev.woundex.gateway.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@Component
public class QueueWebSocketHandler implements WebSocketHandler {

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        Object userIdObj = session.getAttributes().get("userId");
        Object eventIdObj = session.getAttributes().get("eventId");
        
        if (userIdObj == null || eventIdObj == null) {
            return session.close();
        }
        
        String userId = userIdObj.toString();
        String eventId = eventIdObj.toString();

        Flux<String> queuePositionFlux = Flux.interval(Duration.ofSeconds(5))
                .flatMap(i -> redisTemplate.opsForZSet().rank(
                        "queue:waiting:" + eventId, userId)
                )
                .map(rank -> {
                    long position = (rank != null) ? rank + 1 : 0;
                    return "{\"position\": " + position + "}";
                });

        return session.send(queuePositionFlux.map(session::textMessage));
    }

    @Scheduled(fixedRate = 1000)
    public void promoteUsers() {
        String eventId = "event123";
        String waitingKey = "queue:waiting:" + eventId;
        String activeKey = "queue:active:" + eventId;
        int ALLOWED_PER_SECOND = 50;

        redisTemplate.opsForZSet()
                .popMin(waitingKey, ALLOWED_PER_SECOND)
                .flatMap(user -> {
                    double score = Instant.now().toEpochMilli();
                    return redisTemplate.opsForZSet().add(activeKey, user.getValue(), score);
                })
                .subscribe();
    }
}

