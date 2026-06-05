# BRD: Payment Refund Flow

## Business Context
Hệ thống cần cho phép khách hàng yêu cầu hoàn tiền cho đơn hàng đã giao.
Hiện tại quy trình refund hoàn toàn thủ công qua email, mất 7-10 ngày.
Mục tiêu: tự động hóa, giảm xuống 2 ngày.

## Stakeholders
- Product Owner: Nguyen Van A
- Engineering Lead: Tran Thi B

## Functional Requirements

### FR-1: Yêu cầu hoàn tiền (must)
Khách hàng có thể tạo yêu cầu hoàn tiền từ trang chi tiết đơn hàng.
Điều kiện: đơn hàng đã giao (status=delivered), trong vòng 30 ngày.
Khi tạo, khách phải nhập lý do refund.
Hệ thống tạo RefundRequest với status=pending.

### FR-2: Kiểm tra tính hợp lệ (must)
Hệ thống tự động kiểm tra:
- Đơn hàng phải có status=delivered
- Ngày giao hàng cách hiện tại không quá 30 ngày
- Đơn hàng chưa bị refund trước đó
Nếu không hợp lệ, trả về lỗi cụ thể cho khách.

### FR-3: Admin duyệt/từ chối (must)
Admin có thể xem danh sách refund requests (pending).
Admin approve hoặc reject, phải nhập ghi chú.
Khi approve, hệ thống tự động trigger hoàn tiền về phương thức thanh toán gốc.

### FR-4: Thông báo kết quả (should)
Sau khi admin quyết định, gửi email thông báo cho khách.
Nội dung email khác nhau tùy approve/reject.

## Data Model

### RefundRequest
- id: UUID, primary key
- order_id: UUID, references Order
- customer_id: UUID, references User
- amount: integer (cents)
- reason: text
- status: pending | approved | rejected
- admin_note: text (nullable)
- created_at: timestamp
- resolved_at: timestamp (nullable)

### Business Rules
- amount phải bằng hoặc nhỏ hơn order.total
- Mỗi order chỉ được refund 1 lần
- Admin không thể approve/reject request của chính mình tạo

## Non-Functional Requirements
- API response time: p95 < 300ms cho endpoint tạo refund
- Refund processing: hoàn thành trong 48 giờ sau approve
- Audit trail: mọi action trên refund request phải được log
