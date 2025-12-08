package dev.woundex.auth_service.Controller;


import org.springframework.boot.autoconfigure.security.oauth2.resource.OAuth2ResourceServerProperties.Jwt;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import dev.woundex.auth_service.Service.JwtService;
import dev.woundex.auth_service.dto.UserResponse;
import lombok.RequiredArgsConstructor;

@FeignClient(name = "auth-service" , url = "http://localhost:8081" , path = "/api/users" )
@RequiredArgsConstructor
public class AuthClient {

    private final JwtService jwtService;


    @PostMapping("/validate")
    public UserResponse validateToken(@RequestBody String token){
    return jwtService.validateShortJwt(token);
    }

    
}
