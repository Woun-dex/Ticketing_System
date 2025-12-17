package dev.woundex.auth_service.Controller;


import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import dev.woundex.auth_service.dto.UserResponse;

@FeignClient(name = "auth-service", path = "/api/v1/auth")
public interface AuthClient {

    @PostMapping("/validate")
    UserResponse validateToken(@RequestBody String token);

    
}
