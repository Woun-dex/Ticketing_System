package dev.woundex.auth_service.util;

import dev.woundex.auth_service.Entities.User;
import dev.woundex.auth_service.Service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private JwtService jwtService;

    private final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();

        ReflectionTestUtils.setField(jwtService, "SecretKey", TEST_SECRET);
    }

    @Test
    void shouldGenerateAndValidateToken() {
        User user = User.builder()
                .email("test@example.com")
                .password("test")
                .username("test")
                .build();

        String token = jwtService.getJwtToken(user);

        assertNotNull(token);
        assertEquals("test@example.com", jwtService.extractEmail(token));

    }

    @Test
    void shouldGenerateShortLivedToken() {
        User user = User.builder()
                .email("vip@example.com")
                .password("test")
                .username("testt")
                .build();
        String eventId = "event-123";

        String token = jwtService.generateShortLivedToken(user , eventId);

        assertNotNull(token);
        assertEquals("vip@example.com", jwtService.extractEmail(token));
    }
}
