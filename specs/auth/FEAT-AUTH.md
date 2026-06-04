---
id: FEAT-AUTH
type: feature
title: "Xác thực người dùng"
version: 1.0.0
status: approved
owner: team-identity
created: "2026-05-01"
updated: "2026-06-04"
tags: [auth]
relations:
  depends_on: [ENT-USER]
---

# FEAT-AUTH — Xác thực người dùng

## Mục tiêu nghiệp vụ

Cho phép người dùng đăng ký, đăng nhập, đăng xuất an toàn. Là cổng vào mọi chức năng cần xác thực downstream.

## Ngữ cảnh

Phase 1 chỉ hỗ trợ email + mật khẩu. OAuth/SSO/MFA hoãn phase sau.

## Ràng buộc

- Mật khẩu lưu dưới dạng argon2id hash, không bao giờ plaintext.
- Session token là JWT có thời hạn.
- Sau 5 lần đăng nhập sai liên tiếp → khóa tài khoản tạm thời (xem REQ-AUTH-001).
