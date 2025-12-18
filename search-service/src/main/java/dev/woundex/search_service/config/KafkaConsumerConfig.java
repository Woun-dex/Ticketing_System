package dev.woundex.search_service.config;

import dev.woundex.search_service.dto.EventLifecycleMessage;
import dev.woundex.search_service.dto.SeatIndexMessage;
import dev.woundex.search_service.dto.TicketReservedEvent;
import dev.woundex.search_service.dto.TicketSoldEvent;
import dev.woundex.search_service.dto.TicketCancelledEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    private Map<String, Object> baseConsumerConfigs() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return props;
    }

    // Consumer factory for EventLifecycleMessage
    @Bean
    public ConsumerFactory<String, EventLifecycleMessage> eventLifecycleConsumerFactory() {
        Map<String, Object> props = baseConsumerConfigs();
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "search-service-lifecycle-group");
        
        JsonDeserializer<EventLifecycleMessage> deserializer = new JsonDeserializer<>(EventLifecycleMessage.class);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);
        
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, EventLifecycleMessage> eventLifecycleKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, EventLifecycleMessage> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(eventLifecycleConsumerFactory());
        return factory;
    }

    // Consumer factory for SeatIndexMessage
    @Bean
    public ConsumerFactory<String, SeatIndexMessage> seatIndexConsumerFactory() {
        Map<String, Object> props = baseConsumerConfigs();
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "search-service-seats-group");
        
        JsonDeserializer<SeatIndexMessage> deserializer = new JsonDeserializer<>(SeatIndexMessage.class);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);
        
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, SeatIndexMessage> seatIndexKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, SeatIndexMessage> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(seatIndexConsumerFactory());
        return factory;
    }

    // Consumer factory for TicketReservedEvent
    @Bean
    public ConsumerFactory<String, TicketReservedEvent> ticketReservedConsumerFactory() {
        Map<String, Object> props = baseConsumerConfigs();
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "search-service-group");
        
        JsonDeserializer<TicketReservedEvent> deserializer = new JsonDeserializer<>(TicketReservedEvent.class);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);
        
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TicketReservedEvent> ticketReservedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, TicketReservedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(ticketReservedConsumerFactory());
        return factory;
    }

    // Consumer factory for TicketSoldEvent
    @Bean
    public ConsumerFactory<String, TicketSoldEvent> ticketSoldConsumerFactory() {
        Map<String, Object> props = baseConsumerConfigs();
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "search-service-group");
        
        JsonDeserializer<TicketSoldEvent> deserializer = new JsonDeserializer<>(TicketSoldEvent.class);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);
        
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TicketSoldEvent> ticketSoldKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, TicketSoldEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(ticketSoldConsumerFactory());
        return factory;
    }

    // Consumer factory for TicketCancelledEvent
    @Bean
    public ConsumerFactory<String, TicketCancelledEvent> ticketCancelledConsumerFactory() {
        Map<String, Object> props = baseConsumerConfigs();
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "search-service-group");
        
        JsonDeserializer<TicketCancelledEvent> deserializer = new JsonDeserializer<>(TicketCancelledEvent.class);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);
        
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TicketCancelledEvent> ticketCancelledKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, TicketCancelledEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(ticketCancelledConsumerFactory());
        return factory;
    }
}
