# PRD — Keystone

> **Governed Spec-Driven Production Framework** trên nền Claude Code
> Tài liệu là nguồn sự thật duy nhất; code là artifact dẫn xuất; mọi thay đổi đều có thể truy nguyên, có version, có phân tích tác động và được kiểm chứng tự động trước khi commit.

| | |
|---|---|
| **Mã tài liệu** | PRD-KEYSTONE |
| **Phiên bản** | 0.8.1 |
| **Trạng thái** | Draft — chờ phê duyệt feasibility |
| **Phạm vi phase** | Phase 1 — Feasibility (output = web/service) |
| **Chủ sở hữu** | _(điền)_ |
| **Cập nhật** | 2026-06-04 |

### Changelog

| Version | Ngày | Thay đổi |
|---|---|---|
| 0.1.0 | 2026-06-04 | Bản nháp đầu tiên: kiến trúc 6 lớp, đặc tả spec format chặt, chính sách auto-commit. |
| 0.2.0 | 2026-06-04 | Giải quyết C1–C15 từ phân tích khả thi: chốt file-ownership theo ID (Q3), chốt stack TS+Fastify (Q1+Q2), thêm §8.4 spec evolution, §9.7 drift resolution, §13.6 NFR chi phí token, đổi `require_human_review_on:[breaking]` mặc định ON, thêm R8/R9/R10, thêm subagent `adversarial-tester`, làm rõ orchestrator `/spec-change`, OpenAPI cho phép ref ngoài, persona Spec Author = tech-PM/engineer. |
| 0.3.0 | 2026-06-04 | **Reframe: dây chuyền sản xuất 9 trạm S0–S8** (S0 Intake → S8 Post-delivery), mỗi trạm có input/output gate + customer touchpoint. Thêm S0 Intake QC (verify nguyên liệu spec, trả về customer kèm báo cáo nếu rớt) và S5 SDD Design (Software Design Document trung gian giữa spec và code, có cổng duyệt customer). Tech stack chuyển từ chốt-framework sang artifact `PROJECT` per-project (TS+Fastify là default profile, framework hỗ trợ catalog). Thêm artifact `PROJECT` và `SDD-*`, FR-INTAKE-*, FR-SDD-*, cổng G0/G_SDD, vai trò Customer Liaison agent. |
| 0.4.0 | 2026-06-04 | **QC hai đầu + rework chain.** Thêm §7.5 hợp đồng I/O & QC hai đầu (Entry QC + Exit QC) cho mỗi trạm; quy tắc rework UR1–UR8; chính sách đẩy lùi về trạm liền trước (S_n fail → S_{n-1}) với escalation chain về tới Customer; tách "lỗi hệ thống" vs "lỗi nguyên liệu". K_self phân hóa theo bản chất trạm (cơ giới=1, LLM-driven=2, test=0). Thêm §10.7 rework log artifact, M10 rework rate metric, §8.2.7 `PROJECT.rework` schema (SR18) cho tùy chỉnh K theo maturity/budget/criticality của project. |
| 0.5.0 | 2026-06-04 | **Bảng điều khiển vận hành.** Thêm §18 operator console: trạng thái 7-state enum cho mỗi trạm, dashboard tổng (`/keystone:status`), dashboard chi tiết per-trạm với Entry QC/Process/Exit QC checklist, danh mục slash command đầy đủ (`/keystone:S0`…`S8`, customer touchpoint, reviewer escalation), cơ chế thông báo + escalation. Đẩy "Công việc tương lai" cũ thành §19. |
| 0.6.0 | 2026-06-04 | **Chốt Q4 (semantic-diff classification) + Q8 (feedback template).** Thêm §8.5 bảng phân loại `breaking`/`additive`/`cosmetic` theo artifact × thao tác (default "không match rule ⇒ breaking"); thêm §10.8 ba template feedback (`concise`/`detailed`/`coaching`) áp dụng cho intake report + SDD review thread, mặc định `detailed`. Bổ sung `PROJECT.feedback_style` (§8.2.7). Đóng Q4, Q8 trong §17. |
| 0.7.0 | 2026-06-04 | **Chốt Q9 (S5 reject loop policy).** Formal hóa `reject_reason.category` (4 giá trị), thêm FR-SDD-09 reviewer triage workflow khi `K_customer_reject_s5` vượt: 4 path (spec-rewrite / reviewer-takeover / declare-infeasible / reset-budget) — không tự đoán, không INCIDENT thẳng. Anti-pattern pre-escalate khi reject category giống nhau ≥ 2 lần. Thêm state `awaiting-reviewer-triage` (§18.1), 3 slash command `/keystone:S5:route-to-spec`, `:reviewer-takeover`, `:declare-infeasible` (§18.5). Thêm M12 reject distribution. Đóng Q9 trong §17. |
| 0.8.0 | 2026-06-04 | **Chốt Q6, Q7, Q10.** Q6: cấm tuyệt đối cycle trong spec graph Phase 1 — bỏ exception `cycle_allowed`; Phase 2 mới cân nhắc mở. Q7: hook test thủ công bằng Vitest fixture (`.claude/hooks/__tests__/`), bootstrap exception không qua `/spec-change`; thêm §15.3 framework infra test policy + HR1–HR4. Q10: Phase 1 đóng băng `web-service-ts-fastify`; Phase 2 mở custom profile qua certification gate (§15.4) — repo riêng + reference test suite + M3 threshold + catalog admission. Thêm `PROJECT.profile_source` (SR20). Đóng Q6, Q7, Q10 trong §17. |
| 0.8.1 | 2026-06-04 | **Self-check nhất quán.** Sửa các điểm lệch nhau giữa các phần: (a) đồng bộ đếm trạm = **9** (S0–S8) thay cho "8 trạm" cũ (§1, §7.1, §7.4, §11); (b) đồng bộ đếm IQ = **8 tiêu chí** (IQ1–IQ8) ở §9.0 (trước đây nói "7"); (c) gỡ Q10 khỏi danh sách "còn mở" §17 (đã đóng trong v0.8.0); (d) chỉnh §17 intro nói các Q đã chốt từ v0.1.0–**v0.8.0**; (e) FR-SDD-04 dùng slash-command form `/keystone:S5:*` + bắt buộc `--category` khi reject (đồng bộ với §18.5 + FR-SDD-09); (f) §7.3 thay reference mơ hồ `keystone respond <run-id>` bằng tham chiếu §18.5 customer touchpoint catalog; (g) Phụ lục A bổ sung `.claude/hooks/` + `.claude/commands/` + các artifact `.keystone/` còn thiếu (rework-log, diff-log, manual-actions); (h) đồng bộ `generator`/`@generated-by` ví dụ về `keystone@0.8.x`; (i) đồng bộ cổng-trên-trạm theo §12: §7.4 S7 row bỏ G3 (G3 ở S6 entry) → `Chạy G5+G6+G7+G8`; (j) đồng bộ phạm vi auto-commit/pre-commit = **G0–G9** (gồm G0 intake) ở §7.1 S8 description, §7.4 S8 trigger, §16 Phase 0 + Phase 2 success criteria, §15.4 PG2, §16 M2 — trước đây các chỗ này nói "G1–G9" trong khi §12 + §7.2 + §11 step 10 + §7.5.2 S8 process đều quy định pre-commit chạy G0–G9; (k) sơ đồ §7.3 sửa nhãn S7:VERIFY từ "G1–G9" → "G5–G8" để khớp đúng các cổng S7 chạy theo §12. Không thay đổi semantics/quyết định nào. |

---

## 1. Tóm tắt điều hành

Keystone là một **dây chuyền sản xuất phần mềm** trên nền Claude Code, trong đó **spec là nguyên liệu đầu vào** và **code là sản phẩm đầu ra**. Dây chuyền gồm **9 trạm liên tiếp S0–S8** — mỗi trạm có cổng kiểm tra đầu vào, công đoạn xử lý, cổng nghiệm thu đầu ra; nguyên liệu không đạt chuẩn bị **trả lại Customer (Spec Author) kèm báo cáo có cấu trúc**, không cho đi tiếp.

Khi spec thay đổi, dây chuyền: (S0) **kiểm tra nguyên liệu** đạt chuẩn không → (S1–S2) lưu spec + dựng đồ thị truy nguyên → (S3) **cổng quản trị** xác nhận ý định + ADR → (S4) phân tích tác động → (S5) **dựng SDD** (Software Design Document) từ spec + **profile stack của project** rồi xin duyệt Customer → (S6) sinh code/test/doc cho lát cắt bị ảnh hưởng → (S7) chạy kiểm chứng đóng vòng → (S8) **tự động commit khi toàn bộ cổng pass** + giám sát drift sau giao hàng. Mọi artifact đều truy nguyên hai chiều về spec sinh ra nó.

Phase 1 tập trung chứng minh tính khả thi với output là **web app hoặc service**, dùng **spec có cấu trúc chặt** (machine-validated). Stack mặc định: **TypeScript + Fastify + Zod + Vitest + Drizzle/SQLite** — nhưng đây là **default profile**, mỗi project khai báo profile riêng qua artifact `PROJECT` (§8.2.7, §15.2). Audience của Phase 1 là **kỹ sư & tech-PM**; persona PM/BA thuần phục vụ ở Phase 3 qua lớp MD→spec.

Năm cơ chế chịu lực: **stable ID** (xương sống truy nguyên), **code là dẫn xuất** (chặn sửa ngoài luồng), **semantic diff theo ID** (không theo dòng), **vòng kiểm chứng đóng** (test sinh từ spec phải pass mới commit), và **kiểm soát theo trạm** (mỗi cổng giữa trạm có quyền chặn + đẩy ngược về Customer kèm báo cáo có cấu trúc).

---

## 2. Bối cảnh & vấn đề

Trong phát triển phần mềm thông thường, tài liệu và code phân kỳ ngay sau lần commit đầu tiên. Tài liệu mô tả "ý định", code mô tả "thực tế", và không có liên kết máy đọc được giữa hai bên. Hệ quả:

- Không trả lời được "thay đổi requirement này ảnh hưởng tới những gì?" mà không đọc tay toàn bộ codebase.
- Không truy được "đoạn code này phục vụ yêu cầu nào, ai duyệt, vì sao tồn tại".
- Thay đổi nhỏ ở tài liệu không tự động lan tới code; mọi thứ phụ thuộc trí nhớ con người.
- Người không code (PM, BA, domain expert) không thể trực tiếp tạo ra thay đổi sản phẩm.

Keystone đảo ngược quan hệ: **spec là input chính, code là output**. Điều này chỉ khả thi khi spec đủ chặt để máy hiểu, và khi có hạ tầng truy nguyên + kiểm chứng đủ mạnh để tin tưởng việc sinh code tự động.

---

## 3. Mục tiêu & Phi mục tiêu

### 3.1 Mục tiêu (Phase 1)

- **G1** — Thay đổi spec → dây chuyền adapt được code của một web/service mục tiêu, giới hạn ở phần bị tác động.
- **G2** — Mọi artifact (code, test, doc) truy nguyên hai chiều về spec ID sinh ra nó.
- **G3** — Mọi thay đổi spec đi qua cổng quản trị: validate, version, ghi nhận ý định (ADR), phân tích tác động.
- **G4** — Acceptance criteria trong spec sinh ra test thực thi được; pipeline tự commit khi test pass.
- **G5** — Định dạng spec đủ chặt để validate bằng schema và diff theo ngữ nghĩa.

### 3.2 Phi mục tiêu (Phase 1)

- **NG1** — Không hỗ trợ Markdown prose tự do làm input (cần spec cấu trúc; lớp MD→spec là phase sau).
- **NG2** — Không nhắm "no-code tuyệt đối 100%"; chấp nhận escape hatch có kiểm soát cho ca LLM chưa kham được.
- **NG3** — Không hỗ trợ mọi loại output (mobile native, embedded, ML pipeline…) trong phase này — chỉ web/service.
- **NG4** — Không thay thế CI/CD doanh nghiệp; Keystone tích hợp lên trên, không tái phát minh.
- **NG5** — Không đảm bảo sinh code byte-for-byte tất định (xem §13.1).

---

## 4. Đối tượng người dùng

| Persona | Mô tả | Tương tác chính |
|---|---|---|
| **Spec Author** | Tech-PM / engineer / domain expert có khả năng đọc-viết YAML và dùng git. PM/BA thuần phục vụ ở Phase 3 qua lớp MD→spec. | Sửa file spec, mở PR, đọc impact report |
| **Reviewer/Maintainer** | Người duyệt thay đổi breaking, sở hữu domain | Duyệt ADR, duyệt PR ở các cổng yêu cầu người |
| **Platform Engineer** | Người dựng & vận hành framework | Cấu hình hooks, skills, agents, codegen target |
| **Auditor** | Người cần truy vết lý do/lịch sử thay đổi | Truy vấn trace index, đọc ADR, lịch sử version |

> **Ghi chú phạm vi persona (giải quyết C9):** PRD v0.1.0 viết "PM/BA/domain expert" sẽ trực tiếp viết spec — mâu thuẫn với §8 vốn yêu cầu YAML + ID grammar + JSON Schema. Phase 1 thừa nhận thẳng: Spec Author phải đủ khả năng kỹ thuật để viết YAML hợp lệ. "No-code cho PM thuần" là mục tiêu Phase 3.

---

## 5. Thuật ngữ & khái niệm cốt lõi

| Thuật ngữ | Định nghĩa |
|---|---|
| **Spec artifact** | Một đơn vị đặc tả có ID ổn định, lưu thành một file dưới `specs/`. |
| **Stable ID** | Định danh bất biến theo thời gian của một spec artifact (vd `REQ-AUTH-001`). Không tái dùng, không xóa — chỉ deprecate. |
| **Derived artifact** | Bất kỳ output sinh từ spec: file code, test, doc. Không được sửa ngoài luồng pipeline. |
| **Traceability graph** | Đồ thị liên kết hai chiều spec ID ↔ derived artifact ↔ test. |
| **Trace index** | Hiện thực vật lý của graph, lưu tại `.trace/index.json`, do máy sinh. |
| **Semantic diff** | So sánh spec theo ID + cấu trúc (không theo dòng text), trả về tập ID thêm/sửa/xóa. |
| **Impact report** | Báo cáo các artifact/feature/test bị ảnh hưởng bởi một semantic diff, kèm phân loại rủi ro. |
| **ADR** | Architecture/Any Decision Record — bản ghi ý định bắt buộc kèm mỗi thay đổi có ý nghĩa. |
| **Drift** | Sai lệch giữa code thực tế và trace index (thường do sửa tay ngoài luồng). |
| **Acceptance criterion (AC)** | Tiêu chí nghiệm thu của một requirement, viết theo dạng Given/When/Then, sinh ra test. |
| **Production line** | Chuỗi skills/subagents Claude Code biến semantic diff thành thay đổi code đã kiểm chứng. |
| **Station (trạm)** | Một công đoạn liên tiếp trên dây chuyền, có input gate (điều kiện vào), process (xử lý), output gate (cổng nghiệm thu), customer touchpoint (khi nào cần Customer can dự). 9 trạm S0–S8 (§7.4). |
| **Customer** | Người đưa nguyên liệu spec vào dây chuyền. Đồng nhất với persona **Spec Author** (§4). |
| **Intake QC** | Kiểm tra nguyên liệu đầu vào ở S0: completeness, clarity, feasibility, resolvability, semver consistency, NFR measurability, project compatibility, project artifact present. Vượt SR1–SR9 và IQ1–IQ8. |
| **Customer feedback report** | Báo cáo có cấu trúc trả về Customer khi spec rớt S0 hoặc bị từ chối ở cổng nào đó. Liệt kê ID, trường, lý do, gợi ý sửa. |
| **Project / Stack profile** | Artifact `PROJECT` khai báo stack + ràng buộc của một project (§8.2.7). Framework hỗ trợ catalog profile; mặc định **web-service-ts-fastify**. |
| **SDD (Software Design Document)** | Artifact thiết kế dẫn xuất từ (spec ∩ project profile), nằm giữa spec và code. Có 4 loại: `SDD-ARCH`, `SDD-COMP`, `SDD-DATA`, `SDD-API-IMPL` (§8.2.8). |
| **Customer Liaison** | Subagent phụ trách tổng hợp báo cáo cho Customer + nhận phản hồi/duyệt SDD; tách context với các subagent kỹ thuật để giữ giọng nói nhất quán với Customer. |

---

## 6. Phạm vi Phase 1

**Trong phạm vi:** output web app hoặc service; spec format cấu trúc chặt; traceability graph + index; governance gate (lint/ID/ADR/semver); semantic diff; impact analysis; codegen surgical theo lát cắt bị ảnh hưởng; sinh acceptance test; auto-commit khi test pass; drift detection.

**Ngoài phạm vi (phase sau):** lớp MD tự do → spec cấu trúc; output ngoài web/service; bộ chỉnh sửa spec dạng GUI; multi-repo orchestration.

---

## 7. Tổng quan kiến trúc

Keystone là **dây chuyền sản xuất 9 trạm S0–S8**. Mỗi trạm có cổng vào (input gate), công đoạn xử lý, cổng nghiệm thu (output gate). Nguyên liệu rớt cổng nào → trả về Customer kèm báo cáo có cấu trúc, không cho đi tiếp.

```
[Customer đưa spec] → S0 Intake QC ──► S1 Spec ──► S2 Traceability ──► S3 Governance
                          │  rớt                                                │
                          └─► Customer feedback report ◄─── (rớt cổng nào cũng vòng về)
                                                                                ▼
       S8 Delivery & Post-delivery ◄── S7 Verification ◄── S6 Production line
              ▲                                                ▲
              │                                                │
              └── auto-commit / drift monitor                  └── S5 SDD Design ◄── S4 Impact
                                                                       │ (cần customer duyệt)
                                                                       ▼
                                                                  Customer approve/reject
```

### 7.1 Chín trạm sản xuất (S0–S8)

| # | Trạm | Mục đích | Lớp kỹ thuật cũ (v0.2) |
|---|---|---|---|
| **S0** | **Intake QC** | Kiểm tra nguyên liệu spec đạt chuẩn (completeness, clarity, feasibility). Rớt → trả Customer kèm báo cáo. | _(mới)_ |
| **S1** | **Spec** | Lưu trữ + validate cấu trúc spec, stable ID. | Spec layer |
| **S2** | **Traceability** | Đồ thị hai chiều spec ↔ code ↔ test ↔ SDD. | Traceability layer |
| **S3** | **Governance** | Cổng quản trị thay đổi: ADR, semver, lint SR1–SR9. | Governance layer |
| **S4** | **Impact analysis** | Tính semantic diff + báo cáo lan tác động. | Impact analysis layer |
| **S5** | **SDD Design** | Sinh Software Design Document từ (spec ∩ project profile); cổng duyệt Customer trước codegen. | _(mới)_ |
| **S6** | **Production line** | Sinh/sửa code, test, doc cho lát cắt bị ảnh hưởng. | Production line |
| **S7** | **Verification** | Chạy test (acceptance + adversarial + snapshot + regression), drift-check, cost-check. | Verification layer |
| **S8** | **Delivery & post-delivery** | Auto-commit khi pass G0–G9; giám sát drift sau giao hàng. | _(tách ra từ Verification)_ |

> **Đối chiếu với v0.2:** "6 lớp" cũ là phân tách kỹ thuật theo trách nhiệm; "9 trạm S0–S8" mới là **dòng chảy vận hành** theo metaphor dây chuyền. Mỗi lớp vẫn tồn tại như đơn vị thiết kế code; mỗi trạm là đơn vị tổ chức quy trình. Hai góc nhìn bổ sung, không loại trừ.

### 7.2 Ánh xạ sang primitive Claude Code

| Thành phần Keystone | Primitive Claude Code | Vai trò |
|---|---|---|
| Hiến pháp framework | `CLAUDE.md` | Luật bất biến: spec là nguồn, code là dẫn xuất, mọi thay đổi qua `/spec-change`. |
| **Orchestrator** | Skill `/spec-change` (main entry) | Điều phối tuần tự: `spec-lint → semantic-diff → impact-analysis → codegen-from-spec → gen-acceptance-tests → adversarial-test → verification → trace-update → commit`. Xem §7.3. |
| Quy trình tái dùng | `.claude/skills/*/SKILL.md` | `intake-qc` (S0), `spec-lint`, `semantic-diff`, `impact-analysis`, **`sdd-design`** (S5), **`sdd-review`** (cổng duyệt SDD), `codegen-from-spec`, `gen-acceptance-tests`, `adversarial-test`, `trace-update`, `drift-check`, `spec-evolution`, **`feedback-report`** (sinh báo cáo trả Customer). |
| Tác vụ cô lập/song song | `.claude/agents/*.md` (subagents) | `intake-inspector` (S0), `spec-validator`, `impact-analyzer`, **`sdd-designer`** (S5), `implementer`, `test-author`, **`adversarial-tester`** (sinh test độc lập từ rationale, không thấy code), `traceability-keeper`, **`customer-liaison`** (tổng hợp báo cáo + nhận duyệt), `reviewer` — mỗi agent context riêng. |
| Cưỡng chế governance | `.claude/settings.json` hooks | `PreToolUse` chặn sửa code ngoài luồng + chặn ghi file không thuộc sở hữu ID đang xử lý (§9.5.1); `PostToolUse` chạy lint + trace-update; `SessionStart` nạp index spec + ownership manifest; `PreCommit` chạy G0–G9 (§12). |
| Versioning & lịch sử | Git | Tag version spec theo semver; ADR trong repo; commit có provenance. |
| Đóng gói & chia sẻ | Plugin (Claude Code Plugin format) | Gói `.claude/` + `specs/spec-schema.json` + `CLAUDE.md` template thành plugin chuẩn. Phiên bản plugin tách rời phiên bản spec của user-repo. |
| Tích hợp ngoài | MCP servers | Nối issue tracker / CI khi cần. |

> **Lưu ý cưỡng chế:** instruction trong `CLAUDE.md` chỉ được tuân theo ~80% — vì vậy mọi ràng buộc *bắt buộc* (chặn sửa code, chặn ID không hợp lệ, chặn commit khi test fail) phải đặt ở **hooks**, không đặt ở prompt. Chặn ở thời điểm submit/commit, không chặn giữa lúc agent đang edit.

### 7.3 Orchestrator — Skill `/spec-change`

Skill `/spec-change` là **entry point duy nhất** cho mọi vòng đời thay đổi. State machine khớp 1:1 với 9 trạm sản xuất S0–S8 (§7.1), mỗi cạnh chuyển trạng thái là **một cổng** có thể chặn và đẩy ngược về Customer:

```
[INIT] → S0:INTAKE-QC ──► S1:SPEC ──► S2:TRACE ──► S3:GOV ──► S4:IMPACT
            │ G0 fail        │            │           │           │
            └──────────► CUSTOMER-FEEDBACK ◄──────────┴───────────┘
                              ▲                                   │
                              │ G_SDD reject                      ▼
                       S5:SDD-DESIGN ──► (customer approve) ──► S6:PRODUCTION
                                                                    │
                              ┌── S7:VERIFY ◄──────────────────────┘
                              │ G5–G8
            ┌─ fail ──────────┘
            ▼                  pass
   keep workdir + feedback     │
                               ▼
                        S8:DELIVERY (auto-commit) ──► POST-DELIVERY (drift monitor)
```

**Biên giao dịch:**

- **Per-ID transaction**: mỗi spec ID bị ảnh hưởng là đơn vị atomic. Codegen + test cho ID đó phải xong hoàn toàn hoặc rollback toàn bộ thay đổi của ID đó.
- **Batch boundary**: toàn bộ impact report là một batch. Một ID fail → toàn batch rollback (git reset workdir về state trước `S6:PRODUCTION`), không commit từng phần.
- **Resume an toàn**: state machine ghi `.keystone/run-state.json` per trạm → có thể resume sau crash, không sinh code trùng.
- **Customer touchpoint**: hai trạm cần Customer can dự đồng bộ — S0 (nếu rớt intake) và S5 (duyệt SDD). Pipeline pause + chờ phản hồi qua MCP/issue tracker hoặc slash command thuộc namespace `/keystone:S0:*` / `/keystone:S5:*` (xem §18.5 — customer touchpoint catalog).

**Error recovery matrix:**

| Trạm fail | Hành động | Customer can dự? |
|---|---|---|
| S0 INTAKE-QC | Dừng ngay; `customer-liaison` sinh feedback report; pause chờ Customer sửa spec | **Có** — gửi báo cáo |
| S1–S4 (Spec/Trace/Gov/Impact) | Dừng sớm, không tạo branch sinh code; báo cáo lỗi định vị tới ID | Tùy lỗi: nếu spec sai → có; nếu hệ thống lỗi → không |
| S5 SDD-DESIGN | Pause; trình SDD cho Customer; chờ `approve` / `reject` / `request-change` | **Có** — duyệt SDD |
| S6 PRODUCTION (1 ID fail) | Rollback workdir; báo cáo ID + skill nào lỗi; không thử ID khác | Không (lỗi kỹ thuật, đẩy lên reviewer) |
| S7 VERIFY | Giữ workdir để debug; không commit; báo cáo cổng nào fail (G5–G8) | Không (gửi reviewer) |
| S8 DELIVERY | Nếu pre-commit hook reject → giữ workdir + báo cáo | Không |

### 7.4 Chi tiết 9 trạm — input/output gate & customer touchpoint

> §7.4 dưới đây là **bản tóm tắt nghiệp vụ**. Hợp đồng dữ liệu chính thức + QC hai đầu (Entry QC trước process, Exit QC sau process) + chính sách rework đẩy lùi định nghĩa ở **§7.5**.


| # | Input gate | Process | Output gate | Customer touch |
|---|---|---|---|---|
| **S0 Intake QC** | Có ≥ 1 spec file diff vs base; `PROJECT` artifact tồn tại | `intake-inspector` chạy SR1–SR9 + IQ1–IQ8 (§9.0); sinh báo cáo cấu trúc | **G0**: 0 lỗi IQ; spec coherent với PROJECT profile | **Có** — nếu rớt: feedback report về Customer; pause |
| **S1 Spec** | G0 pass | Đọc spec, dựng AST/object model trong-bộ-nhớ | Spec object hợp lệ | Không |
| **S2 Traceability** | S1 done | Cập nhật trace index từ ownership.yaml + spec | Index nhất quán | Không |
| **S3 Governance** | S2 done | spec-lint full; check ADR; check semver bump | **G1+G2**: lint + ADR pass | Reviewer khi breaking |
| **S4 Impact** | S3 pass | semantic-diff + impact-analyzer subagent | Impact report tạo | Không |
| **S5 SDD Design** | S4 done; impact report ≥ 1 ID | `sdd-designer` sinh SDD từ (spec ∩ PROJECT profile); `customer-liaison` trình bày | **G_SDD**: Customer approve | **Có** — duyệt SDD; có thể reject & quay về S0 |
| **S6 Production** | G_SDD approve | `implementer` + `test-author` + `adversarial-tester` (song song) sinh code/test theo SDD | **G4**: codegen complete + file-ownership consistent | Không |
| **S7 Verification** | S6 done | Chạy G5+G6+G7+G8 (G3 ở S6 entry, G4 ở S6 exit — không re-run tại S7) | Mọi cổng xanh | Reviewer khi G9 breaking |
| **S8 Delivery** | G0–G9 pass | Auto-commit atomic (spec + ADR + SDD + code + test + trace + ownership) | Commit thành công | Không (post-delivery drift alert nếu có) |

### 7.5 Hợp đồng I/O & QC hai-đầu tại mỗi trạm (mới v0.4)

§7.4 chỉ liệt kê cổng đầu vào và cổng đầu ra ở mức điều kiện nghiệp vụ. §7.5 nâng lên thành **hợp đồng dữ liệu chính thức** (Input Contract + Output Contract) + **kiểm tra chất lượng hai đầu** (Entry QC trước process, Exit QC sau process) + **chính sách rework đẩy lùi** về trạm liền trước, đệ quy tới khi nguyên liệu đạt chuẩn.

Mục tiêu: phòng "rác vào → rác ra". Một trạm trước rò rỉ lỗi qua Exit QC của nó không đủ để bảo vệ — trạm sau phải tự kiểm input lần nữa và đẩy ngược nếu phát hiện sai, tới khi nào nguyên liệu thật sự đạt mới xử lý.

#### 7.5.1 Quy tắc chung (Universal Rework — UR)

- **UR1 — Hợp đồng I/O bất biến.** Mỗi trạm khai báo **Input Contract (IC-S_n)** và **Output Contract (OC-S_n)** dưới dạng schema dữ liệu (TypeScript-like; JSON Schema chi tiết ship trong `keystone/contracts/*.schema.json` ở Phase 0). Vi phạm hợp đồng = **lỗi hệ thống** (bug platform), không phải lỗi nguyên liệu — log INCIDENT thay vì rework.
- **UR2 — QC hai đầu.** Mỗi trạm có **Entry QC (EQC-S_n)** chạy *trước* process + **Exit QC (XQC-S_n)** chạy *sau* process. Cả hai pass mới chuyển trạm tiếp; rớt ở đâu xử lý ở đó.
- **UR3 — Rớt Entry QC ⇒ đẩy về trạm liền trước.** S_n EQC fail → S_{n-1} chạy lại với **rework feedback** có cấu trúc (ID, trường, lý do, gợi ý). Trạm trước phải fix root cause, không pad workaround.
- **UR4 — Rớt Exit QC ⇒ tự lặp lại.** Trạm tự retry ≤ `K_self` lần với feedback nội bộ. Vượt giới hạn → escalate về trạm liền trước (giống UR3).
- **UR5 — Chuỗi escalation.** Nếu trạm liền trước cũng không fix được (rework fail ở đó), tiếp tục đẩy lùi S_{n-2}, S_{n-3}, … tới S_0 → Customer. Mỗi cấp ghi `rework_chain[]` vào audit log.
- **UR6 — Trần rework toàn cục.** Tổng số vòng rework trong 1 `/spec-change` run ≤ `K_global` (mặc định 5). Vượt → pipeline dừng, tạo `INCIDENT-NNN`, đẩy reviewer (không vòng tiếp).
- **UR7 — Rework log.** Mọi rework ghi vào `.keystone/rework-log.json` (§10.7) gồm: from_station, to_station, trigger, category, reason, feedback, attempt_no, token_cost, duration_ms.
- **UR8 — Một báo cáo cho Customer.** Khi chain cuối cùng vẫn đẩy về Customer, `customer-liaison` tổng hợp **toàn bộ chain** thành **một** intake-report (bổ sung field `rework_chain`), không gửi từng cấp một — tránh ngập noti và giữ Customer chỉ nhìn root cause.

**Tham số cấu hình** (mặc định framework, override-able qua `PROJECT.rework` — §8.2.7):

`K_self` **phân hóa theo bản chất trạm** — trạm cơ giới (deterministic: lint/diff/parse) chỉ cần 1 retry để bắt transient; trạm LLM-driven (SDD/codegen) hưởng lợi từ feedback iteration nên 2; S7 test suite đắt nên 0:

| Trạm | Bản chất | `K_self` mặc định | Lý do |
|---|---|---|---|
| **S0** Intake | LLM-assist + rule | **1** | Rule chặt; fail lần 2 = nguyên liệu thật sự sai → Customer |
| **S1** Spec | Cơ giới (parse + resolve) | **1** | Deterministic; fail 2 lần = bug platform |
| **S2** Trace | Cơ giới | **1** | Như S1 |
| **S3** Governance | Cơ giới (lint + ADR check) | **1** | Như S1 |
| **S4** Impact | semantic-diff + LLM-assist | **1** | Diff deterministic; analyzer 1 retry đủ |
| **S5** SDD | LLM-driven | **2** | LLM cải thiện qua feedback iteration |
| **S6** Production | LLM-driven | **2** | Như S5 |
| **S7** Verification | Test run | **0** | Test suite đắt; fail = escalate ngay theo gate category |
| **S8** Delivery | Cơ giới (git) | **1** | 1 retry cho transient git lock / hook flake |

| Tham số toàn cục | Mặc định | Ý nghĩa |
|---|---|---|
| `K_global` | 5 | Tổng số rework trong 1 run trước khi pipeline dừng + INCIDENT. Tổng chi phí token cap ~150–250k (30–50% NFR-COST-01) — vượt ngưỡng này không nên đốt thêm |
| `K_customer_reject_s5` | 3 | Số lần Customer reject SDD liên tiếp trước khi escalate reviewer (đóng Q9) |
| `K_customer_retry_s0` | 5 | Số lần Customer resubmit spec sau S0 fail trong cùng PR trước khi escalate. Phase 1 = 5 (đường cong học spec); Phase 2 hạ xuống 3 khi team thuần thục |

#### 7.5.2 Hợp đồng I/O & QC chi tiết — 9 trạm

##### S0 — Intake QC

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S0** | `{ spec_diff: SpecFile[]≥1, project: PROJECT(status=approved), base_commit: sha, run_id: string }` |
| **EQC-S0** | E1 `spec_diff` không rỗng; E2 `project.status == approved`; E3 `run_id` chưa tồn tại trong `.keystone/run-state.json`; E4 `base_commit` resolve được trong git |
| **Process** | SR1–SR9 + IQ1–IQ8 (§9.0) |
| **OC-S0** | `{ verdict: "pass"\|"reject", spec_object?: SpecAst, intake_report?: IntakeReport, next: "S1"\|null }` |
| **XQC-S0** | X1 `verdict ∈ enum`; X2 `pass` ⇒ `spec_object` hợp lệ + 0 IQ violation; X3 `reject` ⇒ `intake_report.items.length ≥ 1` mỗi item có ID + criterion + suggestion |
| **Rework** | EQC fail → INCIDENT (lỗi hệ thống, không có S_{-1}); XQC fail self ≤ K_self → Customer (kèm intake report); Customer là gốc chain — `K_customer_retry_s0` lần vẫn fail → escalate reviewer |

##### S1 — Spec

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S1** | `{ spec_object: SpecAst (từ OC-S0), base_index: TraceIndex }` |
| **EQC-S1** | E1 `spec_object` parse-able + signature hash khớp OC-S0 mới nhất; E2 `base_index` đọc được + `schema_version` tương thích generator |
| **Process** | Resolve `relations` thành đồ thị spec-side; build SpecGraph in-memory |
| **OC-S1** | `{ spec_graph: SpecGraph, resolved_refs: Ref[], orphans: Ref[] }` |
| **XQC-S1** | X1 `orphans` rỗng; X2 `spec_graph` **acyclic tuyệt đối** (Phase 1 không exception — chốt Q6); X3 mọi cạnh `relations` có target tồn tại |
| **Rework** | EQC fail → S0 (spec_object lạ ⇒ IQC bỏ sót); XQC fail self ≤ K_self → S0 (root cause = spec sai) |

##### S2 — Traceability

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S2** | `{ spec_graph: SpecGraph, ownership_yaml: Ownership, base_index: TraceIndex }` |
| **EQC-S2** | E1 `spec_graph` hợp lệ; E2 `ownership_yaml` parse được; E3 `base_index.schema_version` khớp generator |
| **Process** | Cập nhật trace nodes cho mọi ID added/modified/removed; sync với ownership manifest |
| **OC-S2** | `{ trace_update: TraceDelta, new_index_draft: TraceIndex }` |
| **XQC-S2** | X1 ownership ↔ index nhất quán (mọi file `src/generated/` có owner); X2 0 orphan trace entry; X3 mọi ID trong `trace_update` có spec_path tồn tại |
| **Rework** | EQC fail → S1; XQC fail self ≤ K_self → S1 (root cause spec hoặc ownership lệch) |

##### S3 — Governance

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S3** | `{ spec_graph, trace_update, adr_drafts: ADR[], pr_meta: { semver_bump_claim } }` |
| **EQC-S3** | E1 `trace_update` đầy đủ; E2 mọi ID có ý nghĩa (≠ cosmetic) có ≥ 1 ADR draft trong `adr_drafts`; E3 `semver_bump_claim` định dạng hợp lệ |
| **Process** | spec-lint full SR1–SR9; check ADR cấu trúc; check semver vs phân loại |
| **OC-S3** | `{ verdict: "pass"\|"fail", violations: Violation[], adr_accepted: ADR[] }` |
| **XQC-S3** | X1 G1+G2 đạt; X2 mỗi `violation` có ID + rule_code + line; X3 `adr_accepted` đầy đủ cho mọi affected ID |
| **Rework** | EQC fail → S2; XQC fail self ≤ K_self → S0 nếu vi phạm là spec rule (Customer sửa) / → S2 nếu là ownership inconsistency, dựa trên `violation.category` |

##### S4 — Impact

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S4** | `{ spec_graph, trace_update, governance_verdict (passed=true), base_spec_snapshot }` |
| **EQC-S4** | E1 `governance_verdict.passed`; E2 `base_spec_snapshot` đọc được; E3 `spec_graph` là bản sau-governance |
| **Process** | semantic-diff theo ID + impact-analyzer đi dọc trace graph |
| **OC-S4** | `ImpactReport` (§10.4) |
| **XQC-S4** | X1 `classification ∈ {additive, breaking, cosmetic}`; X2 mọi entry trong `affected.code/tests/downstream_*` resolve được; X3 `required_actions` không rỗng nếu `diff.{modified\|added\|removed}` không rỗng |
| **Rework** | EQC fail → S3; XQC fail self ≤ K_self → S3 (governance verdict chưa bao trùm hết) |

##### S5 — SDD Design

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S5** | `{ impact_report, project, existing_sdds: SDD[], rationale_slices: MarkdownSlice[] }` |
| **EQC-S5** | E1 `impact_report` ảnh hưởng ≥ 1 FEAT/REQ/API/ENT; E2 `project.profile` resolve được trong catalog (§15.2); E3 mọi `existing_sdds` liên quan đọc được |
| **Process** | `sdd-designer` sinh/cập nhật SDD-*; `sdd-review` chấm; `customer-liaison` trình Customer |
| **OC-S5** | `{ sdds: SDD[] (status=approved), customer_decisions: Decision[], thread: SddReviewThread }` |
| **XQC-S5** | X1 G_SDD đạt (mọi SDD `approved` + `approval_run_id` khớp run); X2 0 `open_questions`; X3 mỗi SDD có `risks` không rỗng; X4 mọi component có `ownership_id` resolve được |
| **Rework** | EQC fail → S4; XQC fail self ≤ K_self → S4; **Customer reject** → định tuyến theo `reject_reason.category` (bắt buộc khai báo, §9.4.5 FR-SDD-09): `spec-misalignment` → S0, `impact-misanalysis` → S4, `design-quality` → tự retry sdd-designer, `customer-changed-mind` → tự retry (vẫn tính K). **Customer request-change** → tự retry **không tính** K_self (human input). **Reach `K_customer_reject_s5`** → pause `awaiting-reviewer-triage` + 4-path workflow (§9.4.5 FR-SDD-09 / §18.5). **Pre-escalate**: nếu cùng `category` xảy ra ≥ 2 lần liên tiếp → escalate ngay ở reject 2. |

##### S6 — Production

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S6** | `{ sdds (approved), impact_report, current_code_snapshot, project.stack, ownership_yaml }` |
| **EQC-S6** | E1 mọi SDD `status=approved` + `approval_run_id` khớp run; E2 ownership ↔ SDD `ownership_id` nhất quán; E3 deps của `project.stack` cài đặt; E4 budget NFR-COST còn |
| **Process** | implementer + test-author + adversarial-tester (song song, per-ID transaction) |
| **OC-S6** | `{ code_files, test_files, doc_files, adversarial_test_files, provenance: Annotation[] }` |
| **XQC-S6** | X1 G4 đạt (codegen complete + 0 stub TODO); X2 mọi file nằm trong ownership của ID đang xử lý (chặn bởi PreToolUse hook §7.2); X3 mọi file có provenance; X4 adversarial test sinh độc lập (kiểm tra qua subagent context isolation log) |
| **Rework** | EQC fail → S5 (SDD chưa approved hoặc ownership lệch); XQC fail self ≤ K_self → S5 (SDD thiếu chi tiết) hoặc S1 (spec thiếu AC) tùy `fail_category` |

##### S7 — Verification

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S7** | `{ production_bundle (từ OC-S6), spec_graph, impact_report, test_runner_config, nfr_cost_budget_remaining }` |
| **EQC-S7** | E1 `production_bundle` complete (G4 đã pass); E2 test runner khởi động được; E3 còn budget NFR-COST cho test run |
| **Process** | Chạy G5 + G6 + G7 + G8 (G3 đã evaluate ở S6 entry, G4 ở S6 exit — không re-run tại S7) |
| **OC-S7** | `VerificationReport { gate_results: { gate_id, status, evidence }[], all_passed: bool, adversarial_catch_rate: number }` |
| **XQC-S7** | X1 `all_passed = true` ⇒ tất cả `gate_results.status = pass`; X2 mọi gate có `evidence` ref (test name, log path); X3 `adversarial_catch_rate` ghi nhận |
| **Rework** | EQC fail → S6; **XQC fail K_self = 0** (tests đắt, không retry tự động) → escalate theo gate fail category: G5 + spec ambiguous → S1; G5 + code sai → S6; G6 trace inconsistent → S2; G7 drift → S6; G8 cost over → INCIDENT (không rework, đẩy budget review) |

##### S8 — Delivery

| Khía cạnh | Đặc tả |
|---|---|
| **IC-S8** | `{ verification_report (all_passed=true), impact_report, adr_accepted, sdds (approved), production_bundle, run_meta }` |
| **EQC-S8** | E1 `verification_report.all_passed`; E2 G9 check (nếu `breaking` → có reviewer approval trên PR); E3 không có concurrent commit đụng cùng ID (R9) |
| **Process** | Pre-commit hook chạy lại G0–G9; atomic commit (spec + ADR + SDD + code + test + trace + ownership) |
| **OC-S8** | `DeliveryReceipt { commit_sha, artifacts_committed: string[], post_delivery_monitors: { drift, cost } }` |
| **XQC-S8** | X1 `commit_sha` tồn tại; X2 post-commit `keystone verify --regen-trace` cho cùng trace index như pre-commit dự kiến; X3 post-delivery monitor (drift, cost) đã armed |
| **Rework** | EQC fail → S7 (cần verify lại); XQC fail (pre-commit reject) self K_self=1 → S7; commit-time race (R9) → S4 (rebase + reanalyze) |

#### 7.5.3 Bản đồ rework

```
Customer (S_{-1})
   ▲
   │ chain end — tổng hợp 1 báo cáo (UR8)
   │
S0 ◄── S1 ◄── S2 ◄── S3 ◄── S4 ◄── S5 ◄── S6 ◄── S7 ◄── S8
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      │      ▼
 self    self   self   self   self   self   self    │     self
 retry   retry  retry  retry  retry  retry  retry   │     retry
 ≤K_self                                            │     ≤1
                                          (no self retry — escalate
                                           theo gate fail category)
```

- **Mũi tên ngang** = đẩy ngược về trạm liền trước (EQC fail hoặc XQC vượt K_self).
- **Mũi tên xuống** = trạm tự retry ≤ K_self.
- **S7 không tự retry** vì test suite đắt — escalate trực tiếp theo gate fail category (xem bảng S7 ở §7.5.2).
- **S0 không có trạm trước** → S_{-1} là Customer; Customer đẩy lại `K_customer_retry_s0` lần vẫn fail → escalate reviewer (không vòng vô hạn).

#### 7.5.4 Tách "lỗi hệ thống" vs "lỗi nguyên liệu"

Hai loại lỗi xử lý **khác nhau** để tránh đẩy lỗi platform về Customer:

| Loại | Triệu chứng | Xử lý |
|---|---|---|
| **Lỗi nguyên liệu** (material defect) | Vi phạm EQC hoặc XQC do nội dung spec/SDD/code sinh ra không đạt | Rework theo UR3–UR5 |
| **Lỗi hệ thống** (system bug) | Vi phạm **IC** (sai schema), `K_global` vượt, subagent crash, MCP timeout, hook error, schema_version mismatch | Tạo `INCIDENT-NNN`, dừng pipeline, **không** vòng về Customer, đẩy reviewer / platform-engineer |

Hook + schema validator phải phân biệt được hai loại **trước khi** gọi `customer-liaison` — Customer không cần biết MCP timeout. `intake-inspector` chỉ nhận material defects.

---

## 8. Đặc tả định dạng Spec (chặt chẽ)

Đây là phần cốt lõi của Phase 1. Mỗi spec artifact = **một file** dưới `specs/`, gồm **YAML frontmatter** (machine-validated bằng JSON Schema) + **thân Markdown** (rationale, mô tả cho người đọc). Phần frontmatter là "hợp đồng" — chặt, không nhập nhằng; phần thân là diễn giải.

### 8.1 Quy ước Stable ID

```
<TYPE>-<DOMAIN>-<NNN>
```

- `TYPE` ∈ { `ENT`, `FEAT`, `REQ`, `NFR`, `API`, `SCHEMA`, `AC`, `PROJECT`, `SDD` }
- `DOMAIN` — viết hoa, ngắn, ổn định (vd `AUTH`, `ORDER`, `BILLING`)
- `NNN` — số tăng dần, không tái dùng

Ví dụ: `ENT-USER`, `FEAT-CHECKOUT`, `REQ-AUTH-001`, `API-ORDER-CREATE`, `SCHEMA-ORDER`.

**Luật ID (cưỡng chế bằng hook):**

- **SR1** — ID là duy nhất toàn repo.
- **SR2** — ID bất biến: đổi tên = tạo ID mới + `supersedes` ID cũ; ID cũ chuyển `deprecated`, không xóa.
- **SR3** — Không reference mồ côi: mọi relation phải trỏ tới ID tồn tại.

### 8.2 Các loại artifact & schema frontmatter

Mọi artifact dùng các trường chung:

```yaml
id:        REQ-AUTH-001        # bắt buộc, khớp grammar §8.1
type:      requirement         # bắt buộc, ∈ enum
title:     "Đăng nhập bằng email + mật khẩu"
status:    approved            # draft | approved | deprecated
version:   1.2.0               # semver của riêng artifact
owner:     team-identity
created:   2026-05-01
updated:   2026-06-04
tags:      [auth, security]
relations:                     # cạnh của spec-side graph
  refines:    [FEAT-AUTH]
  depends_on: [ENT-USER, SCHEMA-CREDENTIAL]
  supersedes: []
```

**Quan hệ (relations) hợp lệ:**

| Quan hệ | Ý nghĩa |
|---|---|
| `refines` | Artifact này cụ thể hóa một artifact cấp cao hơn (REQ refines FEAT). |
| `depends_on` | Cần artifact khác tồn tại/đúng để có nghĩa. |
| `satisfies` | (NFR) thỏa một mục tiêu/budget. |
| `verifies` | (AC) kiểm chứng một REQ/API. |
| `supersedes` | Thay thế một ID đã deprecate. |

#### 8.2.1 `ENT` — Domain entity

```yaml
id: ENT-USER
type: entity
title: "User"
version: 2.0.0
fields:
  - { name: id,    type: uuid,   required: true,  pk: true }
  - { name: email, type: string, required: true,  unique: true, format: email }
  - { name: status, type: enum, values: [active, suspended], required: true }
invariants:
  - "email là duy nhất toàn hệ thống"
  - "status không thể chuyển từ suspended sang active nếu thiếu admin approval"
```

#### 8.2.2 `FEAT` — Capability/Feature

```yaml
id: FEAT-CHECKOUT
type: feature
title: "Thanh toán giỏ hàng"
version: 1.0.0
relations:
  depends_on: [ENT-ORDER, ENT-USER]
```

Thân Markdown: mô tả mục tiêu nghiệp vụ, ngữ cảnh, ràng buộc — phần rationale.

#### 8.2.3 `REQ` — Functional requirement

```yaml
id: REQ-AUTH-001
type: requirement
title: "Đăng nhập bằng email + mật khẩu"
version: 1.2.0
priority: must            # must | should | could
relations:
  refines: [FEAT-AUTH]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-AUTH-001-01
    given: "user đã đăng ký với email hợp lệ"
    when:  "submit đúng email + mật khẩu"
    then:  "trả về session token hợp lệ, status 200"
  - id: AC-AUTH-001-02
    given: "user nhập sai mật khẩu 5 lần"
    when:  "submit lần thứ 6"
    then:  "khóa tài khoản tạm thời, status 429"
```

#### 8.2.4 `NFR` — Non-functional requirement

```yaml
id: NFR-PERF-001
type: nfr
title: "Độ trễ p95 endpoint đăng nhập"
version: 1.0.0
relations: { satisfies: [FEAT-AUTH] }
budget:
  metric: latency_p95_ms
  threshold: 300
  measured_by: "load test 1000 rps"
```

#### 8.2.5 `API` — Interface contract

Hợp đồng API nhúng **OpenAPI fragment** — phần này chặt nhất vì codegen trực tiếp từ nó. Hỗ trợ **hai dạng** (chọn 1):

**Dạng A — inline** (cho hợp đồng nhỏ):

```yaml
id: API-ORDER-CREATE
type: api
title: "Tạo đơn hàng"
version: 1.1.0
relations: { depends_on: [SCHEMA-ORDER], refines: [FEAT-CHECKOUT] }
openapi:
  path: /orders
  method: POST
  request_schema_ref: SCHEMA-ORDER-CREATE-REQ
  response:
    "201": { schema_ref: SCHEMA-ORDER }
    "400": { schema_ref: SCHEMA-ERROR }
```

**Dạng B — external ref** (cho hợp đồng lớn, dễ review diff — giải quyết C5):

```yaml
id: API-ORDER-CREATE
type: api
title: "Tạo đơn hàng"
version: 1.1.0
relations: { depends_on: [SCHEMA-ORDER], refines: [FEAT-CHECKOUT] }
openapi_ref: ./openapi/order-create.yaml   # path relative tới file spec
openapi_path: /orders                       # path + method để định tuyến trong file ref
openapi_method: POST
```

File ngoài vẫn validate bằng cùng JSON Schema; semantic diff hash nội dung resolve được. **SR5** áp dụng cho cả hai dạng.

#### 8.2.6 `SCHEMA` — Data schema

Nhúng **JSON Schema** thuần — nguồn cho cả validation lẫn type generation.

```yaml
id: SCHEMA-ORDER
type: schema
title: "Order"
version: 1.0.0
json_schema:
  type: object
  required: [id, userId, items, total]
  properties:
    id:     { type: string, format: uuid }
    userId: { type: string, format: uuid }
    items:  { type: array, items: { $ref: "SCHEMA-ORDER-ITEM" } }
    total:  { type: number, minimum: 0 }
```

#### 8.2.7 `PROJECT` — Project / Stack profile (mới v0.3)

Khai báo **một** project: stack chọn, ràng buộc hạ tầng, NFR mức project. Là input chính cho S5 SDD Design. Một repo có **đúng một** `PROJECT` artifact ở `specs/project.md`.

```yaml
id: PROJECT-KEYSTONE-DEMO
type: project
title: "Keystone Phase 1 demo service"
version: 1.0.0
profile: web-service-ts-fastify    # tên profile từ catalog (§15.2)
profile_source: catalog            # catalog | custom_repo — Phase 1 ép = catalog (SR20)
# profile_source: custom_repo      # Phase 2+ ví dụ:
# custom_profile:
#   url: github.com/org/keystone-profile-foo
#   commit: a1b2c3d4...            # hash bắt buộc, chống supply-chain
stack:
  language:   typescript
  runtime:    node22
  http:       fastify
  validation: zod
  orm:        drizzle
  db:         { dev: sqlite, prod: postgres }
  test:       vitest
  adversarial_test: fast-check
  package_manager: pnpm
constraints:
  cloud: aws
  region: ap-southeast-1
  budget_tier: lean              # lean | standard | premium → ảnh hưởng NFR-COST
  team_size: 3
non_functional_defaults:
  latency_p95_ms: 300
  availability:   99.9
  rps_target:     1000
codegen_conventions:
  module_layout: feature-folder  # feature-folder | layered
  test_layout:   alongside       # alongside | parallel-tree
  error_format:  rfc7807
feedback_style: detailed         # concise | detailed | coaching — chọn template báo cáo cho Customer (§10.8)
rework:                          # tuỳ chỉnh chính sách rework chain (§7.5.1)
  k_self_default: 1
  k_self_overrides:
    S5: 2                        # LLM-driven SDD design
    S6: 2                        # LLM-driven codegen
    S7: 0                        # test suite đắt, không tự retry
  k_global: 5
  k_customer_reject_s5: 3
  k_customer_retry_s0: 5
  on_global_exceeded: incident   # incident | pause-for-reviewer | continue-with-warning
  rework_token_budget_pct: 30    # cap kép cùng K_global: hết quota nào trước thì dừng
```

**Quy tắc:**

- **SR10** — Mỗi repo có đúng 1 `PROJECT` artifact. Thiếu → S0 fail (IQ8).
- **SR11** — `profile` phải thuộc catalog (§15.2) hoặc khai báo profile tùy chỉnh với schema `PROJECT-PROFILE-CUSTOM` (Phase 2).
- **SR12** — Đổi `stack.*` là breaking ở mức project: cần ADR `kind: project-stack-change`, semver major bump.
- **SR13** — Spec mới phải tương thích `stack` của project (vd cấm `API` định dạng gRPC khi `http: fastify`); IQ7 (S0) chặn.
- **SR18** — `rework` là **tùy chọn**; thiếu = framework default (§7.5.1). Khi khai báo, mọi key dưới `rework.*` validate theo schema; `k_self_overrides.S7 ∈ {0,1}` (bảo vệ chi phí test); `rework_token_budget_pct ∈ [10, 60]`; `on_global_exceeded ∈ {incident, pause-for-reviewer, continue-with-warning}`. Đổi `rework` không phải breaking ở mức project (không ảnh hưởng spec/code) — chỉ minor bump.
- **SR19** — `feedback_style ∈ {concise, detailed, coaching}` (§10.8); thiếu = `detailed`. Đổi `feedback_style` là **cosmetic** ở project (chỉ ảnh hưởng nội dung báo cáo, không ảnh hưởng cấu trúc spec/code) — không bump version.
- **SR20** — `profile_source ∈ {catalog, custom_repo}`; thiếu = `catalog`. **Phase 1 cưỡng chế `catalog`** (S0 IQ8 fail nếu `custom_repo`). Phase 2 mở `custom_repo` qua certification gate §15.4. Khi `custom_repo` thì `custom_profile.url` + `custom_profile.commit` (full sha) bắt buộc; thiếu commit hash → fail (chống supply-chain attack).

**Vì sao tùy chỉnh theo project (không hard-code framework):** mỗi project có maturity / budget tier / domain criticality / team skill mix khác nhau. Cùng một bộ K không hợp với tất cả.

| Tình huống project | Gợi ý điều chỉnh |
|---|---|
| Phase 0/1, team mới học framework | Mặc định (K_global=5, K_customer_retry_s0=5) — cho đường cong học |
| Phase 2+ team thuần thục | Hạ `k_customer_retry_s0: 3`, giữ K_global=5 — cưỡng chế kỷ luật, fail-fast |
| Safety/financial domain | `k_global: 2`, `on_global_exceeded: pause-for-reviewer` — mọi rework đáng kể có người duyệt |
| Internal tooling / prototype | `k_global: 8`, `on_global_exceeded: continue-with-warning` — cho LLM iterate kỹ |
| `budget_tier: lean` | Hạ `k_global: 3` + `rework_token_budget_pct: 20` — chống đốt token |
| `budget_tier: premium` | Nâng `k_global: 7` + `k_self_overrides.S5: 3, S6: 3` — đổi token lấy chất lượng thiết kế |

#### 8.2.8 `SDD-*` — Software Design Document (mới v0.3)

SDD là **artifact thiết kế dẫn xuất** từ (spec ∩ project profile), nằm giữa spec và code. Customer duyệt SDD ở G_SDD trước khi codegen. SDD do `sdd-designer` subagent sinh, **không sửa tay** (cấm tương tự code dẫn xuất).

**Bốn dạng SDD:**

| ID | Mô tả | Sinh từ |
|---|---|---|
| `SDD-ARCH-<DOMAIN>` | Quyết định kiến trúc cấp domain | FEAT + PROJECT |
| `SDD-COMP-<FEAT-ID>` | Phân rã thành component (controller/service/repository) | FEAT + REQ + PROJECT.codegen_conventions |
| `SDD-DATA-<ENT-ID>` | Schema bảng + index + migration plan | ENT + PROJECT.stack.orm + db |
| `SDD-API-IMPL-<API-ID>` | Route registration, middleware chain, error mapping | API + PROJECT.stack.http |

```yaml
id: SDD-COMP-FEAT-CHECKOUT
type: sdd
title: "Component breakdown — Checkout"
version: 1.0.0
status: approved                    # draft | proposed | approved | rejected | superseded
derived_from:                       # spec inputs
  features: [FEAT-CHECKOUT]
  requirements: [REQ-ORDER-001, REQ-PAYMENT-001]
  project: PROJECT-KEYSTONE-DEMO
components:
  - name: OrderController
    layer: controller
    owns_apis: [API-ORDER-CREATE]
    depends: [OrderService]
    ownership_id: API-ORDER-CREATE
  - name: OrderService
    layer: service
    owns_logic: [REQ-ORDER-001]
    depends: [OrderRepository, PaymentClient]
    ownership_id: REQ-ORDER-001
  - name: OrderRepository
    layer: repository
    owns_data: [ENT-ORDER]
    ownership_id: ENT-ORDER
sequencing:
  - "client → OrderController.create → validate(zod from SCHEMA-ORDER-CREATE-REQ)"
  - "OrderController → OrderService.placeOrder"
  - "OrderService → PaymentClient.charge (async, retry x3)"
  - "OrderService → OrderRepository.persist (transactional)"
risks:
  - "PaymentClient timeout cascading vào OrderService — cần circuit breaker"
open_questions: []                  # phải rỗng để G_SDD approve
customer_approval:
  approved_by: spec-author@team
  approved_at: 2026-06-04T14:20:00Z
  approval_run_id: run-2026-06-04-002
```

**Quy tắc SDD:**

- **SR14** — SDD `status: approved` là điều kiện cần để S6 (codegen) chạy.
- **SR15** — Đổi spec mà ảnh hưởng SDD đã approve → SDD chuyển `superseded`, sinh SDD mới `draft`, vòng lại G_SDD.
- **SR16** — `open_questions` không rỗng ⇒ không thể chuyển `approved`.
- **SR17** — SDD có `ownership_id` mapping mọi component về spec ID — input cho `ownership.yaml` (§9.5.1).

### 8.3 Validation

- **SR4** — Toàn bộ frontmatter validate bằng JSON Schema bộ (`spec-schema.json`) trước khi merge.
- **SR5** — `API`/`SCHEMA` validate cú pháp OpenAPI/JSON Schema; mọi `*_ref`/`schema_ref`/`openapi_ref` phải resolve được.
- **SR6** — Mọi `REQ` (priority `must`) phải có tối thiểu một `acceptance_criterion`.

### 8.4 Spec evolution operations (giải quyết C10)

Stable ID (SR2) cấm rename/xóa, nhưng spec thật phải tiến hóa. Phase 1 hỗ trợ 5 thao tác tiến hóa, mỗi thao tác có ngữ nghĩa rõ trên trace graph và rule cho semver:

| Thao tác | Cú pháp | Hiệu ứng trace | Semver |
|---|---|---|---|
| **deprecate** | đặt `status: deprecated` trên artifact cũ | Code/test của ID cũ chuyển trạng thái "quarantine", không xóa | Major bump ID cũ |
| **supersede** | tạo ID mới + `relations.supersedes: [OLD-ID]`; OLD-ID đặt `deprecated` | Trace cũ chuyển sang ID mới; downstream phải re-target qua `replace_refs` migration | Major bump ID mới; ID cũ kết thúc |
| **split** | `OLD-ID` deprecate, tạo `NEW-ID-A`, `NEW-ID-B` cùng có `supersedes: [OLD-ID]` + tag `split_role` (vd `extracted_from`) | Downstream ref phải khai báo target nào trong ADR | Major |
| **merge** | tạo `NEW-ID` với `supersedes: [OLD-A, OLD-B]`, cả OLD-A/B deprecate | Trace của cả hai ID cũ gộp vào ID mới | Major |
| **rename domain** | KHÔNG hỗ trợ trực tiếp — buộc dùng `supersede` (ID mới = grammar mới) | — | — |

**Quy tắc (cưỡng chế qua `spec-lint`):**

- **SR7** — Bất kỳ thao tác `supersedes` phải đi kèm ADR riêng (kiểu `evolution`) liệt kê mọi downstream cần migrate.
- **SR8** — Sau N (mặc định 2) phiên bản spec kể từ khi `deprecated`, ID phải đạt trạng thái `retired`: pipeline xóa code/test dẫn xuất, trace chuyển vào `.trace/retired.json` (không xóa lịch sử).
- **SR9** — Cấm tạo artifact mới với ID khớp ID đã `retired` (chống đụng tên).

Skill `spec-evolution` (semi-automated) hướng dẫn Spec Author thực thi các thao tác trên: sinh `supersedes` đúng cấu trúc, đề xuất mapping downstream, tạo skeleton ADR.

### 8.5 Bảng phân loại semantic-diff (chốt Q4 v0.6)

`semantic-diff` skill (§9.4) gán mỗi thay đổi 1 trong 3 nhãn: `breaking` | `additive` | `cosmetic`. Bảng dưới là **luật cứng** áp dụng theo (artifact type × field × thao tác). Mặc định khi không match rule nào ⇒ **breaking** (recall > precision — chống bỏ sót lan ngầm; tuning xuống `additive` sau khi có data trên ≥ 30 thay đổi thật).

#### 8.5.1 Bảng cứng

| Artifact | Thao tác | Nhãn | Ghi chú |
|---|---|---|---|
| **SCHEMA** | thêm field `required: true` | **breaking** | Consumer cũ không cung cấp được |
| | thêm field optional | additive | |
| | xóa field bất kỳ | **breaking** | |
| | đổi `type` field | **breaking** | |
| | thêm field vào mảng `required[]` | **breaking** | |
| | xóa field khỏi mảng `required[]` | additive | Nới ràng buộc |
| | thêm enum value | additive | |
| | xóa enum value | **breaking** | |
| | siết `format`/`pattern`/`minimum`/`maximum`/`maxLength` | **breaking** | Giá trị cũ có thể fail |
| | nới `format`/`pattern`/`minimum`/`maximum`/`maxLength` | additive | |
| **API** | đổi `path` hoặc `method` | **breaking** | |
| | đổi `request_schema_ref` | delegate | Phân loại theo diff SCHEMA target |
| | đổi `response.<code>.schema_ref` | delegate | Như trên |
| | thêm response code mới | additive | |
| | xóa response code | **breaking** | |
| | thêm query/header/path param required | **breaking** | |
| | thêm query/header param optional | additive | |
| | đổi auth requirement (thêm/đổi scope) | **breaking** | |
| | nới auth (bỏ scope) | additive | |
| **REQ** | sửa AC `then` siết hành vi | **breaking** | Code cũ pass có thể fail |
| | sửa AC `then` nới hành vi | additive | |
| | sửa AC `given` hoặc `when` | **breaking** | Đổi tiền điều kiện |
| | thêm AC mới | additive | |
| | xóa AC | **breaking** | |
| | đổi `priority` must→should/could | additive | |
| | đổi `priority` should/could→must | **breaking** | |
| **ENT** | thêm field `required: true` | **breaking** | |
| | thêm field optional | additive | |
| | xóa field | **breaking** | |
| | thêm/siết `invariant` | **breaking** | |
| | nới/xóa `invariant` | additive | |
| | đổi `type` field | **breaking** | |
| **NFR** | siết `budget.threshold` (số nhỏ hơn cho latency, lớn hơn cho throughput) | **breaking** | |
| | nới `budget.threshold` | additive | |
| | đổi `budget.metric` | **breaking** | |
| | đổi `measured_by` (mô tả phương pháp đo) | cosmetic | Nội dung tài liệu |
| **FEAT** | đổi `title`, body Markdown (rationale) | cosmetic | |
| | thêm `depends_on` | additive | Phải resolve được |
| | xóa `depends_on` | **breaking** | Downstream giả định có dependency |
| **PROJECT** | đổi `stack.*` | **breaking** | SR12 |
| | đổi `codegen_conventions.*` | **breaking** | Đổi file layout |
| | đổi `rework.*` | cosmetic | SR18 — không ảnh hưởng spec/code |
| | đổi `feedback_style` | cosmetic | SR19 |
| | đổi `non_functional_defaults.*` | delegate | Theo NFR rule trên |
| | đổi `constraints.budget_tier` | additive | Chỉ ảnh hưởng tuning, không spec |
| **SDD** | mọi sửa | cosmetic | SDD là dẫn xuất — breaking-ness đến từ spec gốc qua FR-SDD-07 |
| **Chung** (mọi artifact) | sửa `title`, `tags`, `owner`, `updated`, body rationale | cosmetic | |
| | thêm `relations.refines`/`satisfies` | additive | |
| | xóa `relations.refines`/`satisfies` | **breaking** | Mất liên kết truy nguyên |
| **Bất kỳ kết hợp khác** | — | **breaking** (default) | Log `combo_signature` cho Phase 0 telemetry → tuning sau |

#### 8.5.2 Quy tắc xử lý

- **Combo theo file**: 1 file spec có nhiều thay đổi → nhãn = max severity (breaking > additive > cosmetic).
- **Combo theo batch**: impact report tổng hợp nhiều file → `classification` = max severity toàn batch.
- **`delegate`** ⇒ semantic-diff resolve sang artifact target rồi áp lại bảng; nếu target không tồn tại (orphan) → coi như **breaking** + raise IQ4 (S0).
- **`cosmetic` không yêu cầu ADR** (FR-GOV-02). `additive` cần ADR `kind: change`. `breaking` cần ADR + G9 (§12).
- **Tuning sau Phase 0**: skill `semantic-diff` ghi `combo_signature` (artifact-type + fields-changed + ops) vào `.keystone/diff-log.json`. Sau ≥ 30 run thật, review nhóm "default-fallback breaking" — chuyển xuống `additive` nếu data cho thấy 0 incident liên quan.

#### 8.5.3 Trường hợp cạnh chưa rõ (giữ default = breaking, đo rồi chốt)

- Đổi `format: email` → `format: uri` (cùng `type: string` nhưng đổi semantic format): hiện = breaking; sau khi đếm tần suất + incident sẽ quyết.
- Đổi description trong `enum` value (nhãn UX, không đổi value): hiện cosmetic; nếu UI consumer hard-code description → breaking.
- `supersede` đơn vs `split` qua nhiều `supersedes` cùng artifact: hiện cả hai = breaking; combo tuning sau.

---

## 9. Yêu cầu chức năng (FR)

### 9.0 Intake QC layer (S0 — mới v0.3)

S0 là **chốt chặn đầu vào**: trước khi nguyên liệu spec đi vào dây chuyền, phải đạt 8 tiêu chí intake (IQ1–IQ8). Mục tiêu: bắt lỗi sớm, tránh để spec rác đi tới S6 mới lộ.

- **FR-INTAKE-01** — `intake-qc` skill chạy ngay khi `/spec-change` invoke; điều kiện vào: có ≥ 1 spec file diff vs base + `PROJECT` artifact tồn tại.
- **FR-INTAKE-02** — Chạy 8 kiểm tra intake **bên cạnh** SR1–SR9 (spec-lint syntax):

| Mã | Tên | Điều kiện pass |
|---|---|---|
| **IQ1** | Completeness | REQ `priority: must` có ≥ 1 AC; FEAT có ≥ 1 REQ refines; ENT có ≥ 1 invariant; API có request + ≥ 1 response schema; SDD có components không rỗng. |
| **IQ2** | Clarity | AC theo Given/When/Then đúng cú pháp; cấm token `TBD`/`TODO`/`???` trong frontmatter; mọi enum value mô tả ít nhất 3 ký tự. |
| **IQ3** | Feasibility | Mọi `depends_on` resolve được; không yêu cầu mâu thuẫn với `invariants` của ENT đã tồn tại; không yêu cầu vượt NFR budget của project. |
| **IQ4** | Resolvability | Mọi `*_ref`, `schema_ref`, `openapi_ref` resolve được tới ID tồn tại / file đọc được. |
| **IQ5** | Semver consistency | `version` bump khớp loại thay đổi (semantic-diff phân loại): breaking → major, additive → minor, cosmetic → patch. Lệch → fail. |
| **IQ6** | NFR measurability | NFR có `budget.metric` + `budget.threshold` số định lượng + `measured_by` mô tả phương pháp đo. Cấm NFR mơ hồ ("nhanh", "ổn định"). |
| **IQ7** | Project compatibility | `API.openapi.method` ∈ HTTP methods (nếu `PROJECT.stack.http`); `SCHEMA` không dùng type không hỗ trợ bởi `PROJECT.stack.validation`; `ENT` không yêu cầu DB feature ngoài `PROJECT.stack.db`. |
| **IQ8** | Project artifact present | `PROJECT` artifact tồn tại + version `approved`. |

- **FR-INTAKE-03** — Khi bất kỳ IQ fail → **không** tiếp tục S1; thay vào đó gọi skill `feedback-report` sinh báo cáo có cấu trúc, gọi subagent `customer-liaison` định dạng + đưa về Customer.
- **FR-INTAKE-04** — Báo cáo có cấu trúc gồm: ID + trường + dòng + tiêu chí thất bại + **gợi ý sửa cụ thể** (do `intake-inspector` đề xuất qua LLM). Format chuẩn `intake-report.json` (§10.5).
- **FR-INTAKE-05** — Pipeline **pause** ở trạng thái `awaiting-customer`; ghi `.keystone/run-state.json`. Customer sửa spec + chạy lại `/spec-change resume <run-id>` hoặc tạo PR mới (cả hai đường đều khởi động lại từ S0).
- **FR-INTAKE-06** — Mọi vòng intake (số lần Customer rớt + retry) ghi vào `M8` (§16) — đo "chi phí intake" mỗi project.
- **FR-INTAKE-07** — Khi `PROJECT` artifact tự thay đổi (đổi stack): S0 chạy chế độ đặc biệt "project-bootstrap" — kiểm tra compatibility cho **toàn bộ** specs hiện hữu (không chỉ diff), liệt kê những spec sẽ phải refactor.

### 9.1 Spec layer

- **FR-SPEC-01** — Hệ thống đọc spec từ `specs/` dạng file YAML-frontmatter + Markdown.
- **FR-SPEC-02** — Hệ thống validate frontmatter theo schema bộ và báo lỗi định vị tới ID + trường cụ thể.
- **FR-SPEC-03** — Hệ thống dựng spec-side graph từ `relations` và phát hiện reference mồ côi / chu trình không hợp lệ.

### 9.2 Traceability layer

- **FR-TRACE-01** — Mỗi derived artifact mang annotation provenance (vd `// @implements REQ-AUTH-001`) **và** một entry trong trace index.
- **FR-TRACE-02** — Hệ thống truy vấn được hai chiều: từ spec ID → mọi code/test/doc; từ file/symbol → spec ID quản nó.
- **FR-TRACE-03** — Trace index do máy sinh, không bao giờ sửa tay; cập nhật sau mỗi lần pipeline chạy (`PostToolUse` hook).
- **FR-TRACE-04** — Hệ thống phát hiện drift: code/test không khớp trace index hoặc thiếu provenance.

### 9.3 Governance layer

- **FR-GOV-01** — Mọi thay đổi spec đi qua một PR; không có đường merge trực tiếp vào nhánh chính.
- **FR-GOV-02** — Mỗi thay đổi spec có ý nghĩa (≠ cosmetic) bắt buộc kèm một ADR (§10.2).
- **FR-GOV-03** — `spec-lint` chặn merge nếu vi phạm SR1–SR6.
- **FR-GOV-04** — Version artifact bump theo semver tương ứng phân loại thay đổi (breaking → major, additive → minor, cosmetic → patch).
- **FR-GOV-05** — Hook `PreToolUse` chặn (exit code 2) mọi `Write`/`Edit` vào thư mục code dẫn xuất nếu không phát sinh từ pipeline.

### 9.4 Impact analysis layer

- **FR-IMP-01** — Khi spec đổi, hệ thống tính **semantic diff theo ID** trả về tập {added, modified, removed, deprecated} ID kèm trường nào đổi.
- **FR-IMP-02** — Hệ thống đi dọc traceability graph để liệt kê artifact/feature/test/spec downstream bị ảnh hưởng.
- **FR-IMP-03** — Hệ thống phân loại mỗi thay đổi: `additive` | `breaking` | `cosmetic`, kèm mức rủi ro.
- **FR-IMP-04** — Hệ thống sinh **impact report** (§10.3) đính kèm PR.

### 9.4.5 SDD Design layer (S5 — mới v0.3)

S5 là **trạm thiết kế trung gian** giữa spec và code. Mục tiêu: bắt sai-thiết-kế trước khi tốn token codegen; cho Customer cơ hội duyệt thiết kế ở mức "ý định triển khai" thay vì đọc code thành phẩm.

- **FR-SDD-01** — Khi S4 sinh impact report ảnh hưởng ≥ 1 FEAT/REQ/API/ENT, `sdd-designer` subagent đọc (spec slice + PROJECT artifact + SDD hiện hữu liên quan) và sinh hoặc cập nhật SDD artifact tương ứng (§8.2.8).
- **FR-SDD-02** — SDD lưu ở `specs/sdd/SDD-*.md`, frontmatter `status: draft`; phải qua `sdd-review` skill mới chuyển `proposed`.
- **FR-SDD-03** — `sdd-review` skill kiểm tra: (a) mọi `derived_from` ID tồn tại + spec_version khớp impact report; (b) mọi component có `ownership_id` resolve được; (c) `open_questions: []`; (d) `risks` không rỗng (bắt buộc liệt kê — không cho phép thiết kế "không có rủi ro").
- **FR-SDD-04** — `customer-liaison` subagent trình SDD cho Customer ở dạng dễ đọc (Markdown rendered + diagram nếu có), không phải raw YAML. Customer phản hồi qua 3 slash command (đầy đủ ở §18.5 customer touchpoint):
  - `/keystone:S5:approve <SDD-ID>` → status `approved` + ghi `customer_approval` block
  - `/keystone:S5:reject <SDD-ID> --category <c> --reason "<msg>"` → status `rejected`; **bắt buộc** `--category` theo FR-SDD-09; định tuyến theo bảng category → S0 / S4 / tự retry / escalate
  - `/keystone:S5:request-change <SDD-ID> --note "<msg>"` → status quay về `draft` + note attached → `sdd-designer` chạy lại (không tính K_self — human input)
- **FR-SDD-05** — Cổng **G_SDD** chỉ xanh khi **mọi** SDD bị ảnh hưởng có `status: approved` + `customer_approval.approval_run_id` khớp run hiện tại.
- **FR-SDD-06** — SDD và spec luôn có quan hệ N:1 (một spec FEAT có thể tạo nhiều SDD-COMP); trace index ghi cả hai chiều (§10.1).
- **FR-SDD-07** — Khi spec đổi mà ảnh hưởng SDD đã `approved` (semantic-diff phát hiện), SDD chuyển `superseded`, một SDD mới `draft` được sinh; vòng lại G_SDD. Customer chỉ duyệt **diff** SDD mới vs cũ (không phải đọc lại từ đầu).
- **FR-SDD-08** — Pipeline lưu trữ "playback" của S5: cặp (spec input slice, SDD output) làm corpus học tập + audit; có thể replay để debug "tại sao SDD lại đề xuất kiến trúc X".
- **FR-SDD-09 — Reject loop policy & reviewer triage** (chốt Q9 v0.7). Khi Customer reject SDD, **bắt buộc** khai báo `reject_reason.category ∈ { spec-misalignment, impact-misanalysis, design-quality, customer-changed-mind, infeasibility }` qua `--reason "<msg>" --category <c>`. Định tuyến tự động:

  | Category | Hành động | Đếm vào `K_customer_reject_s5`? |
  |---|---|---|
  | `spec-misalignment` | chain về S0 (Customer sửa spec) | có |
  | `impact-misanalysis` | chain về S4 (rerun impact) | có |
  | `design-quality` | tự retry sdd-designer với feedback | có |
  | `customer-changed-mind` | tự retry sdd-designer | có (chống rubber-band vô hạn) |
  | `infeasibility` | escalate reviewer triage ngay (skip K count) | — |

  **Pre-escalate**: nếu 2 reject liên tiếp cùng `category` → escalate ngay ở reject 2 (không đợi đủ K) — vì đoán mò thêm 1 lần = đốt token vô ích.

  **Khi đạt `K_customer_reject_s5`** (hoặc pre-escalate trigger) → pipeline chuyển state `awaiting-reviewer-triage` (§18.1), notify reviewer (§18.6). Reviewer chọn **1 trong 4 path**:

  - **Path A — Spec-rewrite session** (`/keystone:S5:route-to-spec`): reviewer + Customer co-author lại spec; pipeline chain S5→S0 với token `triage-spec-rewrite` (K_customer_retry_s0 reset cho session này). Sau khi spec mới qua S0–S4 trở lại S5, nếu SDD mới **vẫn reject lần đầu** → INCIDENT (đã rewrite spec mà fail = lỗi hệ thống thiết kế).
  - **Path B — Reviewer takeover SDD** (`/keystone:S5:reviewer-takeover`): reviewer + customer-liaison join session, ghi direction; sdd-designer redraft theo direction. Reviewer-takeover **chỉ có 2 attempt**; thất bại cả 2 → INCIDENT.
  - **Path C — Declare infeasible** (`/keystone:S5:declare-infeasible --reason "..."`): chốt spec không khả thi với scope hiện tại → INCIDENT `S5-infeasible`, dừng run, đẩy backlog re-scoping. ADR `kind: change` bắt buộc khi reopen.
  - **Path D — Reset budget** (`/keystone:rework:reset --reason "..."`, chỉ reviewer): chỉ dùng khi root cause là bug platform (sdd-designer flake / MCP timeout), **không** dùng cho lỗi nội dung. Audit log dày.

  **Loop prevention cứng**: tổng (path A retry + path B retry + reset budget) ≤ 5 per spec-change run. Vượt → INCIDENT bất chấp path đang chọn, không vòng tiếp.

### 9.5 Production line

- **FR-GEN-01** — Pipeline chỉ sinh/sửa code cho **lát cắt bị ảnh hưởng** theo impact report (surgical, không regen toàn bộ). Input chính là **SDD đã approve** + spec slice; **không** đi tắt từ spec → code.
- **FR-GEN-02** — Code sinh ra theo mô hình **file-ownership theo ID** (§9.5.1) để giới hạn vùng tái sinh; ownership lấy từ `ownership_id` trong SDD components (§8.2.8 SR17); **không** dùng comment region-marker trong Phase 1.
- **FR-GEN-03** — Pipeline sinh test từ `acceptance_criteria` (Given/When/Then → test thực thi); test runner + assert lib từ `PROJECT.stack.test`.
- **FR-GEN-04** — Pipeline sinh type/model từ `SCHEMA` và route/handler skeleton từ `API` (OpenAPI/JSON Schema làm nguồn); cấu trúc thư mục + naming theo `PROJECT.codegen_conventions`.
- **FR-GEN-05** — Pipeline cập nhật doc dẫn xuất (vd API reference) khi `API`/`SCHEMA` đổi.
- **FR-GEN-06** — Mỗi artifact sinh ra gắn provenance (FR-TRACE-01, gồm cả `@sdd-source SDD-COMP-...`) và được ghi vào trace index.
- **FR-GEN-07** — Adversarial-tester (§14 R8) sinh test bằng đường độc lập với implementer: chỉ đọc thân Markdown rationale + acceptance criteria, **không thấy code đã sinh và không thấy SDD**. Mục đích: bắt sai lệch ngữ nghĩa giữa cách implementer/SDD và test-author hiểu spec.

#### 9.5.1 File-ownership theo ID (chốt Q3, giải quyết C2)

Phase 1 chọn **file-ownership 1:1** thay vì AST/region-anchor — đánh đổi linh hoạt lấy bất biến cứng. AST-based để Phase 2.

**Quy tắc:**

- **FO1** — Mỗi spec ID dẫn xuất code được khai báo sở hữu một tập file/symbol cố định trong `.trace/ownership.yaml`. Ví dụ:
  ```yaml
  REQ-AUTH-001:
    owns:
      - src/auth/login.ts
      - tests/auth/login.spec.ts
      - docs/api/auth/login.md
  API-ORDER-CREATE:
    owns:
      - src/orders/create-route.ts
      - tests/orders/create-route.spec.ts
  SCHEMA-ORDER:
    owns:
      - src/types/order.ts
      - src/schemas/order.ts
  ```
- **FO2** — Một file thuộc về **đúng một** ID. Không chồng chéo. Hook `PreToolUse` chặn ghi file vượt phạm vi ID đang xử lý trong run hiện tại.
- **FO3** — File "shared" (utility, framework setup) **không thuộc về spec ID nào** và do đó **không nằm trong** thư mục dẫn xuất `src/generated/`. Chúng đặt ở `src/lib/` (được sửa tay, không qua pipeline).
- **FO4** — Khi spec evolution chia/gộp ID (§8.4), `ownership.yaml` phải cập nhật cùng PR; spec-lint chặn nếu lệch.
- **FO5** — Trace index (§10.1) và `ownership.yaml` là hai mặt cùng một đồng tiền: index = runtime view (có hash, version), ownership = static declaration. Inconsistent → drift-check fail.

**Hệ quả:** quá khắt khe cho một số file đa-ID (vd một controller phục vụ 3 REQ). Workaround: tách thành 3 file/handler hoặc tạo `FEAT` cấp cao sở hữu file đó. Đây là tradeoff đã chấp nhận cho Phase 1.

### 9.6 Verification layer

- **FR-VER-01** — Pipeline chạy: acceptance test (mới + liên quan), regression suite, snapshot test, drift-check, spec-lint, adversarial-test (§14 R8).
- **FR-VER-02** — Pipeline **chỉ commit khi toàn bộ cổng (§12) pass**.
- **FR-VER-03** — Khi pass, pipeline tự commit với message chứa: ID thay đổi, ADR ref, danh sách artifact đụng tới, version bump, tổng chi phí token (NFR-COST-01).
- **FR-VER-04** — Khi fail, pipeline dừng, không commit, để lại báo cáo lỗi định vị tới cổng + ID gây fail; workdir giữ nguyên để debug.

### 9.7 Drift resolution policy (giải quyết C7)

Drift = sai lệch giữa code/test thực tế và trace index hoặc `ownership.yaml`. Phase 1 phân drift thành 3 tier với xử lý khác nhau:

| Tier | Phát hiện ở | Nguồn gốc thường gặp | Xử lý |
|---|---|---|---|
| **T1 — In-flight** | Trong cùng pipeline run (sau codegen, trước commit) | LLM tạo file ngoài ownership hoặc thiếu provenance | **Pipeline tự sửa**: chạy `trace-update` + bổ sung provenance; nếu vẫn lệch → fail G6/G7, dừng commit |
| **T2 — At PR-time** | Hook chạy trên PR khi spec không đổi nhưng code đổi | Sửa tay ngoài luồng (rò rỉ qua editor IDE, merge nhánh khác, v.v.) | **Chặn merge**: PR fail; reviewer chọn 1 trong 2 (a) revert thay đổi tay, hoặc (b) nâng thành ADR + spec-change qua đường chính thức |
| **T3 — Post-merge / emergency** | Phát hiện sau khi đã commit (drift scan định kỳ hoặc incident) | Hot-fix sản xuất khẩn cấp đi tắt qua hook (escape hatch NG2) | **Quarantine**: tạo `INCIDENT-NNN`, gắn cờ ID liên quan, yêu cầu spec-sync ADR trong **≤ 72 giờ**. Quá hạn → spec-lint fail toàn repo, block mọi PR mới cho tới khi sync |

**Escape hatch (NG2) chính thức hóa:**

- **FR-ESC-01** — Tồn tại lệnh `keystone bypass --reason <ADR-DRAFT-ID>` cho phép ghi vào file dẫn xuất trong **một session**, ghi audit log vào `.keystone/bypass.log`.
- **FR-ESC-02** — Bypass tự động tạo issue tracker (qua MCP nếu cấu hình) yêu cầu spec-sync.
- **FR-ESC-03** — Hook commit từ bypass session bắt buộc message chứa `[BYPASS: <ADR-DRAFT-ID>]` để dễ truy vết.
- **FR-ESC-04** — Bypass không tắt G1/G6 (spec-lint + trace-consistent vẫn chạy trên phần spec liên quan); chỉ tắt G4/G5 (codegen-complete + test-pass) tạm thời.

---

## 10. Mô hình dữ liệu & artifacts

### 10.1 Trace index (`.trace/index.json`)

Format chuẩn hóa bằng `trace-index-schema.json` (JSON Schema 2020-12). Index do máy sinh, không phải nguồn merge (giải quyết C8): nếu merge conflict, pipeline regenerate từ git state + ownership manifest thay vì merge thủ công.

```json
{
  "$schema": ".keystone/trace-index-schema.json",
  "version": "1",
  "generated_at": "2026-06-04T10:00:00Z",
  "generator": "keystone@0.8.1",
  "spec_commit": "abc123…",
  "artifacts": {
    "REQ-AUTH-001": {
      "spec_path": "specs/auth/REQ-AUTH-001.md",
      "spec_version": "1.2.0",
      "spec_content_hash": "sha256:…",
      "implementations": ["src/auth/login.ts#handleLogin"],
      "tests": ["tests/auth/login.spec.ts#AC-AUTH-001-01"],
      "adversarial_tests": ["tests/auth/login.adversarial.spec.ts"],
      "derived_docs": ["docs/api/auth.md#login"],
      "last_synced": "2026-06-04T10:00:00Z",
      "last_run_id": "run-2026-06-04-001",
      "token_cost": { "input": 12453, "output": 4210, "usd": 0.18 }
    }
  }
}
```

Reverse index (code → spec) được dựng on-demand từ annotation + bảng trên + `ownership.yaml`.

### 10.2 Ownership manifest (`.trace/ownership.yaml`)

Khai báo file-ownership theo §9.5.1. Là **input** cho pipeline (không generated). Spec-lint kiểm tra:

- Mỗi file thuộc đúng 1 ID.
- Mọi ID có code dẫn xuất đều xuất hiện ở đây.
- Mọi file trong `src/generated/` (hoặc tương đương) phải được liệt kê.

```yaml
version: 1
ownership:
  REQ-AUTH-001:
    owns: [src/auth/login.ts, tests/auth/login.spec.ts]
  API-ORDER-CREATE:
    owns: [src/orders/create-route.ts, tests/orders/create-route.spec.ts]
  SCHEMA-ORDER:
    owns: [src/types/order.ts, src/schemas/order.ts]
```

### 10.3 ADR (`docs/adr/ADR-NNN.md`)

```yaml
id: ADR-014
title: "Thêm khóa tài khoản sau 5 lần sai mật khẩu"
status: accepted          # proposed | accepted | superseded
kind: change              # change | evolution | drift | bypass
date: 2026-06-04
affected_ids: [REQ-AUTH-001]
change_pr: "#142"
```

Thân: Context — Decision — Consequences. Trường `kind` cho phép phân loại ADR theo nguồn (thay đổi thường, evolution §8.4, drift §9.7, bypass §9.7).

### 10.4 Impact report (đính kèm PR)

```json
{
  "diff": {
    "modified": [{ "id": "REQ-AUTH-001", "fields": ["acceptance_criteria"] }],
    "added": [], "removed": [], "deprecated": []
  },
  "classification": "additive",
  "risk": "medium",
  "affected": {
    "features": ["FEAT-AUTH"],
    "code": ["src/auth/login.ts#handleLogin"],
    "tests": ["tests/auth/login.spec.ts"],
    "downstream_specs": ["NFR-PERF-001"],
    "downstream_sdd": ["SDD-COMP-FEAT-AUTH"]
  },
  "required_actions": ["ADR bắt buộc", "sinh AC-AUTH-001-02", "redraft SDD-COMP-FEAT-AUTH"]
}
```

### 10.5 Intake feedback report (`.keystone/intake-report.json`, mới v0.3)

Báo cáo có cấu trúc trả về Customer khi G0 fail. Format JSON để PR-bot render thành Markdown comment.

```json
{
  "$schema": ".keystone/intake-report-schema.json",
  "run_id": "run-2026-06-04-003",
  "verdict": "rejected",
  "summary": "3 spec rớt 4 tiêu chí intake. Sửa từng mục bên dưới rồi resume.",
  "items": [
    {
      "spec_path": "specs/auth/REQ-AUTH-002.md",
      "id": "REQ-AUTH-002",
      "criterion": "IQ1",
      "severity": "blocker",
      "field": "acceptance_criteria",
      "line": 18,
      "message": "REQ priority=must cần ≥ 1 acceptance_criterion",
      "suggestion": "Thêm AC dạng Given/When/Then; ví dụ mẫu trong specs/_examples/AC-template.md"
    },
    {
      "spec_path": "specs/auth/REQ-AUTH-002.md",
      "id": "REQ-AUTH-002",
      "criterion": "IQ5",
      "severity": "blocker",
      "field": "version",
      "line": 6,
      "message": "Đổi field bắt buộc (breaking) nhưng version chỉ bump minor 1.2.0 → 1.3.0",
      "suggestion": "Bump major: 1.2.0 → 2.0.0"
    }
  ],
  "next_action": "Customer sửa spec rồi chạy `keystone resume run-2026-06-04-003`."
}
```

### 10.6 SDD review thread (`.keystone/sdd-review-thread.json`, mới v0.3)

Lưu lịch sử trao đổi giữa Customer và pipeline ở S5 cho 1 run. Dùng cho audit + debug Customer reject loop (M9).

```json
{
  "run_id": "run-2026-06-04-003",
  "sdd_id": "SDD-COMP-FEAT-CHECKOUT",
  "events": [
    { "ts": "2026-06-04T14:00:00Z", "actor": "sdd-designer", "action": "draft", "sdd_version": "1.0.0-draft.1" },
    { "ts": "2026-06-04T14:05:00Z", "actor": "customer-liaison", "action": "present", "channel": "pr-comment" },
    { "ts": "2026-06-04T14:18:00Z", "actor": "customer:spec-author@team", "action": "request-change", "note": "Tách OrderService thành OrderService + PricingService" },
    { "ts": "2026-06-04T14:25:00Z", "actor": "customer:spec-author@team", "action": "reject", "category": "spec-misalignment", "note": "Spec không nêu rõ retry policy của PaymentClient", "reject_seq": 1 },
    { "ts": "2026-06-04T14:22:00Z", "actor": "sdd-designer", "action": "redraft", "sdd_version": "1.0.0-draft.2" },
    { "ts": "2026-06-04T14:30:00Z", "actor": "customer:spec-author@team", "action": "approve", "approval_run_id": "run-2026-06-04-003" }
  ]
}
```

### 10.7 Rework log (`.keystone/rework-log.json`, mới v0.4)

Ghi mọi vòng rework trong 1 run (UR7). Append-only trong scope run; reset mỗi run mới. Là nguồn cho metric M10 (§16) và là input cho UR8 khi chain quay về Customer.

```json
{
  "$schema": ".keystone/rework-log-schema.json",
  "run_id": "run-2026-06-04-005",
  "started_at": "2026-06-04T10:00:00Z",
  "rework_count": 3,
  "global_limit": 5,
  "events": [
    {
      "seq": 1,
      "ts": "2026-06-04T10:05:12Z",
      "from_station": "S6",
      "to_station": "S5",
      "trigger": "XQC-S6.X1",
      "category": "material",
      "reason": "implementer thiếu chi tiết về retry policy của PaymentClient",
      "feedback": { "sdd_id": "SDD-COMP-FEAT-CHECKOUT", "field": "sequencing", "hint": "Bổ sung circuit breaker spec" },
      "attempt_no": 1,
      "token_cost": { "input": 3200, "output": 1100 },
      "duration_ms": 4200
    },
    {
      "seq": 2,
      "ts": "2026-06-04T10:08:30Z",
      "from_station": "S5",
      "to_station": "S6",
      "trigger": "resume-after-rework",
      "category": "continuation",
      "attempt_no": 2
    },
    {
      "seq": 3,
      "ts": "2026-06-04T10:14:00Z",
      "from_station": "S7",
      "to_station": "S6",
      "trigger": "XQC-S7.fail_category=code-wrong",
      "category": "material",
      "reason": "G5 test fail: response shape không khớp SCHEMA-ORDER",
      "attempt_no": 1
    }
  ]
}
```

`category` ∈ `{ material, system, continuation, customer-input }`. `customer-liaison` lọc theo `material + chain-ends-at-S0` để tạo báo cáo gộp gửi Customer (UR8).

### 10.8 Feedback template & tone (chốt Q8 v0.6)

Mọi báo cáo gửi Customer (intake report §10.5, SDD review thread §10.6, rework escalation UR8) đi qua **một** trong 3 template theo `PROJECT.feedback_style` (§8.2.7, SR19). Mặc định `detailed`.

#### 10.8.1 Trường cốt lõi (mọi template)

```
header:
  run_id:           string
  verdict:          "rejected" | "request-change" | "needs-review"
  summary:          string  (≤ 120 ký tự)
  total_items:      number

per_item:
  spec_path:        string
  id:               string
  criterion:        string  (IQ1..IQ8 | SR1..SR20 | XQC-S_n.X_k | gate code)
  severity:         "blocker" | "warning" | "info"
  field:            string
  line:             number
  message:          string  (mô tả vi phạm)
  suggestion:       string  (cách sửa)

footer:
  next_action:      string  (Customer làm gì kế tiếp + lệnh cụ thể)
```

#### 10.8.2 Khác biệt giữa 3 template

| Trường bổ sung | `concise` | `detailed` (default) | `coaching` |
|---|---|---|---|
| `context` — vì sao tiêu chí tồn tại | ✗ | ✓ (1 câu) | ✓ (2–3 câu + ví dụ thường gặp) |
| `example_fix` — snippet YAML đề xuất | ✗ | ✓ | ✓ |
| `learning_link` — trỏ tới `specs/_examples/` hoặc docs | ✗ | ✗ | ✓ |
| Tone | mệnh lệnh, kỹ thuật | trung lập, có giải thích | hỗ trợ, dạy dỗ |
| Đối tượng phù hợp | team thuần thục, time-pressed | mặc định Phase 1 | team mới onboard / training |

#### 10.8.3 Ví dụ render cùng một vi phạm IQ5

**`concise`:**

```
REQ-AUTH-002 / IQ5 blocker / field:version line:6
  Bump major: 1.2.0 → 2.0.0 (đổi field required = breaking)
```

**`detailed`:**

```
REQ-AUTH-002 / IQ5 (semver consistency) — blocker
  Field: version, line 6
  Vấn đề: đổi field required là breaking nhưng version chỉ bump minor (1.2.0 → 1.3.0)
  Vì sao tiêu chí: SR12 + §8.5 buộc semver khớp phân loại để downstream consumer
                   tin được version range.
  Sửa:
       version: 2.0.0   # was 1.2.0
```

**`coaching`:**

```
REQ-AUTH-002 / IQ5 (semver consistency) — blocker
  Field: version, line 6

  Vấn đề
    Bạn đổi field required nhưng version chỉ bump minor (1.2.0 → 1.3.0).

  Vì sao tiêu chí tồn tại
    Spec-driven framework xem version là "hợp đồng" với code dẫn xuất + downstream
    consumer. Khi consumer kẹp version range `^1.2.0`, họ tin rằng mọi bản 1.x.y
    không phá. Đổi field required mà chỉ bump minor sẽ làm consumer build broken
    sau khi auto-update.

  Bối cảnh thường gặp
    Lỗi này hay xảy ra khi đang phát triển nhanh — thấy "chỉ đổi 1 field" nên
    không nghĩ là breaking. Bảng phân loại §8.5 giúp quyết: thêm field required
    luôn là breaking.

  Ví dụ sửa
       version: 2.0.0   # was 1.2.0

  Tham khảo
    specs/_examples/semver-bump-cheatsheet.md
```

#### 10.8.4 Áp dụng trong pipeline

- **S0 intake reject** (§10.5) — `customer-liaison` đọc `PROJECT.feedback_style` → render `intake-report.json` thành Markdown theo template tương ứng → đẩy PR comment.
- **S5 SDD review** (§10.6) — cùng cơ chế; mỗi event `present`/`request-change` của Customer dùng template để format body.
- **UR8 rework escalation** — khi chain quay về Customer, `customer-liaison` gộp `rework-log.json` (filter `material + chain-ends-at-S0`) → render 1 báo cáo duy nhất theo template.

#### 10.8.5 Tuning sau Phase 0

Câu chữ template hiện là draft. Đo qua **M8** (intake retry depth) + bổ sung **M11** (feedback comprehension proxy = % Customer fix đúng ngay lần 1 sau khi đọc báo cáo). Nếu cùng IQ có retry depth > 2 ⇒ wording template đó chưa đủ rõ, refine.

Phase 2 mở thêm:
- Style `api-only` (JSON thuần) cho machine-to-machine.
- Đa ngôn ngữ (`PROJECT.feedback_lang: vi | en`) — Phase 1 ship 1 ngôn ngữ project chọn ở runtime.

---

## 11. Vòng đời thay đổi (closed-loop 9 trạm)

Vòng đời đầy đủ — closed-loop, mọi rớt cổng đều có đường đi ngược về Customer kèm báo cáo có cấu trúc:

1. **Customer** sửa file spec dưới `specs/` (hoặc `PROJECT` artifact nếu đổi stack), mở PR.
2. **S0 Intake QC** chạy IQ1–IQ8 + SR1–SR9. **Rớt** → `customer-liaison` sinh **intake feedback report** → PR comment + pause → Customer sửa & resume từ bước 1.
3. **S1–S2** đọc spec, dựng/cập nhật trace + ownership.
4. **S3 Governance** lint ADR + bump semver (G1–G2). Rớt → report cho Customer.
5. **S4 Impact** tính semantic diff theo ID + sinh impact report.
6. **S5 SDD Design** sinh/cập nhật SDD-* tương ứng impact report; `customer-liaison` trình SDD cho Customer.
   - **Customer approve** → tiếp.
   - **Customer reject** → vòng về bước 1, kèm note phản hồi.
   - **Customer request-change** → `sdd-designer` chạy lại, trình SDD mới.
7. **S6 Production** sinh code/test/doc cho lát cắt bị ảnh hưởng theo SDD đã approve, gắn provenance. Per-ID transaction; 1 ID fail → batch rollback (§7.3).
8. **S7 Verification** chạy G5–G8. Fail → giữ workdir + report cổng nào fail; reviewer xử lý (không vòng về Customer trừ khi root cause là spec sai → đẩy về S0).
9. **G9 Breaking gate** — nếu `classification: breaking` (mặc định) → cần `reviewer/maintainer` approve PR.
10. **S8 Delivery** — Pre-commit hook chạy lại G0–G9 lần cuối. Pass → **auto-commit atomic** (spec + ADR + SDD + code + test + trace + ownership trong 1 commit). Fail → giữ workdir + report.
11. **Post-delivery** — drift monitor định kỳ (T3 §9.7); cost log (§13.6); metric M1–M9 cập nhật.

**Customer touchpoints (đồng bộ, pipeline pause):** bước 2 (intake feedback) + bước 6 (SDD review). Tất cả touchpoint khác đều bất đồng bộ qua PR comment hoặc issue tracker MCP.

---

## 12. Chính sách auto-commit & cổng kiểm soát

Phase 1 chọn **auto-commit khi test pass cho thay đổi `additive`/`cosmetic`**; thay đổi `breaking` mặc định yêu cầu duyệt người. Pipeline tự commit **khi và chỉ khi tất cả** cổng sau pass:

| Cổng | Trạm | Điều kiện pass |
|---|---|---|
| **G0 — Intake QC** | S0 | IQ1–IQ8 đều đạt + SR1–SR9 đạt. Rớt → feedback report về Customer, pipeline pause. |
| **G1 — Spec lint** | S3 | SR1–SR9 đều đạt (lint sâu, lặp lại sau khi có thể có evolution). |
| **G2 — ADR** | S3 | Thay đổi cosmetic: không cần. Khác: ADR `accepted` tồn tại, `kind` đúng, link đúng `affected_ids`. |
| **G_SDD — SDD approval** | S5 | Mọi SDD bị ảnh hưởng `status: approved` + `customer_approval.approval_run_id` khớp run hiện tại (FR-SDD-05). |
| **G3 — Impact resolved** | S6 in | Mọi `required_actions` trong impact report đã hoàn thành. |
| **G4 — Codegen complete** | S6 out | Mọi ID bị ảnh hưởng có implementation tương ứng; không còn stub TODO; mọi file thay đổi nằm trong ownership (§9.5.1, §8.2.8 SR17). |
| **G5 — Tests pass** | S7 | Acceptance test + adversarial test (R8) + regression + snapshot đều xanh. |
| **G6 — Trace consistent** | S7 | Trace index cập nhật; 0 orphan; 0 thiếu provenance; ownership.yaml ↔ index ↔ SDD components nhất quán. |
| **G7 — No drift** | S7 | `drift-check` xanh: code khớp index. |
| **G8 — Cost budget** | S7 | Tổng token + chi phí của run ≤ NFR-COST-01/02; nếu vượt → fail (chống lan chi phí ngầm). |
| **G9 — Breaking gate** | S8 | Nếu `classification = breaking` và `require_human_review_on` chứa `breaking` (mặc định **ON**) → cần approval `reviewer/maintainer` trên PR; nếu OFF → bỏ qua. |

**Cưỡng chế:** một pre-commit hook (trong `.claude/settings.json`) chạy G0–G9 trước S8 commit; bất kỳ cổng fail → exit code 2 → chặn commit và đẩy lý do về cho agent. Trong run, mỗi cổng chạy đúng vị trí trạm tương ứng (không đợi tới pre-commit cuối) để fail sớm.

> **Thay đổi so với v0.1.0 (giải quyết C3):** cờ `require_human_review_on: [breaking]` chuyển **mặc định ON**. Phase 1 là feasibility — chứng minh khả thi không yêu cầu auto-commit breaking. Sau khi metric M2/M3 đạt ngưỡng (xem §16) và snapshot/adversarial test ổn định qua ≥ 50 thay đổi additive liên tiếp, có thể bật OFF cho phép auto-commit breaking ở Phase 2.

---

## 13. Yêu cầu phi chức năng (NFR)

### 13.1 Tính tất định & độ chính xác
- **NFR-DET-01** — Tái chạy pipeline trên spec không đổi phải cho 0 thay đổi code (idempotent) hoặc thay đổi ổn định qua snapshot.
- **NFR-DET-02** — "Chính xác" định nghĩa theo hành vi: thỏa acceptance criteria + qua snapshot — không yêu cầu code byte-for-byte giống.

### 13.2 Khả kiểm toán (auditability)
- **NFR-AUD-01** — Từ bất kỳ commit nào truy ngược được: spec version, ADR, impact report, người duyệt (nếu có).
- **NFR-AUD-02** — Lịch sử version spec bất biến qua git tag.

### 13.3 Toàn vẹn (integrity)
- **NFR-INT-01** — Không tồn tại đường sửa code dẫn xuất vượt qua pipeline (cưỡng chế bằng hook).
- **NFR-INT-02** — Trace index luôn nhất quán sau mỗi run; drift bị phát hiện trong cùng session.

### 13.4 Hiệu năng & chi phí
- **NFR-PERF-01** — Impact analysis chỉ tải lát cắt liên quan qua subagent context riêng, không nạp toàn codebase vào context chính.
- **NFR-PERF-02** — Codegen giới hạn ở lát cắt bị ảnh hưởng để giảm token & thời gian.

### 13.5 Bảo mật
- **NFR-SEC-01** — Hook quét secret trên nội dung sinh ra trước khi commit.
- **NFR-SEC-02** — Hooks không tin nội dung đến từ file/spec không qua review (chống prompt injection qua spec).

### 13.6 Chi phí & token (NFR-COST — giải quyết C4)

Mỗi spec-change run kích hoạt 5–7 subagent. Không có ngân sách → chi phí lan ngầm, không kiểm soát được khi scale.

- **NFR-COST-01 — Token budget per run:** Tổng input+output token ≤ **500 000** cho mỗi `/spec-change` run với impact report ≤ 5 ID (giá trị khởi tạo, tinh chỉnh sau Phase 1 baseline). Vượt → G8 fail.
- **NFR-COST-02 — USD budget per run:** Quy đổi ≤ **2 USD** theo giá Claude hiện hành (ngưỡng cứng, log mọi run).
- **NFR-COST-03 — Per-ID token tracking:** Trace index ghi `token_cost` cho từng ID (xem §10.1) để phân tích spec nào tốn kém.
- **NFR-COST-04 — Subagent scope discipline:** Mỗi subagent nhận **chỉ lát cắt liên quan** qua impact report; cấm nạp toàn bộ codebase hay toàn bộ specs/ vào context (đo qua input token cap mỗi agent ≤ 80 000).
- **NFR-COST-05 — Caching:** Bật prompt caching cho phần ngữ cảnh tĩnh (CLAUDE.md, spec-schema, ownership manifest); mục tiêu cache hit rate ≥ 70% sau warm-up.

---

## 14. Giả định, ràng buộc, rủi ro & giảm thiểu

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | LLM phi tất định ⇒ codegen lệch | Surgical regen theo lát cắt + **file-ownership 1:1 (§9.5.1)** + snapshot/golden test + NFR-DET. |
| R2 | Drift do sửa tay | Hook `PreToolUse` chặn sửa ngoài luồng + `drift-check` ở G7 + drift policy 3 tier (§9.7). |
| R3 | Spec nhập nhằng ⇒ rác | Frontmatter machine-validated; `API`/`SCHEMA` ràng OpenAPI/JSON Schema; thân Markdown chỉ là rationale. |
| R4 | Auto-commit breaking lan lỗi ngầm | Snapshot mạnh + cờ `require_human_review_on: [breaking]` **mặc định ON** (§12 G9). |
| R5 | Trace index thối rữa | Index do máy sinh, cấm sửa tay; cập nhật bắt buộc qua `PostToolUse`; regenerate khi merge conflict (không merge thủ công). |
| R6 | "No-code 100%" bất khả thi | Escape hatch có kiểm soát (NG2/§9.7 T3): bypass session + ADR ≤ 72h. |
| R7 | Prompt injection qua nội dung spec | NFR-SEC-02: hooks coi nội dung spec là untrusted; sanitize trước khi đưa vào prompt subagent. |
| **R8** | **Self-referential testing**: test và code cùng sinh từ một spec bởi LLM → cùng hiểu sai → test pass trên code sai | **Adversarial-tester subagent (FR-GEN-07)** sinh test từ rationale + AC **không thấy code đã sinh**; thêm property-based test cho `SCHEMA` invariants; mutation testing tuần định kỳ. Bất kỳ pass-pass mà adversarial-fail → G5 fail. |
| **R9** | **Race condition / concurrent PR** đụng ID chồng chéo | Trace index không phải merge source — luôn regenerate từ git state sau merge. PR thứ hai bắt buộc rebase + impact reanalysis. Spec-lint chặn nếu cả hai PR cùng sửa frontmatter một ID. |
| **R10** | **Auto-commit gây hậu quả phát hiện muộn**, cần rollback đồng bộ spec+code+ADR+trace | Mỗi auto-commit là **một commit duy nhất** chứa toàn bộ artifact (spec + ADR + code + test + trace + ownership) → `git revert <sha>` rollback đồng bộ. Skill `keystone rollback <sha>` wrap revert + tái sinh trace + tạo ADR-ROLLBACK. |
| **R11** | **Plugin version skew** giữa Keystone framework và spec của user-repo | Plugin SemVer độc lập; `CLAUDE.md` ghi `keystone_min_version`; hook `SessionStart` từ chối chạy nếu plugin cũ hơn yêu cầu. |

**Giả định:** repo dùng git; stack target web/service = **TS+Fastify+Zod+Vitest+Drizzle/SQLite** (chốt §15.2); có CI để chạy test suite; có MCP issue tracker (tùy chọn, dùng cho FR-ESC-02).

---

## 15. Lộ trình theo phase

### 15.1 Phase plan

| Phase | Mục tiêu | Tiêu chí ra (exit) |
|---|---|---|
| **Phase 0 — Scaffold** | Dựng `CLAUDE.md`, skills, agents, hooks, spec-schema, trace + ownership rỗng, một spec mẫu. | Pipeline chạy end-to-end trên 1 spec mẫu, auto-commit thành công, G0–G9 đều xanh. |
| **Phase 1 — Feasibility** *(phase này)* | Chứng minh 6 lớp hoạt động với 1 web/service thật, spec cấu trúc chặt. | Thay đổi 1 `REQ` thật → code adapt + test pass + auto-commit + trace nhất quán; vượt 10 thay đổi additive liên tiếp; ≤ NFR-COST budget. |
| **Phase 2 — Hardening** | AST-based region (thay file-ownership 1:1), snapshot/golden test, mutation testing, đo NFR, cân nhắc bật OFF cờ breaking review. | Vượt G0–G9 ổn định qua ≥ 50 thay đổi liên tiếp, 0 drift, M2 ≥ 95%. |
| **Phase 3 — MD→Spec layer** | Lớp biến Markdown tự do → spec cấu trúc cho persona PM/BA thuần. | Tài liệu prose của user sinh ra spec hợp lệ tự động với vòng xác nhận. |
| **Phase 4 — Multi-stack / multi-repo** | Mở rộng codegen sang Python/Go; multi-repo orchestration. | ≥ 2 stack hỗ trợ; cross-repo trace. |

### 15.2 Stack profile catalog & default (v0.3 — đổi từ chốt-framework sang per-project)

v0.2 chốt cứng TS+Fastify ở mức framework. v0.3 chuyển sang **catalog profile**: framework hỗ trợ một tập profile chuẩn; mỗi project chọn 1 qua artifact `PROJECT.profile` (§8.2.7). Phase 1 ship **một** profile đầy đủ; thêm profile ở Phase 4.

**Catalog profile (Phase 1):**

| Profile | Trạng thái | Mô tả |
|---|---|---|
| `web-service-ts-fastify` | ✅ Ship đầy đủ | Default. Stack chi tiết bên dưới. Khuyến nghị cho mọi project Phase 1. |
| `web-service-python-fastapi` | 🟡 Skeleton + ADR mẫu | Roadmap Phase 4. Chỉ kiểm tra compatibility, không sinh code. |
| `web-service-go-chi` | 🟡 Skeleton | Roadmap Phase 4. |
| `<custom>` | ❌ Phase 2+ | Profile tùy chỉnh qua **certification gate** §15.4 (chốt Q10) — Phase 1 cưỡng chế SR20 chỉ cho `catalog`. |

**Chi tiết profile `web-service-ts-fastify` (default):**

Framework Keystone (chính nó):

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Ngôn ngữ skills/hooks | TypeScript + Node 22 | Hệ sinh thái JSON Schema/YAML/AST mạnh nhất; cross-platform (PRD chạy trên Windows). |
| YAML + frontmatter | `gray-matter` + `yaml` | Chuẩn de facto. |
| Schema validation | **Ajv 8** (JSON Schema 2020-12) | Nhanh nhất, hỗ trợ đầy đủ draft hiện hành. |
| OpenAPI | `@redocly/openapi-core` + `openapi-typescript` | Validate + type-gen. |
| Semantic diff | `deep-diff` + custom ID-aware layer | Không có lib sẵn cho semantic-by-ID. |
| Trace store | JSON file (Phase 1) → SQLite (Phase 2 khi >500 ID) | YAGNI. |
| AST (Phase 2) | `ts-morph` | Khi chuyển sang AST-based region anchor. |
| Hook runtime | Node + `tsx` | Tránh bash để cross-platform. |
| Self-test | **Vitest** | Snapshot + nhanh. |

**Target web/service (chốt cho Phase 1):**

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Runtime | Node 22 | Mature, Claude Code support tốt. |
| HTTP framework | **Fastify** | Native JSON Schema, type provider, performance. |
| Validation runtime | **Zod** + `zod-to-json-schema` ↔ `json-schema-to-zod` | Bidirectional với `SCHEMA` artifacts. |
| ORM/DB | **Drizzle** + SQLite (dev) → Postgres (prod) | Schema sinh từ `ENT`, type-safe. |
| Test runner | **Vitest** + `supertest` + snapshot | Sinh từ AC dễ. |
| Adversarial test | Vitest + `fast-check` (property-based) | Bắt R8 self-referential. |
| API doc | OpenAPI từ Fastify schema | Đồng bộ với `API` artifact. |

Các stack thay thế (Python+FastAPI, Go+chi) được cân nhắc nhưng hoãn sang Phase 4. Lý do gọn: TS có bidirectional Zod ↔ JSON Schema, Fastify native JSON Schema runtime — giảm tầng adapter.

### 15.3 Framework infrastructure test policy (chốt Q7 v0.8)

Hook, skill internal logic, agent prompt scaffold là **framework infrastructure** — không phải sản phẩm Customer. Self-hosting test (hook test bằng chính pipeline) có paradox: hook bug làm pipeline fail ⇒ không test được hook nữa. Phase 1 coi đây là **bootstrap exception** và test infrastructure bằng đường truyền thống.

**Quy tắc (HR1–HR4):**

- **HR1 — Hook test thủ công bằng Vitest fixture.** Mỗi hook ở `.claude/hooks/*.ts` có test cùng tên ở `.claude/hooks/__tests__/<hook>.spec.ts`. Test sửa tay (không qua pipeline). Fixture pattern:
  ```
  input event mock → run hook → assert exit code + stderr message + side-effect log
  ```
- **HR2 — Coverage gate ≥ 80% cho hook code.** Đo bằng `vitest --coverage`. CI block release nếu < ngưỡng.
- **HR3 — Skill internal logic test giống HR1.** Skill có phần TS/Node thực thi (vd `intake-qc/checks.ts`) test bằng Vitest. Phần prompt scaffold (Markdown `SKILL.md`) **không** test ở Phase 1 (đợi snapshot regression LLM ở Phase 2).
- **HR4 — Self-hosting hoãn Phase 2.** Khi pipeline ổn định qua ≥ 50 thay đổi liên tiếp (Phase 2 exit criteria), thử nghiệm `HOOK-*` spec artifact với AC + self-test. Lúc đó cần fallback "panic mode" (rollback hook về `last_known_good_sha`) để tránh paradox.

**Cấu trúc thư mục bổ sung (Phụ lục A):**

```
.claude/
├── hooks/
│   ├── pre-tool-use.ts
│   ├── post-tool-use.ts
│   ├── pre-commit.ts
│   └── __tests__/
│       ├── pre-tool-use.spec.ts        # HR1 fixture tests
│       ├── post-tool-use.spec.ts
│       └── pre-commit.spec.ts
├── skills/
│   └── intake-qc/
│       ├── SKILL.md                    # prompt scaffold (không test Phase 1)
│       ├── checks.ts                   # TS logic
│       └── __tests__/
│           └── checks.spec.ts          # HR3
```

Lý do giữ bootstrap exception: simplify Phase 1, không sa lầy vào meta-framework problem.

### 15.4 Custom profile certification (chốt Q10 v0.8 — Phase 2 gate)

Phase 1 chỉ chấp nhận `PROJECT.profile_source: catalog` (SR20). Phase 2 mở `custom_repo` nhưng đi qua **certification gate** để chặn profile chất lượng kém phá quality bar ecosystem.

**Cấu trúc custom profile (Phase 2):**

Một custom profile là **repo riêng** (`keystone-profile-<name>`), không sống trong user project. Cấu trúc bắt buộc:

```
keystone-profile-<name>/
├── profile.yaml                # manifest
├── templates/                  # codegen template (handler, route, test skeleton)
│   ├── handler.ts.eta
│   ├── route.ts.eta
│   └── test.spec.ts.eta
├── sdd-instructions.md         # hướng dẫn cho sdd-designer subagent
├── iq7-checks.ts               # function (spec, project) → IQ7 violations[]
├── sample-specs/               # ≥ 10 spec mẫu phủ FEAT/REQ/API/SCHEMA/ENT/NFR
│   ├── REQ-SAMPLE-001.md
│   ├── API-SAMPLE-001.md
│   └── ...
└── README.md
```

**Manifest `profile.yaml`:**

```yaml
id: PROFILE-WEB-SERVICE-PYTHON-FASTAPI
version: 1.0.0
language: python
stack:
  runtime: python311
  http: fastapi
  validation: pydantic
  orm: sqlmodel
  test: pytest
  adversarial_test: hypothesis
keystone_min_version: 0.8.0
maintainer: org/team
```

**Certification gate (PG1–PG5):**

| Gate | Điều kiện |
|---|---|
| **PG1 — Manifest validate** | `profile.yaml` khớp `profile-schema.json` (Phase 2 ship cùng skill `profile-cert`) |
| **PG2 — Reference suite pass** | Chạy `keystone cert <profile-repo>` trên ≥ 10 sample-specs → toàn bộ G0–G9 pass; **0 INCIDENT** trong suite |
| **PG3 — M3 threshold** | Precision ≥ 0.85, Recall ≥ 0.90 trên reference suite (giống mục tiêu Phase 1 §16 M3) |
| **PG4 — NFR-COST sanity** | Trung bình token/run của sample suite ≤ 1.5× baseline `web-service-ts-fastify` — chống profile bloated context |
| **PG5 — Independent review** | Maintainer khác repo profile review + approve trên catalog PR |

Pass toàn bộ PG1–PG5 → catalog admission, profile xuất hiện trong `keystone catalog list`.

**Sử dụng custom profile chưa cert (dev only):**

```yaml
# specs/project.md
profile_source: custom_repo
custom_profile:
  url: github.com/org/keystone-profile-foo
  commit: a1b2c3d4e5f6...        # full sha, bắt buộc (SR20)
  uncertified_acknowledged: true # cờ kích phần warning + audit dày
```

Pipeline với `uncertified_acknowledged: true`: tự commit **disabled** (G9 = always ON), reviewer phải approve mọi PR; log dòng `[UNCERTIFIED-PROFILE]` vào commit message.

**Versioning & breaking:**

- Profile có SemVer độc lập với Keystone framework version (`keystone_min_version` chỉ floor).
- Đổi `templates/` = breaking ở mức profile (downstream user dùng template cũ regenerate ra code khác) → bump major.
- Đổi `iq7-checks.ts` siết check = breaking; nới = minor.
- Đổi `sdd-instructions.md` (LLM prompt) = always breaking ở profile-level vì output non-deterministic.

---

## 16. Chỉ số thành công

- **M1 — Traceability coverage:** % derived artifact có provenance + entry index (mục tiêu 100%).
- **M2 — Auto-commit success rate:** % thay đổi spec `additive`/`cosmetic` qua được G0–G9 và tự commit không cần người (mục tiêu Phase 1: ≥ 80%; Phase 2: ≥ 95%).
- **M3 — Impact precision/recall:** đo trên **test set vàng** ≥ 20 thay đổi spec mẫu được chuyên gia gán nhãn artifact thực sự bị ảnh hưởng. Precision = đúng/(đúng+sai báo), Recall = đúng/(đúng+bỏ sót). Mục tiêu Phase 1: precision ≥ 0.85, recall ≥ 0.9 (recall quan trọng hơn — bỏ sót impact gây drift).
- **M4 — Drift incidents:** số lần phát hiện drift T2/T3 (§9.7) (mục tiêu → 0).
- **M5 — Change lead time:** p50 và p95 thời gian từ merge spec đến commit code đã kiểm chứng.
- **M6 — Token efficiency:** trung bình token/run (track NFR-COST-01); cache hit rate (NFR-COST-05); spec ID nào tốn token nhiều nhất (xem `token_cost` trong trace index).
- **M7 — Adversarial catch rate:** số lần adversarial-tester bắt được sai lệch mà acceptance test bỏ sót (đo hiệu lực R8 mitigation).
- **M8 — Intake reject rate & retry depth (S0):** % spec PR rớt G0 lần đầu; trung bình số vòng intake retry trước khi pass. Cao = nguyên liệu Customer chất lượng thấp; thấp đột ngột = IQ quá lỏng.
- **M9 — SDD approval cycle time & rejection rate (S5):** thời gian từ SDD `draft` → `approved`; tỉ lệ Customer reject/request-change. Cao = thiết kế lệch ý định Customer; quá thấp + drift tăng = Customer rubber-stamp.
- **M10 — Rework rate & escalation depth (§7.5, §10.7):** trung bình `rework_count / run`; phân bố theo `(from_station, to_station)`; tỉ lệ chain quay tới Customer (S0) / tổng rework; tỉ lệ `K_global` exceeded → INCIDENT. Cao = QC nội bộ trạm yếu hoặc nguyên liệu Customer chất lượng thấp; tăng đột ngột ở 1 cặp trạm = regression chất lượng spec hoặc SDD ở vị trí đó.
- **M11 — Feedback comprehension proxy (§10.8):** % Customer fix đúng ngay lần 1 sau khi đọc intake/SDD report. Đo bằng: rớt IQ_k lần 1 → Customer sửa → resume → IQ_k pass lần 2. Tỉ lệ thấp ⇒ wording template (`PROJECT.feedback_style`) chưa đủ rõ với criterion đó; trigger refine.
- **M12 — SDD reject category distribution (§9.4.5 FR-SDD-09):** phân bố `reject_reason.category` qua mọi reject S5; tỉ lệ escalate tới `awaiting-reviewer-triage`; phân bố 4 path A/B/C/D mà reviewer chọn. Cao ở `spec-misalignment` ⇒ S0 IQC lỏng (không bắt ambiguity sớm). Cao ở `customer-changed-mind` ⇒ Customer chưa pin xuống requirement, cần coaching template (§10.8). Path C (infeasibility) thường xuyên ⇒ scope quá tham vọng so với stack capability.

---

## 17. Câu hỏi mở (sau v0.3.0)

Các câu hỏi v0.1.0–v0.8.0 đã chốt:

- ~~Q1 stack~~ → **TS+Fastify+Zod+Vitest+Drizzle** (§15.2).
- ~~Q2 test runner~~ → **Vitest + supertest + fast-check** (§15.2).
- ~~Q3 region-anchor~~ → **File-ownership 1:1** cho Phase 1; AST-based ở Phase 2 (§9.5.1).
- ~~Q4 ngưỡng `breaking`~~ → **Bảng cứng §8.5** theo (artifact × thao tác); default "không match ⇒ breaking"; tuning sau ≥ 30 run qua `combo_signature` log.
- ~~Q5 MCP issue tracker~~ → Tùy chọn, dùng cho FR-ESC-02 (§9.7); chốt khi triển khai cụ thể.
- ~~Q8 feedback template~~ → **3 template §10.8** (`concise` / `detailed` / `coaching`), mặc định `detailed`; project chọn qua `PROJECT.feedback_style` (SR19); câu chữ tuning qua M11.
- ~~Q9 SDD reject loop~~ → **FR-SDD-09**: bắt buộc `reject_reason.category` (5 giá trị); reach `K_customer_reject_s5` → state `awaiting-reviewer-triage` + 4 path (A spec-rewrite / B reviewer-takeover / C declare-infeasible / D reset-budget); pre-escalate khi 2 reject cùng category; loop cap cứng = 5; tuning phân bố qua M12.
- ~~Q6 cycle trong spec graph~~ → **Cấm tuyệt đối Phase 1** (XQC-S1.X2 §7.5.2). Bỏ exception `cycle_allowed`. Lý do: design smell — luôn có cách model tốt hơn (umbrella FEAT hoặc tách common dependency). Phase 2 mở exception nếu Phase 0 telemetry phát hiện case legitimate.
- ~~Q7 hook self-test~~ → **§15.3 HR1–HR4**: hook test thủ công bằng Vitest fixture (`.claude/hooks/__tests__/`), bootstrap exception không qua `/spec-change`. Coverage ≥ 80%, CI block. Phase 2 thử self-hosting khi pipeline ổn định + có panic mode.
- ~~Q10 custom profile~~ → **§15.4 certification gate** (Phase 2): repo riêng `keystone-profile-<name>` với cấu trúc cứng (templates/sdd-instructions/iq7-checks/sample-specs ≥ 10); pass PG1–PG5 mới admit catalog. Phase 1 cưỡng chế `PROJECT.profile_source: catalog` (SR20).

Còn mở:
- **Q11** — **K-tuning baseline từ Phase 0 telemetry.** Giá trị mặc định ở §7.5.1 + §8.2.7 (`k_self`, `k_global=5`, `k_customer_retry_s0=5`, `rework_token_budget_pct=30%`) là ước lượng tiên nghiệm, chưa có data thật. Sau Phase 0 cần đo qua **M10** (§16) + `token_cost` trong `rework-log.json` (§10.7) trên ≥ 30 run thật để chốt baseline. Cụ thể cần trả lời: (a) phân phối thực tế của `rework_count / run` — quantile nào để chọn K_global? (b) cặp `(from_station, to_station)` nào fail nhiều nhất → có cần đẩy K_self của trạm đó lên hay xuống? (c) tỉ lệ rework chain đến đáy S0 / tổng rework — nếu > 40% thì IQC (S0) quá lỏng, để rác lọt vào sâu mới phát hiện; (d) tỉ lệ token rework / tổng token — chốt `rework_token_budget_pct` cứng dưới ngưỡng nào. Output: bộ K khuyến nghị **per budget_tier** (lean / standard / premium) ship kèm catalog profile.

---

## 18. Bảng điều khiển vận hành & lệnh thủ công (mới v0.5)

Phần này định nghĩa **giao diện vận hành** để Customer/Reviewer giám sát dây chuyền theo thời gian thực: trạng thái mỗi trạm + checklist chi tiết + bộ slash command can thiệp thủ công khi cần. Mục tiêu: Customer/Reviewer nhìn dashboard biết ngay run đang ở đâu, khi nào cần mình nhảy vào, hành động nào còn khả thi.

### 18.1 Trạng thái trạm (status enum)

Mỗi trạm trong một run có trạng thái thuộc enum 8-trạng:

| Trạng thái | Biểu tượng | Ý nghĩa | Cần can thiệp? |
|---|---|---|---|
| `idle` | ⬜ | Chưa tới lượt (run chưa chảy đến trạm) | Không |
| `running` | 🟦 | Đang xử lý | Không (đợi tự xong) |
| `awaiting-customer` | 🟨 | Pause chờ Customer (S0 reject hoặc S5 SDD review) | **Có — alert ngay** |
| `awaiting-reviewer-triage` | 🟪 | Pause chờ reviewer triage 4-path (S5 reach `K_customer_reject_s5` hoặc pre-escalate) | **Có — alert reviewer ngay** |
| `reworking` | 🟧 | Nhận rework feedback, đang tự retry / chờ retry trạm trước | Theo dõi; alert nếu vượt K_self |
| `passed` | 🟩 | EQC + XQC đều pass, đã chuyển trạm | Không |
| `failed` | 🟥 | XQC fail vượt K_self và hết escalation chain → INCIDENT | **Có — reviewer/platform-engineer** |
| `skipped` | ⬛ | Không cần chạy (vd S5 skip khi `classification: cosmetic`) | Không |

State machine ghi trạng thái mỗi trạm + timestamp vào `.keystone/run-state.json` mỗi khi transition; dashboard skill đọc từ đây.

### 18.2 Dashboard tổng — `/keystone:status`

```
╔══════════════════════════════════════════════════════════════════════════╗
║  KEYSTONE PRODUCTION LINE — run-2026-06-04-007                           ║
║  spec-change: REQ-AUTH-001 v1.2.0→v1.3.0, +REQ-AUTH-003                  ║
║  classification: additive    budget: 124.5k / 500k tokens (24.9%)        ║
║  started: 14:00:12   elapsed: 4m 22s   rework: 1 / 5   K_global: 5       ║
╠══════════════════════════════════════════════════════════════════════════╣
║  S0 Intake QC          🟩 PASSED     [8/8]     12s                       ║
║  S1 Spec               🟩 PASSED     [3/3]      4s                       ║
║  S2 Traceability       🟩 PASSED     [3/3]      2s                       ║
║  S3 Governance         🟩 PASSED     [3/3]      6s                       ║
║  S4 Impact             🟩 PASSED     [3/3]     18s                       ║
║  S5 SDD Design         🟨 AWAITING   [3/4]  2m 40s   ◄── you             ║
║     └ SDD-COMP-FEAT-AUTH draft.2 ready, customer review needed           ║
║     └ 1 prior request-change at 14:18:00                                 ║
║  S6 Production         ⬜ idle                                            ║
║  S7 Verification       ⬜ idle                                            ║
║  S8 Delivery           ⬜ idle                                            ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Actions available right now:                                            ║
║    /keystone:S5:approve SDD-COMP-FEAT-AUTH                               ║
║    /keystone:S5:reject  SDD-COMP-FEAT-AUTH --reason "..."                ║
║    /keystone:S5:request-change SDD-COMP-FEAT-AUTH --note "..."           ║
║    /keystone:status S5     (xem checklist + SDD detail)                  ║
║    /keystone:abort         (huỷ run, giữ workdir)                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

Quy ước hiển thị:

- `[checks_pass/total]` đếm tổng `EQC + Process milestones + XQC` đã pass / tổng cần đạt của trạm.
- `◄── you` chỉ trạm đang **chờ chính người đang xem** hành động.
- Thời gian: tính từ khi trạm bắt đầu xử lý đến lúc render.
- **"Actions available right now"** chỉ liệt kê lệnh có thể chạy ngay ở trạng thái hiện tại — không liệt kê lệnh đã hết tác dụng.

### 18.3 Dashboard chi tiết trạm — `/keystone:status S_n`

Ví dụ output `/keystone:status S5` khi đang AWAITING:

```
╔══════════════════════════════════════════════════════════════════════════╗
║  S5 SDD Design — 🟨 AWAITING CUSTOMER                                    ║
║  run-2026-06-04-007 | started 14:01:42 | elapsed 2m 40s                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Entry QC (EQC-S5)                                                       ║
║    ✅ E1  impact_report ảnh hưởng ≥ 1 FEAT/REQ/API/ENT                   ║
║    ✅ E2  project.profile resolve trong catalog                          ║
║    ✅ E3  existing SDDs liên quan đọc được                               ║
║                                                                          ║
║  Process                                                                 ║
║    ✅ sdd-designer drafted SDD-COMP-FEAT-AUTH (1.0.0-draft.2)            ║
║    ✅ sdd-review skill chấm pass (4/4)                                   ║
║    🟦 customer-liaison trình SDD — waiting customer response             ║
║                                                                          ║
║  Exit QC (XQC-S5)                                                        ║
║    ⏳ X1  G_SDD đạt (mọi SDD approved + approval_run_id khớp)            ║
║    ⏳ X2  0 open_questions                                               ║
║    ⏳ X3  mỗi SDD có risks không rỗng                                    ║
║    ⏳ X4  mọi component có ownership_id resolve                          ║
║                                                                          ║
║  Customer touchpoint                                                     ║
║    Awaiting since:        14:05:00 (3m 22s ago)                          ║
║    Reject count this run: 0 / 3 (K_customer_reject_s5)                   ║
║    Request-change count:  1 (không tính K_self — human input)            ║
║    SDD review thread:     .keystone/sdd-review-thread.json               ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Actions:                                                                ║
║    /keystone:S5:approve <SDD-ID>                                         ║
║    /keystone:S5:reject  <SDD-ID> --reason "..."                          ║
║    /keystone:S5:request-change <SDD-ID> --note "..."                     ║
║    /keystone:S5:show <SDD-ID>                                            ║
╚══════════════════════════════════════════════════════════════════════════╝
```

Biểu tượng từng check: `✅` pass, `❌` fail, `⏳` chưa đánh giá / chờ phụ thuộc, `🟦` đang chạy.

### 18.4 Checklist chính thức theo trạm

Mỗi trạm có **đúng** ba khối checklist: `EQC-S_n + Process milestones + XQC-S_n`. EQC/XQC định nghĩa cứng ở §7.5.2; Process milestones là chi tiết runtime để dashboard hiển thị tiến độ:

| Trạm | Process milestones |
|---|---|
| **S0** | `intake-inspector started` → `SR1–SR9 evaluated` → `IQ1–IQ8 evaluated` → `feedback-report compiled` (nếu reject) |
| **S1** | `spec files loaded` → `AST built` → `relations resolved` |
| **S2** | `ownership.yaml loaded` → `trace delta computed` → `index draft written` |
| **S3** | `spec-lint executed` → `ADR drafts validated` → `semver claim checked` |
| **S4** | `semantic-diff computed` → `impact-analyzer traversed graph` → `impact-report written` |
| **S5** | `sdd-designer drafted SDD-*` → `sdd-review chấm pass` → `customer-liaison trình SDD` |
| **S6** | `implementer wrote code` → `test-author wrote tests` → `adversarial-tester wrote tests (independent context)` → `provenance gắn` |
| **S7** | `acceptance tests ran` → `adversarial tests ran` → `regression suite ran` → `drift-check ran` → `cost-check ran` |
| **S8** | `pre-commit hook G0–G9 rerun` → `atomic commit created` → `post-delivery monitor armed` |

### 18.5 Bộ slash command — danh mục đầy đủ

Tổ chức theo namespace `/keystone:*`, ship trong plugin chuẩn (§7.2).

**Global (toàn pipeline):**

| Lệnh | Tác dụng | Khi nào dùng |
|---|---|---|
| `/keystone:run [--from S_n]` | Khởi động `/spec-change` run mới. `--from` cho phép bắt đầu từ trạm n (dev mode, có audit warning) | Khởi động run thường |
| `/keystone:status [S_n]` | Dashboard tổng hoặc detail của 1 trạm | Bất cứ lúc nào |
| `/keystone:runs` | List ≤ 20 run gần nhất (active + recent) + trạng thái cuối | Tìm `run-id` |
| `/keystone:resume <run-id>` | Tiếp tục run đang pause (sau khi Customer sửa spec / approve SDD) | Sau hành động ngoài luồng |
| `/keystone:abort <run-id>` | Huỷ run, giữ workdir, ghi audit | Phát hiện đường lỗi, không muốn đốt thêm token |
| `/keystone:rework-log <run-id>` | View rework chain của run | Debug tại sao K_global gần đạt |
| `/keystone:cost <run-id>` | Token + USD breakdown per trạm + per ID | Audit chi phí |
| `/keystone:incidents` | List INCIDENT đang mở + lý do | Sau khi nhận alert hệ thống |
| `/keystone:trace <ID>` | View trace + ownership + provenance của 1 spec ID | Truy nguyên code |

**Trigger thủ công per-trạm (dev/debug mode — chạy đứng riêng, không vào run chính):**

| Lệnh | Tác dụng |
|---|---|
| `/keystone:S0 [--dry-run]` | Chạy intake QC trên working diff mà không kích pipeline |
| `/keystone:S1` | Chạy parser + relation resolver, output SpecGraph |
| `/keystone:S2` | Chạy traceability update, output trace delta |
| `/keystone:S3` | Chạy spec-lint + ADR/semver check, output governance verdict |
| `/keystone:S4` | Chạy semantic-diff + impact analyzer, output impact report |
| `/keystone:S5 [--from-impact <file>]` | Chạy SDD design với impact report cho trước (test design quality) |
| `/keystone:S6 [--from-sdd <SDD-ID>]` | Chạy codegen từ SDD approved (debug implementer/test-author) |
| `/keystone:S7 [--scope <ID,…>]` | Chạy verification trên scope ID có sẵn code (debug test fail) |
| `/keystone:S8 [--dry-run]` | Chạy delivery dry-run (mọi gate + plan atomic commit, không thực commit) |

> Mọi standalone run **không tự chuyển trạm tiếp** — chỉ output kết quả + log. Dùng cho audit / debug / dev. Kết quả ngoài run chính **không** đi vào trace index sản phẩm.

**Customer touchpoint (đồng bộ — pipeline đang pause chờ lệnh này):**

| Lệnh | Tác dụng | Khi nào |
|---|---|---|
| `/keystone:S0:resume <run-id>` | Customer xác nhận đã sửa spec, restart từ S0 | Sau khi push commit sửa intake reject |
| `/keystone:S5:show <SDD-ID>` | Render SDD đẹp (Markdown + diagram) để Customer đọc | Trước quyết định approve/reject |
| `/keystone:S5:approve <SDD-ID>` | Customer chấp thuận SDD → G_SDD pass | Sau khi đọc OK |
| `/keystone:S5:reject <SDD-ID> --category <c> --reason "..."` | Customer từ chối + bắt buộc `category` ∈ {`spec-misalignment`, `impact-misanalysis`, `design-quality`, `customer-changed-mind`, `infeasibility`}; định tuyến tự động theo FR-SDD-09 | Khi thiết kế lệch ý định |
| `/keystone:S5:request-change <SDD-ID> --note "..."` | Yêu cầu sdd-designer redraft (không tính K_self) | Khi chỉ cần điều chỉnh nhỏ |

**Reviewer/Maintainer:**

| Lệnh | Tác dụng |
|---|---|
| `/keystone:approve-breaking <run-id>` | G9 reviewer approval cho thay đổi `breaking` |
| `/keystone:incident:close <INCIDENT-ID> --note "..."` | Đóng INCIDENT sau xử lý |
| `/keystone:rework:reset <run-id> --reason "..."` | Reset rework counter — chỉ dùng khi root cause là bug platform (FR-SDD-09 path D); ghi audit dày |
| `/keystone:S5:triage <run-id>` | Mở triage console khi state = `awaiting-reviewer-triage`; hiện reject history + category distribution + đề xuất path | 
| `/keystone:S5:route-to-spec <run-id> --note "..."` | FR-SDD-09 path A: route về S0 co-author spec với Customer; reset K_customer_retry_s0 cho session triage |
| `/keystone:S5:reviewer-takeover <run-id> --direction "..."` | FR-SDD-09 path B: reviewer ghi direction, sdd-designer redraft theo direction (≤ 2 attempt) |
| `/keystone:S5:declare-infeasible <run-id> --reason "..."` | FR-SDD-09 path C: chốt infeasibility → INCIDENT `S5-infeasible`, dừng run |

### 18.6 Cơ chế thông báo & escalation

Dashboard chỉ phục vụ khi Customer/Reviewer chủ động xem. Khi cần can thiệp, hệ thống phải **push proactively**:

| Event | Kênh | Đối tượng |
|---|---|---|
| Run vào `awaiting-customer` (S0 reject hoặc S5 review) | PR comment + MCP issue (nếu cấu hình) | Customer |
| Run vào `awaiting-reviewer-triage` (S5 reject loop, FR-SDD-09) | PR comment + MCP issue + Phase 2: Slack/email | Reviewer |
| Rework `K_global` exceeded → INCIDENT | PR comment + MCP issue + Phase 2: Slack/email | Reviewer + Platform Engineer |
| G9 breaking gate cần duyệt | PR review request | Reviewer/Maintainer |
| Token cost vượt 80% NFR-COST-01 | PR comment (warning) | Customer + Reviewer |
| Drift T3 phát hiện post-delivery (§9.7) | MCP issue + Phase 2: pager | Owner team |
| Run hoàn tất (S8 commit thành công) | PR comment summary | Customer |

Quy tắc:

- Format: 1 dòng tóm tắt + link `/keystone:status <run-id>` để xem chi tiết.
- Mỗi event đẩy **đúng 1 lần** per state transition; state machine ghi `notification_sent` chống duplicate.
- Customer reject lần thứ N (S5) → notification ghi rõ `N/K_customer_reject_s5` để Customer biết đang gần escalate.

### 18.7 Triển khai trong Claude Code

| Thành phần | Primitive | Ship phase |
|---|---|---|
| Dashboard rendering | Skill `/keystone:status` đọc `.keystone/run-state.json` + `rework-log.json` + intake/SDD threads, format ASCII | Phase 0 |
| Slash command catalog | `.claude/commands/keystone-*.md` khai báo từng lệnh + arg schema; tài liệu phát hiện qua `/help` | Phase 0 |
| Notification PR comment | Hook `PostToolUse` sau state machine transition + GitHub MCP / `gh` CLI | Phase 0 (GitHub), Phase 2 (Slack/email/pager) |
| Customer touchpoint flow | Subagent `customer-liaison` cộng tác với skills `/keystone:S5:*` | Phase 0 |
| Audit lệnh thủ công | Mọi lệnh per-trạm ghi vào `.keystone/manual-actions.log` (actor, ts, args, run_id) | Phase 0 |

---

## 19. Công việc tương lai

- Lớp **MD → structured spec** (Phase 3): NLP/LLM trích xuất ID + relations + AC từ prose, có vòng xác nhận với người.
- **AST-based region anchor** thay file-ownership 1:1 (Phase 2) — gỡ ràng buộc một file = một ID.
- Mở rộng output ngoài web/service (mobile native, ML pipeline) — Phase 4+.
- Stack thay thế: Python+FastAPI, Go — Phase 4.
- GUI cho Spec Author không quen git.
- Multi-repo / monorepo orchestration — Phase 4.
- **MCP issue tracker** (Linear/Jira) cho ADR ↔ ticket auto-sync (đã chuyển từ Q5).
- **Hook self-hosting test**: hooks có spec và test riêng, eat-our-own-dogfood.

---

## Phụ lục A — Cây thư mục đề xuất

```
.
├── CLAUDE.md                      # hiến pháp framework
├── .claude/
│   ├── settings.json              # hooks wire-up: PreToolUse / PostToolUse / SessionStart / PreCommit
│   ├── hooks/                     # hook implementations (§15.3 HR1)
│   │   ├── pre-tool-use.ts        # chặn sửa file dẫn xuất + chặn ghi ngoài ownership ID đang xử lý
│   │   ├── post-tool-use.ts       # chạy spec-lint + trace-update sau Edit/Write
│   │   ├── session-start.ts       # nạp index spec + ownership manifest + check keystone_min_version (R11)
│   │   ├── pre-commit.ts          # chạy G0–G9 trước S8 commit
│   │   └── __tests__/             # HR1 Vitest fixture (bootstrap exception, không qua /spec-change)
│   │       ├── pre-tool-use.spec.ts
│   │       ├── post-tool-use.spec.ts
│   │       ├── session-start.spec.ts
│   │       └── pre-commit.spec.ts
│   ├── commands/                  # slash command catalog (§18.5, §18.7)
│   │   ├── keystone-run.md
│   │   ├── keystone-status.md
│   │   ├── keystone-runs.md
│   │   ├── keystone-resume.md
│   │   ├── keystone-abort.md
│   │   ├── keystone-rework-log.md
│   │   ├── keystone-cost.md
│   │   ├── keystone-incidents.md
│   │   ├── keystone-trace.md
│   │   ├── keystone-S0.md         # per-trạm dev/debug + customer touchpoint S0:resume
│   │   ├── keystone-S1.md
│   │   ├── keystone-S2.md
│   │   ├── keystone-S3.md
│   │   ├── keystone-S4.md
│   │   ├── keystone-S5.md         # gồm approve/reject/request-change/show + reviewer triage path A/B/C
│   │   ├── keystone-S6.md
│   │   ├── keystone-S7.md
│   │   ├── keystone-S8.md
│   │   ├── keystone-approve-breaking.md   # reviewer G9
│   │   ├── keystone-incident-close.md
│   │   └── keystone-rework-reset.md       # FR-SDD-09 path D (reviewer-only)
│   ├── skills/
│   │   ├── spec-change/SKILL.md           # orchestrator (§7.3)
│   │   ├── intake-qc/SKILL.md             # S0 (§9.0)
│   │   ├── feedback-report/SKILL.md       # sinh báo cáo cho Customer (§10.8)
│   │   ├── spec-lint/SKILL.md
│   │   ├── spec-evolution/SKILL.md        # split/merge/supersede (§8.4)
│   │   ├── semantic-diff/SKILL.md
│   │   ├── impact-analysis/SKILL.md
│   │   ├── sdd-design/SKILL.md            # S5 (§9.4.5)
│   │   ├── sdd-review/SKILL.md            # cổng G_SDD
│   │   ├── codegen-from-spec/SKILL.md
│   │   ├── gen-acceptance-tests/SKILL.md
│   │   ├── adversarial-test/SKILL.md      # R8 mitigation
│   │   ├── trace-update/SKILL.md
│   │   └── drift-check/SKILL.md
│   └── agents/
│       ├── intake-inspector.md            # S0
│       ├── spec-validator.md
│       ├── impact-analyzer.md
│       ├── sdd-designer.md                # S5
│       ├── implementer.md
│       ├── test-author.md
│       ├── adversarial-tester.md          # độc lập với implementer & SDD
│       ├── traceability-keeper.md
│       ├── customer-liaison.md            # giao tiếp với Customer
│       └── reviewer.md
├── .keystone/                     # runtime state (generated, cấm sửa tay)
│   ├── run-state.json             # state machine 8-status (§7.3, §18.1)
│   ├── rework-log.json            # mọi vòng rework trong 1 run (§7.5.1 UR7, §10.7)
│   ├── rework-log-schema.json     # schema cho rework-log
│   ├── diff-log.json              # combo_signature cho semantic-diff (§8.5.2 tuning)
│   ├── manual-actions.log         # audit lệnh thủ công per-trạm (§18.7)
│   ├── bypass.log                 # audit log escape hatch (§9.7 FR-ESC-01)
│   ├── trace-index-schema.json    # schema cho trace index (§10.1)
│   ├── intake-report.json         # báo cáo S0 mới nhất (§10.5)
│   ├── intake-report-schema.json  # schema cho intake-report (§10.5)
│   ├── sdd-review-thread.json     # lịch sử duyệt SDD (§10.6)
│   └── cost-budget.yaml           # ngưỡng NFR-COST-01/02 (§13.6)
├── specs/                         # NGUỒN SỰ THẬT
│   ├── spec-schema.json           # JSON Schema validate frontmatter
│   ├── project.md                 # PROJECT artifact (§8.2.7) — DUY NHẤT
│   ├── openapi/                   # OpenAPI ref ngoài (Dạng B §8.2.5)
│   │   └── order-create.yaml
│   ├── auth/REQ-AUTH-001.md
│   ├── auth/FEAT-AUTH.md
│   ├── order/API-ORDER-CREATE.md
│   └── sdd/                       # SDD-* artifacts (§8.2.8) — generated, customer-approved
│       ├── SDD-ARCH-AUTH.md
│       ├── SDD-COMP-FEAT-CHECKOUT.md
│       ├── SDD-DATA-ENT-ORDER.md
│       └── SDD-API-IMPL-API-ORDER-CREATE.md
├── docs/
│   ├── adr/ADR-014.md             # kind: change | evolution | drift | bypass (§10.3)
│   └── api/                       # doc dẫn xuất (generated)
├── .trace/
│   ├── index.json                 # trace index (generated, cấm sửa tay)
│   ├── ownership.yaml             # file-ownership 1:1 (§9.5.1, §10.2)
│   └── retired.json               # ID đã retired (SR8)
├── src/
│   ├── generated/                 # CODE DẪN XUẤT — hook PreToolUse chặn sửa ngoài luồng
│   │   ├── auth/login.ts
│   │   └── orders/create-route.ts
│   └── lib/                       # code "shared" sửa tay (không thuộc ID nào, §9.5.1 FO3)
└── tests/
    ├── generated/                 # TEST DẪN XUẤT từ AC
    │   └── auth/login.spec.ts
    └── adversarial/               # TEST DẪN XUẤT từ adversarial-tester (R8)
        └── auth/login.adversarial.spec.ts
```

## Phụ lục B — Ví dụ provenance trong code (file-ownership 1:1)

Phase 1 KHÔNG dùng region marker. Mỗi file là **một** ID; toàn bộ file là dẫn xuất; provenance ở header file.

```ts
// @keystone-owner    REQ-AUTH-001
// @spec-version      1.2.0
// @spec-content-hash sha256:9b1f…
// @sdd-source        SDD-COMP-FEAT-AUTH@1.0.0
// @project-profile   web-service-ts-fastify
// @generated-by      keystone@0.8.1 — do not edit by hand outside the pipeline
// @generated-at      2026-06-04T10:00:00Z
// @run-id            run-2026-06-04-001

import type { FastifyInstance } from "fastify";
import { LoginRequestSchema, LoginResponseSchema } from "../schemas/auth";

export async function registerLoginRoute(app: FastifyInstance): Promise<void> {
  app.post("/auth/login", {
    schema: { body: LoginRequestSchema, response: { 200: LoginResponseSchema } },
  }, async (req, reply) => {
    // ... thân handler sinh từ AC-AUTH-001-01/02
  });
}
```

**Kiểm chứng tự động:**
- Hook `PreToolUse` đọc `@keystone-owner`; chặn ghi nếu owner không khớp ID đang xử lý trong session.
- `drift-check` so `@spec-content-hash` với hash hiện tại của spec → mismatch ⇒ T1/T2 drift (§9.7).

## Phụ lục C — Bản đồ giải quyết C1–C15 (v0.1.0 → v0.2.0) & đóng góp dây chuyền 9 trạm (v0.2.0 → v0.3.0)

### v0.2.0 — giải quyết C1–C15

| Điểm | Giải quyết ở | Cốt lõi |
|---|---|---|
| C1 self-referential testing | R8, FR-GEN-07, agent `adversarial-tester`, skill `adversarial-test`, M7 | Sinh test bằng path độc lập với code |
| C2 region-anchor | §9.5.1 file-ownership 1:1, Q3 closed | Chốt 1 file = 1 ID cho Phase 1 |
| C3 auto-commit breaking | §12 G9, mặc định ON | Bật cờ review breaking trong Phase 1 |
| C4 token economics | §13.6 NFR-COST-01..05, G8, M6, trace `token_cost` | Ngân sách cứng + đo từng ID |
| C5 OpenAPI inline | §8.2.5 Dạng B `openapi_ref` | Cho phép file ngoài |
| C6 stack chốt | §15.2 | TS+Fastify+Zod+Vitest+Drizzle |
| C7 drift resolution | §9.7 T1/T2/T3 + FR-ESC-01..04 | 3 tier xử lý + escape hatch chính thức |
| C8 race condition | R9 + §10.1 generator | Trace regenerate, không merge |
| C9 persona | §1 + §4 ghi chú | Spec Author = tech-PM/engineer |
| C10 spec evolution | §8.4 + SR7–SR9 + skill `spec-evolution` | 5 thao tác chuẩn |
| C11 trace schema | §10.1 `$schema` + `.keystone/trace-index-schema.json` | Schema hóa index |
| C12 M3 measurement | §16 M3 test set vàng | Precision/recall đo được |
| C13 Q5 di chuyển | §17 closed list + §18 future | MCP issue tracker → tương lai |
| C14 rollback | R10 + `keystone rollback` | 1 commit atomic → revert đồng bộ |
| C15 hook self-test | Q7 + §18 hook self-hosting | Hooks có spec và test riêng |

### v0.3.0 — đóng góp "dây chuyền sản xuất 9 trạm S0–S8"

| Đóng góp | Giải quyết ở | Cốt lõi |
|---|---|---|
| Production line metaphor làm framing trung tâm | §1, §7 (toàn bộ), §11 | 9 trạm S0–S8 thay cho "6 lớp" thuần kỹ thuật |
| Chốt chặn verify nguyên liệu đầu vào | **S0 Intake QC** §9.0 (IQ1–IQ8), G0, skill `intake-qc`, agent `intake-inspector` | 8 tiêu chí: completeness / clarity / feasibility / resolvability / semver / NFR-measurability / project-compat / project-artifact-present (IQ8 bổ sung ở v0.8.0 cùng SR20) |
| Trả về Customer kèm báo cáo có cấu trúc | §10.5 intake report + §10.6 SDD review thread, agent `customer-liaison`, skill `feedback-report` | Format JSON đầy đủ + gợi ý sửa cụ thể |
| Clarify tech stack mong muốn | Artifact `PROJECT` §8.2.7 + §15.2 stack profile catalog | TS+Fastify là default profile; mỗi project khai báo profile riêng |
| Xây SDD tương ứng stack + spec | **S5 SDD Design** §9.4.5 (FR-SDD-01..08), artifact `SDD-*` §8.2.8 (4 dạng), cổng G_SDD, skill `sdd-design`+`sdd-review`, agent `sdd-designer` | Customer duyệt thiết kế trước khi tốn token codegen |
| Chu trình khép kín, từng bước có kiểm soát | §11 closed-loop 9 trạm S0–S8, §7.3 state machine + customer touchpoints, §7.4 chi tiết input/output gate mỗi trạm | Pipeline pause + resume tại Customer touchpoint; mọi rớt cổng đều có đường về S0 |
| Mọi thay đổi kiểm soát được | M8/M9 metric mới, §10.5/§10.6 audit log, project SR10–SR13, SDD SR14–SR17 | Đo intake retry + SDD reject; trail đầy đủ |

---

*Hết PRD-Keystone v0.8.1.*
