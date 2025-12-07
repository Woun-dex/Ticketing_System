package dev.woundex.admin_service.Config;


import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {


    @Bean
    public NewTopic eventsTopic() {
        return TopicBuilder.name("events.lifecycle")
                .partitions(3) // Allows concurrency in consumers
                .replicas(1)
                .build();
    }

}
