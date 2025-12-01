package dev.woundex.auth_service.Service;

import dev.woundex.auth_service.Entities.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String SecretKey;

    public String getJwtToken(User user ){
        return Jwts.builder()
                .claim("email" , user.getEmail())
                .claim("role", user.getRole())
                .subject(user.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) 
                .signWith(Keys.hmacShaKeyFor(SecretKey.getBytes()))
                .compact();
    }

    public String generateShortLivedToken(User user , String eventId){
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("eventId", eventId);

        return Jwts.builder()
                .claims(claims)
                .subject(user.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 5)) // 5min
                .signWith(Keys.hmacShaKeyFor(SecretKey.getBytes()))
                .compact();
    }

    public String extractEmail (String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(SecretKey.getBytes()))
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("email", String.class);
    }
}
