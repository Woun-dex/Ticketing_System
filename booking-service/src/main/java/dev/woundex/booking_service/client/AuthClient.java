package dev.woundex.booking_service.client;

import dev.woundex.booking_service.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "auth-service", path = "/api/v1/auth")
public interface AuthClient {

    @PostMapping("/validate")
    UserResponse validateToken(@RequestBody String token);
}
