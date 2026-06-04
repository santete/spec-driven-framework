---
id: ENT-USER
type: entity
title: "User"
version: 2.0.0
status: approved
owner: team-identity
created: "2026-05-01"
updated: "2026-06-04"
tags: [auth, identity]
fields:
  - { name: id, type: uuid, required: true, pk: true }
  - { name: email, type: string, required: true, unique: true, format: email }
  - { name: status, type: enum, values: [active, suspended], required: true }
  - { name: password_hash, type: string, required: true }
  - { name: failed_login_count, type: integer, required: true, default: 0 }
  - { name: locked_until, type: timestamp, required: false }
invariants:
  - "email là duy nhất toàn hệ thống"
  - "status không thể chuyển từ suspended sang active nếu thiếu admin approval"
  - "failed_login_count reset về 0 sau login thành công"
---

# ENT-USER — Domain entity User

Người dùng cuối hệ thống. Là gốc cho mọi spec auth/billing/order.

## Trường

- `id` — UUID, primary key, bất biến.
- `email` — duy nhất, định dạng email RFC 5322.
- `status` — `active` (mặc định) hoặc `suspended` (do admin hoặc auto-lock).
- `password_hash` — argon2id, không lưu plaintext.
- `failed_login_count` — đếm lần đăng nhập sai liên tiếp; reset khi login thành công.
- `locked_until` — timestamp tạm khóa (do AC-AUTH-001-02 trigger).

## Invariant

Xem frontmatter `invariants`. Pipeline sẽ sinh JSON Schema / Zod / Drizzle schema cùng nguồn.
