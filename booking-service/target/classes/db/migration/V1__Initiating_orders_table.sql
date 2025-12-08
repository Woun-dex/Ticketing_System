CREATE TABLE orders (
                        id UUID PRIMARY KEY,
                        user_id UUID REFERENCES users(id),
                        event_id BIGINT REFERENCES events(id),
                        totalAmount int NOT NULL ,
                        status order_status NOT NULL DEFAULT 'PENDING',
                        created_at timestamptz DEFAULT now()
);