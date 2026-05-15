# DEADLINE TRACKER
> Template: `deadline_tracker.md`
> Managed by: 04_transaction_coordinator
> Deal: {{deal_id}} | Agent: {{agent_name}} | Client: {{client_name}}
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**PROPERTY:** {{property_address}}
**CONTRACT DATE:** {{contract_date}}
**CLOSING DATE:** {{closing_date}}
**SIDE:** {{deal_side}}

---

## ACTIVE DEADLINES

| Priority | Deadline | Date | Time | Status | Days Out | Alert Sent |
|---|---|---|---|---|---|---|
| 🔴 | Earnest Money Due | {{earnest_money_due_date}} | {{earnest_money_due_time}} | {{earnest_money_status}} | {{earnest_days_out}} | [ ] 48hr [ ] 24hr |
| 🔴 | Inspection Period Ends | {{inspection_deadline_date}} | {{inspection_deadline_time}} | {{inspection_status}} | {{inspection_days_out}} | [ ] 48hr [ ] 24hr |
| 🟡 | Appraisal Deadline | {{appraisal_deadline_date}} | 5:00 PM | {{appraisal_status}} | {{appraisal_days_out}} | [ ] 48hr [ ] 24hr |
| 🟡 | Loan Commitment Deadline | {{financing_deadline_date}} | 5:00 PM | {{financing_status}} | {{financing_days_out}} | [ ] 48hr [ ] 24hr |
| 🟢 | Closing Disclosure 3-Day Rule | {{cd_delivery_date}} | — | {{cd_status}} | {{cd_days_out}} | [ ] 48hr [ ] 24hr |
| 🟢 | Final Walkthrough | {{walkthrough_date}} | {{walkthrough_time}} | {{walkthrough_status}} | {{walkthrough_days_out}} | [ ] 48hr [ ] 24hr |
| 🟢 | Closing | {{closing_date}} | {{closing_time}} | {{closing_status}} | {{closing_days_out}} | [ ] 48hr [ ] 24hr |

**Priority:** 🔴 Critical (financial risk if missed) | 🟡 Important | 🟢 Scheduled

---

## DEADLINE STATUS KEY

| Status | Meaning |
|---|---|
| `pending` | Not yet due — monitoring active |
| `in_progress` | Action initiated — awaiting completion |
| `completed` | Done and confirmed |
| `waived` | Party has waived this contingency |
| `extended` | Deadline extended by written agreement |
| `missed` | ⚠ Deadline passed without resolution — escalated |

---

## CONTINGENCY STATUS

| Contingency | Active | Deadline | Status | Resolution |
|---|---|---|---|---|
| Inspection | {{inspection_contingency_active}} | {{inspection_deadline_date}} | {{inspection_contingency_status}} | {{inspection_resolution}} |
| Appraisal | {{appraisal_contingency_active}} | {{appraisal_deadline_date}} | {{appraisal_contingency_status}} | {{appraisal_resolution}} |
| Financing | {{financing_contingency_active}} | {{financing_deadline_date}} | {{financing_contingency_status}} | {{financing_resolution}} |

---

## DOCUMENT STATUS

| Document | Required | Status | Confirmed By | Date |
|---|---|---|---|---|
| Agency Disclosure | Yes | {{agency_disclosure_status}} | {{agency_disclosure_confirmed_by}} | {{agency_disclosure_date}} |
| Wire Fraud Advisory | Yes | {{wire_fraud_status}} | {{wire_fraud_confirmed_by}} | {{wire_fraud_date}} |
| Purchase Agreement | Yes | {{purchase_agreement_status}} | {{purchase_agreement_confirmed_by}} | {{purchase_agreement_date}} |
| Earnest Money Receipt | Yes | {{emr_status}} | {{emr_confirmed_by}} | {{emr_date}} |
| Lead Paint Disclosure | {{lead_paint_required}} | {{lead_paint_status}} | {{lead_paint_confirmed_by}} | {{lead_paint_date}} |
| Inspection Response | If applicable | {{inspection_response_status}} | {{inspection_response_confirmed_by}} | {{inspection_response_date}} |
| Contingency Removal | Yes | {{contingency_removal_status}} | {{contingency_removal_confirmed_by}} | {{contingency_removal_date}} |
| Final Walkthrough Attestation | Yes | {{walkthrough_attestation_status}} | {{walkthrough_attestation_confirmed_by}} | {{walkthrough_attestation_date}} |

---

## THIRD-PARTY DOCUMENT TRACKING

*Documents generated externally — TC tracks receipt only*

| Document | Expected From | Status | Received Date |
|---|---|---|---|
| Pre-Approval Letter | {{lender_name}} | {{pre_approval_status}} | {{pre_approval_received}} |
| Home Inspection Report | Inspector | {{inspection_report_status}} | {{inspection_report_received}} |
| Appraisal Report | {{lender_name}} | {{appraisal_report_status}} | {{appraisal_report_received}} |
| Loan Estimate | {{lender_name}} | {{loan_estimate_status}} | {{loan_estimate_received}} |
| Preliminary Title Report | {{title_company}} | {{title_report_status}} | {{title_report_received}} |
| Natural Hazard Disclosure | Third-party provider | {{nhd_status}} | {{nhd_received}} |
| HOA Documents | HOA / Seller | {{hoa_docs_status}} | {{hoa_docs_received}} |
| Closing Disclosure | {{lender_name}} | {{cd_status}} | {{cd_received}} |
| ALTA Settlement Statement | {{escrow_company}} | {{alta_status}} | {{alta_received}} |

---

## ALERT LOG

| Alert Type | Deadline | Sent At | Method | Acknowledged |
|---|---|---|---|---|
| 48hr warning | {{deadline_name}} | {{alert_sent_at}} | Slack DM | [ ] Yes [ ] No |
| 24hr warning | {{deadline_name}} | {{alert_sent_at}} | Slack DM | [ ] Yes [ ] No |
| Risk flag | {{risk_type}} | {{flag_sent_at}} | Slack DM | [ ] Yes [ ] No |
| Escalation | {{escalation_reason}} | {{escalation_sent_at}} | Diana DM | [ ] Yes [ ] No |

---

## KEY CONTACTS

| Party | Name | Phone | Email |
|---|---|---|---|
| Assigned Agent | {{agent_name}} | {{agent_phone}} | {{agent_email}} |
| Buyer | {{buyer_name}} | {{buyer_phone}} | {{buyer_email}} |
| Seller | {{seller_name}} | {{seller_phone}} | {{seller_email}} |
| Cooperating Agent | {{cooperating_agent}} | {{cooperating_agent_phone}} | — |
| Lender | {{lender_name}} | {{lender_phone}} | — |
| Escrow Officer | {{escrow_officer}} | {{escrow_phone}} | — |
| Title Officer | {{title_officer}} | {{title_phone}} | — |
| Inspector | {{inspector_name}} | {{inspector_phone}} | — |

---

**⚠ TC MONITORING RULE**
This tracker is live from deal activation through closing.
Alerts fire automatically at 48hr and 24hr before every deadline.
Missed deadlines escalate to Diana within 5 minutes.

---
**INTERNAL — TC TRACKER LOG**
Activated: {{activated_at}} | Deal: {{deal_id}} | Last updated: {{updated_at}}
Stage: {{current_stage}} | Next deadline: {{next_deadline_name}} on {{next_deadline_date}}
