package dev.woundex.gateway.Tests;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import dev.woundex.gateway.Service.QueuePromoter;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;

@SpringBootTest
@Testcontainers // Spins up Docker
class QueueIntegrationTest {

    // 1. Define the Redis Container
    @Container
    public static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:alpine"))
            .withExposedPorts(6379);

    // 2. Tell Spring Boot to use the Docker Redis port, not localhost:6379
    @DynamicPropertySource
    static void redisProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @Autowired
    private QueuePromoter queuePromoter; // The class with @Scheduled

    @BeforeEach
    void clearRedis() {
        redisTemplate.getConnectionFactory().getReactiveConnection().serverCommands().flushAll().subscribe();
    }

    @Test
    void testQueueAdmissionAndPromotion() {
        String eventId = "event123";
        String waitingKey = "queue:waiting:" + eventId;
        String activeKey = "queue:active:" + eventId;

        // 1. Simulate 5 users joining the queue (ZADD)
        // User 1 arrived first (Score 100), User 5 arrived last (Score 500)
        redisTemplate.opsForZSet().add(waitingKey, "user1", 100).block();
        redisTemplate.opsForZSet().add(waitingKey, "user2", 200).block();
        redisTemplate.opsForZSet().add(waitingKey, "user3", 300).block();
        
        // Verify they are in the waiting room
        StepVerifier.create(redisTemplate.opsForZSet().count(waitingKey, Double.MIN_VALUE, Double.MAX_VALUE))
                .expectNext(3L)
                .verifyComplete();

        // 2. TRIGGER THE PROMOTER MANUALLY (Don't wait for @Scheduled)
        // In this test, we assume promoteUsers() handles logic to move, say, 2 users.
        queuePromoter.promoteUsers(); 

        // Give it a tiny moment to process (since it's async/reactive)
        try { Thread.sleep(500); } catch (InterruptedException e) {}

        // 3. ASSERTIONS (The Moment of Truth)
        
        // Expectation: user1 and user2 (oldest) should be in ACTIVE key
        StepVerifier.create(redisTemplate.opsForSet().isMember(activeKey, "user1"))
                .expectNext(true)
                .verifyComplete();
                
        StepVerifier.create(redisTemplate.opsForSet().isMember(activeKey, "user2"))
                .expectNext(true)
                .verifyComplete();

        // Expectation: user3 should STILL be in WAITING key (not promoted yet)
        StepVerifier.create(redisTemplate.opsForZSet().count(waitingKey, Double.MIN_VALUE, Double.MAX_VALUE))
                .expectNext(1L)
                .verifyComplete();
    }
}