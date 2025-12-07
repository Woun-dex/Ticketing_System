package dev.woundex.gateway.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Date;

public abstract class QueueFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;


    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath();

        if (path.startsWith("/api/v1/auth") ) {
            return chain.filter(exchange);
        }



        String token = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (isValidShortJwt(token)) {
            return chain.filter(exchange);
        }

        exchange.getResponse().setStatusCode(HttpStatus.TEMPORARY_REDIRECT);
        exchange.getResponse().getHeaders().add("Location", "/queue/waiting-room");

        return exchange.getResponse().setComplete();
    }

    protected boolean isValidShortJwt(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }

        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Date expiration = claims.getExpiration();
            if (expiration != null && expiration.before(new Date())) {
                return false;
            }

            String eventId = claims.get("eventId", String.class);
            return eventId != null && !eventId.isEmpty();

        } catch (Exception e) {
            return false;
        }
    }
}


