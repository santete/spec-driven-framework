---
description: "Gate 0 — Convert BRD document into structured spec artifacts for the 9-station pipeline"
argument-hint: "<path-to-brd.md>"
---

# /brd-intake

**Gate 0** — cổng đầu tiên. Chuyển BRD (Business Requirements Document) của PO thành spec artifacts cho pipeline.

```
BRD (PO viết) → Gate 0 parse → specs/<domain>/*.md → /spec-change (S0→S8)
```

## Cách dùng

```bash
/brd-intake docs/brd/payment-flow.md
/brd-intake product-spec/feature-xyz.md
```

## Flow

### Step 1 — Launch brd-parser subagent

```
Agent(subagent_type="implementer", prompt="
  You are the brd-parser for Keystone Gate 0.
  Read .claude/agents/brd-parser.md for full instructions.
  Read the BRD file: <path>
  Read specs/spec-schema.json for valid fields.
  Read specs/ for existing specs (avoid ID collisions).
  Read specs/project.md for domain context.
  Parse the BRD into structured spec files under specs/<domain>/.
  Set all specs to status: draft.
")
```

### Step 2 — Validate

```bash
npx tsx src/keystone/cli/brd-intake.ts --source <path>
```

Shows dashboard:
- Artifacts grouped by type (FEAT, REQ, ENT, NFR, API)
- Per-artifact: ID, priority, AC count, field count
- Relations map
- S0 intake QC pass/fail
- TODOs for PO to clarify

### Step 3 — PO Review

PO reviews generated specs:
1. Verify accuracy — does the spec match BRD intent?
2. Resolve TODOs — clarify ambiguous requirements
3. Adjust priorities — confirm must/should/could
4. Change `status: draft` → `status: approved`

### Step 4 — Enter pipeline

```bash
/spec-change --title "<BRD title>"
```

Specs flow through S0→S8: intake QC → spec graph → traceability → governance → impact → SDD design → codegen → verification → delivery.

## Example

Input BRD:
```markdown
# Payment Refund Flow

## Business Context
Customers need to request refunds for orders within 30 days.

## Requirements
1. Customer can request a refund from order detail page (must)
2. System validates refund eligibility (within 30 days, order status = delivered)
3. Admin can approve/reject refund requests (must)
4. Refund amount credited back to original payment method within 5 business days

## Data Model
- RefundRequest: id, order_id, amount, reason, status (pending/approved/rejected), created_at
- Refund eligibility: order must be delivered, within 30 days, not already refunded

## Performance
- Refund processing: < 500ms p95
```

Output:
```
╔══════════════════════════════════════════════════════════════╗
║  📋 BRD INTAKE — Gate 0                                    ║
╚══════════════════════════════════════════════════════════════╝

🎯 FEATURE (1)
   ☐ FEAT-REFUND: "Payment Refund Flow"

📝 REQUIREMENT (3)
   ☐ REQ-REFUND-001 [must]: "Customer requests refund" — 2 AC
   ☐ REQ-REFUND-002 [should]: "Validate refund eligibility" — 1 AC
   ☐ REQ-REFUND-003 [must]: "Admin approve/reject refund" — 2 AC

🗃️ ENTITY (1)
   ☐ ENT-REFUND-REQUEST: "RefundRequest" — 6 fields, 3 invariants

⚡ NFR (1)
   ☐ NFR-REFUND-001: "Refund processing latency" — p95 < 500ms

✅ S0 INTAKE QC: PASS

Next steps:
  1. PO reviews specs
  2. Change status: draft → approved
  3. /spec-change --title "Payment Refund Flow"
```
