---
id: ENT-SESSION
type: entity
title: "Session"
version: 1.0.0
status: approved
relations:
  depends_on: [ENT-USER]
fields:
  - { name: id, type: uuid, required: true, pk: true }
  - { name: user_id, type: uuid, required: true }
  - { name: token_hash, type: string, required: true, unique: true }
  - { name: expires_at, type: timestamp, required: true }
  - { name: revoked, type: boolean, required: true, default: false }
invariants:
  - "token_hash là duy nhất toàn hệ thống"
  - "expires_at phải trong tương lai khi tạo"
  - "revoked=true không thể chuyển về false"
---

# ENT-SESSION — Session entity

Quản lý session token cho authentication flow.
