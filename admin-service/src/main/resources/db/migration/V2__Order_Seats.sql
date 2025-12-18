-- Create order_seats table to track which seats belong to each order
CREATE TABLE IF NOT EXISTS order_seats (
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL,
    PRIMARY KEY (order_id, seat_id)
);

