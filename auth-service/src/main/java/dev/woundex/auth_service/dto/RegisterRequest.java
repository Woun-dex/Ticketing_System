package dev.woundex.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "username is required")
    private String username;
    @NotBlank(message ="email is required")
    private String email;
    @NotBlank(message ="password is required")
    @Size(min = 8)
    private String password;
}
