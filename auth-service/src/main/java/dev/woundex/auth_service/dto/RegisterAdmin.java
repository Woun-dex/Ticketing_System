package dev.woundex.auth_service.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterAdmin {

    private String email;
    private String username;
    private String password;
    private String adminSecret;

}
