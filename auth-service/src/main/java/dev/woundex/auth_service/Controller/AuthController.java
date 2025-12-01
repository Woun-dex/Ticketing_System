package dev.woundex.auth_service.Controller;

import dev.woundex.auth_service.Service.AuthService;
import dev.woundex.auth_service.dto.AuthResponse;
import dev.woundex.auth_service.dto.LoginRequest;
import dev.woundex.auth_service.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request){
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request){
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/queue-token")
    public ResponseEntity<AuthResponse> getQueueToken(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String eventId
    ){
        String token = authHeader.substring(7);
        return ResponseEntity.ok(authService.generateQueueToken(token , eventId));
    }


}
