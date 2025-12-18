package dev.woundex.gateway.Config;

import dev.woundex.gateway.Service.QueueWebSocketHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.HandshakeWebSocketService;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;
import org.springframework.web.reactive.socket.server.upgrade.ReactorNettyRequestUpgradeStrategy;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class WebSocketConfig {

    @Bean
    public SimpleUrlHandlerMapping webSocketHandlerMapping(QueueWebSocketHandler queueHandler) {
        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put("/ws/queue", queueHandler);

        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setUrlMap(map);
        // Use highest precedence to ensure WebSocket handler is matched before Gateway routes
        mapping.setOrder(Ordered.HIGHEST_PRECEDENCE);
        
        // Configure CORS for WebSocket
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowedOrigins(List.of("http://localhost:4200"));
        corsConfig.setAllowedMethods(List.of("GET", "POST"));
        corsConfig.setAllowedHeaders(List.of("*"));
        corsConfig.setAllowCredentials(true);
        
        Map<String, CorsConfiguration> corsConfigMap = new HashMap<>();
        corsConfigMap.put("/ws/**", corsConfig);
        mapping.setCorsConfigurations(corsConfigMap);
        
        return mapping;
    }

    @Bean
    public WebSocketHandlerAdapter webSocketHandlerAdapter() {
        return new WebSocketHandlerAdapter(queueWebSocketService());
    }

    @Bean
    public HandshakeWebSocketService queueWebSocketService() {
        return new HandshakeWebSocketService(new ReactorNettyRequestUpgradeStrategy());
    }
}
