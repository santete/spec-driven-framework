---
id: ENT-ORDER
type: entity
title: "Order"
version: 1.0.0
status: approved
fields:
  - { name: id, type: uuid, required: true, pk: true }
  - { name: user_id, type: uuid, required: true }
  - { name: total, type: integer, required: true }
  - { name: status, type: enum, values: [pending, paid, shipped, delivered], required: true }
invariants:
  - "total >= 0"
  - "status chỉ chuyển tiến, không lùi"
---
# ENT-ORDER
