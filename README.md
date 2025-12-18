# Ticketing System

A high-performance, distributed ticketing system built with microservices architecture, designed to handle 50,000-100,000 concurrent users.

## Architecture Overview


## Services

| Service | Port | Description |
|---------|------|-------------|
| eureka-server | 8761 | Service discovery |
| gateway | 8080 | API Gateway with JWT validation |
| auth-service | 8081 | Authentication & user management |
| admin-service | 8082 | Admin operations |
| booking-service | 8083 | Core booking logic with distributed locks |
| payment-service | 8084 | Payment processing |
| search-service | 8085 | Elasticsearch-powered search |
| ui-platform | 4200 | Angular frontend |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- JDK 17+ (for local development)
- Node.js 20+ (for UI development)

### Start All Services with Docker

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Access Points
- **Application**: http://localhost:4200
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger Tracing**: http://localhost:16686

## Infrastructure

### Databases
- **PostgreSQL 15**: Main data store (port 5433)
- **Elasticsearch 8.11**: Search engine (port 9200)

### Message Queue
- **Kafka**: 3-node cluster for event streaming
  - kafka-1: 9092
  - kafka-2: 9093
  - kafka-3: 9094

### Caching & Locking
- **Redis 7**: Distributed locking and caching (port 6379)

## Observability Stack

### Metrics (Prometheus)
All services expose metrics at `/actuator/prometheus`:
- JVM metrics (heap, GC, threads)
- HTTP request metrics (latency, error rate)
- Custom business metrics (lock failures, queue length)

### Distributed Tracing (Jaeger)
- Trace requests across all services
- Identify latency bottlenecks
- Debug distributed transactions

### Dashboards (Grafana)
Pre-configured dashboards for:
- System Overview
- Booking Service Metrics
- Infrastructure Health
- JVM Performance

## Load Testing

See [load-testing/README.md](./load-testing/README.md) for details.

```bash
# Install k6
choco install k6  # Windows
brew install k6   # macOS

# Run load test
cd load-testing
k6 run --vus 1000 --duration 5m booking-load-test.js
```

### Performance Targets
- **Concurrent Users**: 50,000 - 100,000
- **P99 Latency**: < 2 seconds
- **Error Rate**: < 5%

## Development

### Local Development

```bash
# Start infrastructure only
docker-compose up -d postgres redis kafka-1 kafka-2 kafka-3 elasticsearch

# Run individual services
cd booking-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Build All Services

```bash
./mvnw clean package -DskipTests
```

### Running Tests

```bash
./mvnw test
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| SPRING_PROFILES_ACTIVE | dev | Active profile (dev, docker) |
| DATABASE_URL | localhost:5433 | PostgreSQL connection |
| REDIS_HOST | localhost | Redis host |
| KAFKA_BOOTSTRAP_SERVERS | localhost:9092 | Kafka brokers |
| EUREKA_SERVER | localhost:8761 | Eureka server URL |

### Docker Profile
Services use `application-docker.properties` when running in Docker, which configures:
- Container hostnames (postgres, redis, kafka-1, etc.)
- Actuator endpoints for health checks
- Prometheus metrics endpoint
- OpenTelemetry tracing

## API Documentation

### Authentication
```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
# Returns: { "token": "eyJhbG..." }
```

### Booking
```bash
# Create reservation (locks seats)
POST /api/bookings/reserve
Authorization: Bearer <token>
{
  "eventId": "EVT001",
  "seats": [{"seatId": "A1"}, {"seatId": "A2"}]
}

# Confirm booking
POST /api/bookings/confirm
Authorization: Bearer <token>
{
  "reservationId": "RES123",
  "paymentMethod": "CREDIT_CARD"
}
```

## Chaos Engineering

See [load-testing/CHAOS_SCENARIOS.md](./load-testing/CHAOS_SCENARIOS.md) for:
- Redis failure & recovery testing
- Kafka consumer lag simulation
- Database deadlock scenarios
- Network partition testing

## Project Structure

```
ticketing_System/
├── admin-service/          # Admin operations
├── auth-service/           # Authentication
├── booking-service/        # Core booking logic
├── config-server/          # Centralized configuration
├── core/                   # Shared libraries
├── eureka_server/          # Service discovery
├── gateway/                # API Gateway
├── load-testing/           # k6 load tests & chaos scenarios
├── migration/              # Database migrations
├── observability/          # Prometheus & Grafana configs
├── payment-service/        # Payment processing
├── search-service/         # Elasticsearch search
├── ui-platform/            # Angular frontend
└── docker-compose.yml      # Docker orchestration
```

