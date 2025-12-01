CREATE TABLE users(
    id UUID PRIMARY KEY ,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL ,
    username VARCHAR(255) NOT NULL ,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
