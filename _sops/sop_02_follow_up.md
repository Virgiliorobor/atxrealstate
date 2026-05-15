# SOP 02 — Lead Follow-Up
> Trigger: Automatic daily check OR agent command `followup #[deal_id]`
> Owner: Orchestrator (monitoring) → Client Communication (draft) → Agent (sends)
> Database: sop.active_sop = "sop_02_follow_up" written at trigger

---

## TRIGGER CONDITIONS

**Automatic trigger — Orchestrator daily check (8am):**
Scans all deals where:
- `stage` is `confirmed` or `active`
- `reporting.last_contact` is older than follow-up interval
- `meta.cold_at` is null (deal is not cold)

**Manual trigger — agent command:**
`followup #089-buyer` → Orchestrator loads SOP 02 immediately

**Follow-up intervals (configurable per deal):**
```
first_followup:   3 days after initial brief (sop_01 complete)
second_followup:  7 days after first follow-up
third_followup:   14 days after second follow-up
reengagement:     30 days after third (if still no response)
```

---

## STEP SEQUENCE

### STEP 1 — Orchestrator: Detect and Load
```
Orchestrator daily check OR manual trigger:
  → Identifies deal(s) where follow-up is due
  → Loads deal record from database
  → Determines follow-up number (1st, 2nd, 3rd, reengagement)
  → Loads agent profile

Orchestrator:
  → Logs: EVT "followup_triggered"
  → Updates database: sop.active_sop = "sop_02_follow_up"
  → Routes to Client Communication
```

### STEP 2 — Client Communication: Draft Follow-Up
```
Orchestrator → Client Communication:
  Context: deal record, agent profile (full voice),
           followup_number: 1/2/3/reengagement
           last_contact_date, what_was_sent_last,
           sop_context step 2

Client Communication:
  → Reads deal record: what brief was sent, which properties shown,
    client profile, lead source, how long since last contact
  → Selects tone based on followup_number:
      1st: warm check-in, light reference to brief sent
      2nd: adds new information (new listing or market update)
      3rd: brief and genuine, no pressure
      reengagement: very light, acknowledges time passed
  → Drafts in agent's voice
  → References specific content — not generic

Client Communication → Orchestrator:
  sop_step_complete: 2
  next_specialist_needed: null
  output: followup_draft, followup_number, tone_used

Orchestrator:
  → Logs: EVT "followup_draft_generated"
  → Updates database: sop.current_step = 3
  → Posts draft to agent's deal channel
```

### STEP 3 — Agent: Reviews and Sends
```
Orchestrator → Agent (Slack #[deal_id]-[side]):
  "Follow-up [N] ready for [client_name].
   Last contact: [X] days ago.
   → [Review Draft]
   Or mark cold: `cold #[deal_id]-[side]`"

Agent:
  → Reviews draft
  → Edits if needed
  → Sends to client

Orchestrator (on agent send signal):
  → Logs: EVT "followup_sent", COMM-[N]
  → Updates database:
      reporting.last_contact = [timestamp]
      communications[] ← new entry
      sop.completed_at = [timestamp]
  → Sets next follow-up timer based on interval schedule
  → SOP 02 COMPLETE (until next interval)
```

### STEP 4 — No Response After Reengagement
```
If reengagement message sent and no response in 14 days:

Orchestrator → Agent (Slack DM):
  "⚠ No response from [client_name] in 30+ days.
   Options:
   → Mark cold: `cold #[deal_id]-[side]`
   → One more try: `followup #[deal_id]-[side]`
   → Keep open: ignore this message"

Agent decides:
  cold → Orchestrator updates stage to cold, archives
  one more → SOP 02 restarts
  no action → Orchestrator checks again in 30 days
```

---

## DATABASE WRITES — FULL SOP 02

| Step | Event Logged | Fields Updated |
|---|---|---|
| 1 | followup_triggered | sop.active_sop, sop.current_step |
| 2 | followup_draft_generated | sop.current_step |
| 3 | followup_sent | sop.completed_at, reporting.last_contact, communications[] |
| 4 (if cold) | deal_marked_cold | stage, meta.cold_at, meta.cold_reason |

---

## FOLLOW-UP TONE GUIDE

| Follow-up | Days Since Last Contact | Tone | Content |
|---|---|---|---|
| 1st | 3 days | Warm check-in | Reference specific property from brief |
| 2nd | 10 days | Helpful update | New listing or market shift relevant to their criteria |
| 3rd | 24 days | Genuine, brief | Simple "still here when you're ready" |
| Reengagement | 54+ days | Very light | Acknowledge time, open door, no pressure |

---

*SOP version: 1.0*
*Chained from: sop_01_new_lead (Step 6 sets the first trigger)*
*Chains to: nothing — repeats on interval until cold or deal advances*
