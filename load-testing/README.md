# Load Testing & Observability

This directory contains load testing scripts and chaos engineering scenarios for the ticketing system.

## Prerequisites

### 1. Install k6
```bash
# Windows (with Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 2. Start the System
```bash
# From project root
docker-compose up -d
```

### 3. Verify Services
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686
- API Gateway: http://localhost:8080

## Load Testing Scripts

### Setup Test Users (Required First Time)

Before running load tests, create test user accounts:

```bash
k6 run setup-test-users.js
```

This creates 100 test users (`testuser1@loadtest.com` - `testuser100@loadtest.com`) with password `LoadTest123!`

### 0. Simple Load Test (Recommended Start)

Validate the system with a small-scale test:

```bash
k6 run simple-load-test.js
```

- Ramps to 50 concurrent users
- Tests authentication, search, and booking
- Duration: ~3 minutes

### 1. Standard Load Test
Simulates normal to high traffic (up to 100k concurrent users).

```bash
# Quick test (10 VUs for 1 minute)
k6 run --vus 10 --duration 1m booking-load-test.js

# Standard test (1000 VUs for 5 minutes)
k6 run --vus 1000 --duration 5m booking-load-test.js

# Full test (follows ramping pattern)
k6 run booking-load-test.js

# Custom environment
k6 run --env BASE_URL=http://your-gateway:8080 booking-load-test.js
```

### 2. Spike Test
Simulates flash sale or ticket release scenario with sudden traffic spikes.

```bash
k6 run spike-test.js
```

### 3. Stress Test
Finds the breaking point of the system.

```bash
k6 run stress-test.js
```

## Test Results Output

k6 generates detailed output including:
- **http_req_duration**: Response time percentiles (p50, p95, p99)
- **http_req_failed**: Error rate
- **iterations**: Total requests completed
- **vus**: Virtual users over time

### Export Results
```bash
# JSON output
k6 run --out json=results.json booking-load-test.js

# InfluxDB (for Grafana visualization)
k6 run --out influxdb=http://localhost:8086/k6 booking-load-test.js
```

## Grafana Dashboards

Access Grafana at http://localhost:3000

### Pre-configured Dashboards
1. **Ticketing System Overview** - Main dashboard with all key metrics
2. **Booking Service Metrics** - Lock failures, queue length, TTL expirations
3. **Infrastructure** - Redis, Kafka, PostgreSQL metrics

### Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `booking_lock_failures_total` | Lock acquisition failures | > 10/min |
| `booking_queue_length` | Current queue size | > 1000 |
| `booking_reservation_expirations_total` | TTL expirations | > 50/min |
| `http_server_requests_seconds` | Request latency | P99 > 2s |
| `kafka_consumer_group_lag` | Consumer lag | > 10000 |

## Chaos Engineering

See [CHAOS_SCENARIOS.md](./CHAOS_SCENARIOS.md) for detailed chaos testing procedures:

1. **Redis Failure** - Test lock system resilience
2. **Kafka Consumer Lag** - Test message queue handling
3. **Database Deadlocks** - Test transaction handling
4. **Network Partition** - Test service discovery and failover
5. **Memory Pressure** - Test JVM under resource constraints

### Quick Chaos Test

```bash
# Stop Redis and observe
docker stop ticketing-redis
# Watch Grafana for 30 seconds
docker start ticketing-redis

# Introduce network latency
docker exec ticketing-booking-service tc qdisc add dev eth0 root netem delay 500ms
# Reset after testing
docker exec ticketing-booking-service tc qdisc del dev eth0 root
```

## Performance Targets

### Milestone 6 Requirements
- **Concurrent Users**: 50,000 - 100,000
- **P99 Latency**: < 2 seconds for booking operations
- **Error Rate**: < 5% under peak load
- **Recovery Time**: < 30 seconds after failure

### Current Benchmarks

| Scenario | VUs | P99 Latency | Error Rate | Notes |
|----------|-----|-------------|------------|-------|
| Normal | 1,000 | TBD | TBD | Baseline |
| High | 10,000 | TBD | TBD | - |
| Peak | 50,000 | TBD | TBD | Target |
| Extreme | 100,000 | TBD | TBD | Stretch goal |

Run tests and update benchmarks with actual results.

## Troubleshooting

### Common Issues

**High Error Rate**
- Check service logs: `docker logs ticketing-booking-service`
- Verify database connections: `docker exec ticketing-postgres pg_isready`
- Check Redis: `docker exec ticketing-redis redis-cli ping`

**High Latency**
- Check JVM heap: Grafana JVM dashboard
- Check database queries: Enable slow query log
- Check Kafka lag: `kafka-consumer-groups.sh --describe`

**k6 Resource Issues**
- Increase open file limit: `ulimit -n 100000`
- Use distributed testing for very high loads
