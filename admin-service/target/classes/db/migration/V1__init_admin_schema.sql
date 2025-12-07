CREATE TABLE events (
                        id BIGSERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        type VARCHAR(255) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        start_time TIMESTAMP NOT NULL,
                        end_time TIMESTAMP NOT NULL
);

CREATE TABLE seat_types (
                            id BIGSERIAL PRIMARY KEY,
                            event_id BIGINT REFERENCES events(id),
                            name VARCHAR(255) NOT NULL,
                            price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE seats (
                       id BIGSERIAL PRIMARY KEY,
                       event_id BIGINT REFERENCES events(id),
                       seat_type_id BIGINT REFERENCES seat_types(id),
                       row_number VARCHAR(10) NOT NULL,
                       seat_number VARCHAR(10) NOT NULL,
                       status VARCHAR(50) NOT NULL
);

CREATE INDEX idx_seats_event_id ON seats(event_id);