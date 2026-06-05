---
id: REQ-HEALTH-001
type: requirement
title: "GET /health trả về trạng thái hệ thống"
version: 1.0.0
status: approved
priority: must
relations:
  refines: [FEAT-HEALTH]
acceptance_criteria:
  - id: AC-HEALTH-001-01
    given: "service đang chạy bình thường"
    when: "GET /health"
    then: "trả về { status: 'ok', uptime_ms: number, version: string }, HTTP 200"
  - id: AC-HEALTH-001-02
    given: "database không kết nối được"
    when: "GET /health"
    then: "trả về { status: 'degraded', error: string }, HTTP 503"
---

# REQ-HEALTH-001 — Health Check Endpoint

Cung cấp endpoint đơn giản cho load balancer và monitoring.
Kiểm tra kết nối DB, trả về uptime và version.
