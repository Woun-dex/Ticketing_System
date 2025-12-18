package dev.woundex.auth_service.utils;

import dev.woundex.auth_service.Entities.User;
import dev.woundex.auth_service.Service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    
    private final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(null);
        ReflectionTestUtils.setField(jwtService, "SecretKey", TEST_SECRET);
    }

    @Test
    void shouldGenerateAndValidateToken() {
        User user = User.builder()
                .email("test@example.com")
                .username("testuser")
                .build();

        String token = jwtService.getJwtToken(user);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        
        String extractedEmail = jwtService.extractEmail(token);
        assertEquals("test@example.com", extractedEmail);
    }

    @Test
    void shouldGenerateShortLivedTokenWithCorrectClaims() {
        User user = User.builder()
                .email("vip@example.com")
                .username("vipuser")
                .build();
        String eventId = "event-123";

        String token = jwtService.generateShortLivedToken(user, eventId);

        assertNotNull(token);
        
        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(TEST_SECRET.getBytes()))
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        assertEquals("event-123", claims.get("eventId"));
        assertEquals("vip@example.com", claims.get("email"));
    }
}