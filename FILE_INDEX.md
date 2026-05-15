# THE AGENCY — File Index
> Complete reference of every file in the system
> 71 files total | Version 1.0 | May 2026

---

## SPECIALIST FOLDERS — 41 files

### 00_orchestrator/ — Router and SOP Executor
| File | Purpose |
|---|---|
| `identity.md` | Who the Orchestrator is, what it owns, what it never does |
| `rules.md` | All routing rules, SOP detection, database write protocol |
| `examples.md` | 6 complete interaction scenarios across all agent types |
| `handoff.md` | Full context package schemas in and out, post-output protocol |

### 01_lead_qualifier/ — Lead Capture and Deal Creation
| File | Purpose |
|---|---|
| `identity.md` | Role definition, extraction philosophy, data accuracy rules |
| `rules.md` | Required fields by deal type, extraction rules, output mode behavior |
| `examples.md` | 4 scenarios: buyer lead, seller form, inconsistent data flag |
| `handoff.md` | Full output package schema, sop_context return block, failure modes |

### 02_property_research/ — Market Intelligence
| File | Purpose |
|---|---|
| `identity.md` | Two data sources, relationship with Listing Manager, never web pulls |
| `rules.md` | Data currency rules, appraisal support protocol, brief type selection |
| `examples.md` | 4 scenarios: neighborhood brief, property snapshot, CMA, appraisal support |
| `handoff.md` | All output types with sop_context, Listing Manager request protocol |

### 03_client_communication/ — Agent Voice and Drafting
| File | Purpose |
|---|---|
| `identity.md` | Voice loading (pre-loaded by Orchestrator), situation types, never sends |
| `rules.md` | Always/never rules, voice calibration per agent, situation-specific rules |
| `examples.md` | 7 drafts: welcome, competing offer, inspection, offer accepted, closing, post-close, reengagement |
| `handoff.md` | Output schemas with sop_context, trigger map, what is required per situation |

### 04_transaction_coordinator/ — Deadlines, Documents, Risk
| File | Purpose |
|---|---|
| `identity.md` | Document library, risk detection, data gap resolution, form types |
| `rules.md` | Deadline rules, document generation steps, SOP 03/04 rules, escalation table |
| `examples.md` | 6 scenarios: offer accepted, deadline alert, appraisal gap, missing data, wire form, Diana status |
| `handoff.md` | Full inter-specialist protocol, form handoff flow, stage activation checklists |

**04_transaction_coordinator/templates/_legaldocs/** — 11 Document Templates
| File | Document |
|---|---|
| `agency_disclosure.md` | Brokerage relationship disclosure |
| `exclusive_right_to_sell.md` | Listing agreement |
| `wire_fraud_advisory.md` | Wire fraud warning — required at every transaction |
| `cma_report.md` | Comparative market analysis |
| `seller_disclosure.md` | Seller property disclosure statement |
| `lead_based_paint_disclosure.md` | Federal requirement for pre-1978 properties |
| `purchase_agreement.md` | Offer summary and purchase agreement |
| `counter_offer.md` | Counter offer letter |
| `inspection_response.md` | Inspection response / request for repair |
| `contingency_removal.md` | Contingency removal form |
| `final_walkthrough_attestation.md` | Final walkthrough verification |

**04_transaction_coordinator/templates/_checklists/** — 4 Checklists
| File | Purpose |
|---|---|
| `buyer_checklist.md` | 40+ tasks across 7 phases — pre-offer through post-close |
| `seller_checklist.md` | 45+ tasks across 7 phases — pre-listing through post-close |
| `closing_checklist.md` | Precision closing checklist: 7-day, 3-day, day-before, closing day |
| `deadline_tracker.md` | Live deadline monitor with alert log and all document statuses |

### 05_listing_manager/ — Catalog Custodian and Website Engine
| File | Purpose |
|---|---|
| `identity.md` | Single writer to catalog, two roles (data custodian + website engine) |
| `rules.md` | Single writer rule, Diana approval gate, SOP 05 sequence, photo rules |
| `examples.md` | 7 scenarios: new listing, photo upload, data request, price change, sold, not found, health report |
| `handoff.md` | Inbound/outbound map, website generation protocol, failure modes |

**05_listing_manager/templates/** — 2 Templates
| File | Purpose |
|---|---|
| `listing_input_sheet.md` | 12-section MLS data entry document with verification checklist |
| `listing_page_template.md` | Editorial website listing page with all sections and metadata |

---

## CATALOG — 8 files

**_catalog/** — Verified Market Data
| File | Purpose |
|---|---|
| `schema.md` | Property record and deal record schema reference |
| `deal_states.md` | All 8 stages defined with transitions, specialist actions, duration |
| `document_registry.md` | All 27 transaction documents: firm-generated vs third-party split |

**_catalog/neighborhoods/** — Austin Market Research (May 2026)
| File | Coverage |
|---|---|
| `general_austin_market.md` | MSA overview, key metrics, market condition, agent talking points |
| `travis_heights.md` | 78704, median $855k, comps, schools, strategic notes |
| `east_austin.md` | 78702/78722, Holly/Cherrywood/Mueller/Govalle, I-35 project |
| `barton_hills.md` | 78704/78735, Eanes ISD note, flood/fire risk, bifurcated market |
| `north_austin.md` | 78757/78758, Allandale/Crestview, Gullett Elementary, tech corridor |

---

## CONFIG — 13 files

**_config/** — System Configuration
| File | Purpose |
|---|---|
| `brand_standards.md` | Voice, document format, website design, form, alert standards |
| `slack_commands.md` | Full command directory: syntax, trigger, permissions, quick reference card |
| `system_settings.yaml` | Global config: automation timing, security, market, database, website settings |

**_config/agent_profiles/** — 5 Agent Profiles (YAML + MD each)
| Agent | YAML | MD |
|---|---|---|
| Diana Castellano | `diana.yaml` — structured settings | `diana.md` — Miranda Priestly voice guide |
| Elena Reyes | `elena.yaml` — buyer specialist | `elena.md` — warm-professional voice guide |
| Carlos Mendoza | `carlos.yaml` — seller specialist | `carlos.md` — strategic-authoritative voice guide |
| Marco Reyes | `marco.yaml` — junior, guided mode | `marco.md` — energetic-authentic voice guide |
| Sara Kim | `sara.yaml` — new, review required | `sara.md` — thorough-warm voice guide |

---

## DATABASE — 2 files

**_database/** — Operational Memory Engine
| File | Purpose |
|---|---|
| `README.md` | How the database works, write protocol, reporting layer, future production path |
| `schema.json` | Master deal record template — fully populated with Chen deal (#412-buyer) at due_diligence stage. 10 events, 2 risk flags, 8 documents, SOP tracking block |

---

## SOPs — 6 files

**_sops/** — Standard Operating Procedures
| File | Trigger | Specialists Involved |
|---|---|---|
| `README.md` | — | How SOPs work with the Orchestrator, sop_context protocol |
| `sop_01_new_lead.md` | New lead reported | LQ → PR → LM → CC — 6 steps |
| `sop_02_follow_up.md` | Auto daily check or `followup` command | Orchestrator → CC — 4 steps |
| `sop_03_offer_received.md` | Offer reported | TC → CC → TC (if accepted) — 6 steps |
| `sop_04_weekly_digest.md` | Monday 8am automatic | Orchestrator → TC — 4 steps |
| `sop_05_listing_live.md` | `publish` command | LM → Diana → LM → CC — 6 steps |

---

## ROOT — 1 file

| File | Purpose |
|---|---|
| `README.md` | System overview, architecture diagram, deal flows, onboarding guide, design decisions |

---

## QUICK LOOKUP

**"Where is the rule about X?"**

| Topic | File |
|---|---|
| Slack handle → agent identity | `00_orchestrator/rules.md` |
| SOP detection and execution | `00_orchestrator/rules.md` |
| Deal stage transitions | `_catalog/deal_states.md` |
| bottom_line_price security | `00_orchestrator/rules.md`, `01_lq/rules.md`, `04_tc/rules.md` |
| Agent voice configuration | `_config/agent_profiles/[agent].md` |
| Deadline alert timing | `_config/system_settings.yaml`, `04_tc/rules.md` |
| Document templates path | `04_tc/templates/_legaldocs/` |
| Website publication approval | `05_listing_manager/rules.md`, `_sops/sop_05_listing_live.md` |
| Wire fraud requirement | `04_tc/templates/_legaldocs/wire_fraud_advisory.md`, `04_tc/templates/_checklists/closing_checklist.md` |
| Slack commands reference | `_config/slack_commands.md` |
| Database write protocol | `_database/README.md` |
| Brand and voice standards | `_config/brand_standards.md` |
| Sara review requirement | `_config/agent_profiles/sara.yaml`, `_config/system_settings.yaml` |
| Follow-up intervals | `_config/system_settings.yaml`, `_sops/sop_02_follow_up.md` |
| Neighborhood market data | `_catalog/neighborhoods/[zone].md` |

---

## FILE COUNT BY FOLDER

| Folder | Files |
|---|---|
| `00_orchestrator/` | 4 |
| `01_lead_qualifier/` | 4 |
| `02_property_research/` | 4 |
| `03_client_communication/` | 4 |
| `04_transaction_coordinator/` | 19 |
| `05_listing_manager/` | 6 |
| `_catalog/` | 8 |
| `_config/` | 13 |
| `_database/` | 2 |
| `_sops/` | 6 |
| Root | 1 |
| **TOTAL** | **71** |

---

*File Index Version: 1.0*
*System Version: 1.0*
*Last updated: May 2026*
