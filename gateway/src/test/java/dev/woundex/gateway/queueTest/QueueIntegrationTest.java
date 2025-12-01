package dev.woundex.gateway.queueTest;

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
import reactor.test.StepVerifier;

@SpringBootTest
@Testcontainers
public class QueueIntegrationTest {

    @Container
    public static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:6"))
            .withExposedPorts(6379);


    @DynamicPropertySource
    static void redisProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @BeforeEach
    public void clearRedis() {
        redisTemplate.getConnectionFactory().getReactiveConnection().serverCommands().flushAll().subscribe();
    }

    @Test
    void testQueue() {
        String eventId = "event123";
        String waitingKey = "queue:waiting:" + eventId;
        String activeKey = "queue:active:" + eventId;

        // Add users to waiting and active queues
        redisTemplate.opsForZSet().add(waitingKey, "user1", 100).block();
        redisTemplate.opsForZSet().add(activeKey, "user2", 200).block();
        redisTemplate.opsForZSet().add(waitingKey, "user3", 300).block();

        // Verify user1 is in waiting queue
        StepVerifier.create(redisTemplate.opsForZSet().score(waitingKey, "user1"))
                .expectNextMatches(score -> score != null && score == 100.0)
                .verifyComplete();

        // Verify user2 is in active queue
        StepVerifier.create(redisTemplate.opsForZSet().score(activeKey, "user2"))
                .expectNextMatches(score -> score != null && score == 200.0)
                .verifyComplete();

        // Verify waiting queue has 2 users (user1 and user3)
        StepVerifier.create(redisTemplate.opsForZSet().size(waitingKey))
                .expectNext(2L)
                .verifyComplete();
    }
}
