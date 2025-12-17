package dev.woundex.booking_service.config;


import org.redisson.Redisson;
import org.redisson.config.Config;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RedissonConfig {
    
    public Redisson redisson() {
        Config config = new Config();
        config.useSingleServer().setAddress("redis://localhost:6379");
        return (Redisson) Redisson.create(config);
    }
}