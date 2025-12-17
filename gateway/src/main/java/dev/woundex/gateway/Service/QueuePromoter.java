package dev.woundex.gateway.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@Slf4j
public class QueuePromoter {

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    private static final int ALLOWED_PER_SECOND = 50;

    @Scheduled(fixedRate = 1000)
    public void promoteUsers() {
        // Find all waiting queue keys and promote users from each
        redisTemplate.keys("queue:waiting:*")
                .flatMap(waitingKey -> {
                    String eventId = waitingKey.replace("queue:waiting:", "");
                    String activeKey = "queue:active:" + eventId;
                    
                    return redisTemplate.opsForZSet()
                            .popMin(waitingKey, ALLOWED_PER_SECOND)
                            .flatMap(user -> {
                                log.debug("Promoting user {} to active queue for event {}", user.getValue(), eventId);
                                // Use Set (not ZSet) to match auth-service's isMember check
                                return redisTemplate.opsForSet().add(activeKey, user.getValue());
                            });
                })
                .subscribe();
    }
}
