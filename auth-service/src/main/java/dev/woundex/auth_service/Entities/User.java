package dev.woundex.auth_service.Entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
@Getter @Setter
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String username;
    private String password;

    @Column(unique = true)
    private String email;

    @CreatedDate
    private LocalDateTime created_at;
    @LastModifiedDate
    private LocalDateTime updated_at;

    @PrePersist
    public void prePersist() {
        if (this.created_at == null) {
            this.created_at = LocalDateTime.now();
        }
        this.updated_at = this.created_at;
    }

    @PreUpdate
    public void preUpdate() {
        this.updated_at = LocalDateTime.now();
    }

}
