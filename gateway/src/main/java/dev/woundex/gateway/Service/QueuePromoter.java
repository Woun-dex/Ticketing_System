package dev.woundex.gateway.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class QueuePromoter {

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;


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
