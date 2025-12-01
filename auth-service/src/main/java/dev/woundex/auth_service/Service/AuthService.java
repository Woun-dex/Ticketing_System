package dev.woundex.auth_service.Service;

import dev.woundex.auth_service.Entities.User;
import dev.woundex.auth_service.Repository.UserRepository;
import dev.woundex.auth_service.dto.AuthResponse;
import dev.woundex.auth_service.dto.LoginRequest;
import dev.woundex.auth_service.dto.RegisterRequest;
import dev.woundex.auth_service.dto.UserResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repo;
    private final JwtService jwtService;
    private final RedisTemplate<String , String> redisTemplate;

    Argon2PasswordEncoder encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

    public AuthResponse register(RegisterRequest request){

        if ( repo.existsByEmail(request.getEmail()) ){
            throw new RuntimeException("Email already exists!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(encoder.encode(request.getPassword()))
                .build();

        repo.save(user);

        String token = jwtService.getJwtToken(user);
        return new AuthResponse(token);
    }

    public AuthResponse login(LoginRequest request){
        User user = repo.findByEmail(request.getEmail()).orElseThrow(()->new RuntimeException("Invalid Credentials!"));

        if (!encoder.matches(request.getPassword(), user.getPassword())){
            throw new RuntimeException("Invalid Credentials!");
        }

        String token = jwtService.getJwtToken(user);
        return new AuthResponse(token);
    }

 public AuthResponse generateQueueToken(String token , String eventId){

        String userEmail = jwtService.extractEmail(token);
        User user = repo.findByEmail(userEmail).orElseThrow(()->new RuntimeException("Invalid Credentials!"));

        String activeQueueKey = "queue:active:" + eventId;

        Boolean isPromoted = redisTemplate.opsForSet().isMember(activeQueueKey, user.getId().toString());

        if ( Boolean.FALSE.equals(isPromoted)){
            throw new RuntimeException("Access Denied! : You are not in the active queue!");
        }

        String shortJwt = jwtService.generateShortLivedToken(user , eventId);
        return new AuthResponse(shortJwt);
    }

}
