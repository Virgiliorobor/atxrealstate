# _config / brand_standards.md
> The Agency — Brand Standards Reference
> Owned by: Diana (Principal)
> Read by: All specialists producing client-facing output
> Updated by: Diana via dashboard settings

---

## PURPOSE

This file defines the visual, voice, and quality standards for every client-facing output the system produces — documents, listing pages, communication drafts, and forms. Every specialist checks their output against these standards before returning it to the Orchestrator.

One rule above all: **Diana's team is boutique by design. Every output reflects that — or it does not go out.**

---

## 1. VOICE AND TONE STANDARDS

### The Boutique Principle
Diana's team turns down volume to do better work. That philosophy must show in every word the system produces. Outputs are never generic, never rushed, never templated in a way that feels templated.

### Universal Voice Rules (all specialists, all outputs)

**Always:**
- Write for one person, not an audience
- Use the client's name — not "the buyer" or "the seller"
- Be specific — real numbers, real dates, real addresses
- Sound like a trusted advisor, not a service provider
- Match the register of the situation — celebration sounds different from bad news

**Never:**
- Use corporate filler: "please do not hesitate," "as per our conversation," "I wanted to reach out"
- Use passive voice to avoid directness: "it has been determined" → "I determined"
- Use hedging language without substance: "hopefully," "I think maybe," "fingers crossed"
- Sound like a form letter — if it could have been sent to anyone, rewrite it
- Reference the AI system in any client-facing output

### Agent Voice Override
Every communication output defers to the assigned agent's profile in `_config/agent_profiles/`. The agent profile is the primary voice reference. These brand standards are the floor — agent profiles build on top of them.

---

## 2. DOCUMENT STANDARDS

### Formatting
- All documents use consistent header: firm name, document title, date, deal ID
- Section headers are clear and scannable
- Key terms (dates, prices, names) are **bold** for easy review
- Placeholder format: `{{variable_name}}` — never left blank in final output
- Page structure: header → body sections → signature block → footer

### Document Header Template
```
DIANA CASTELLANO REAL ESTATE
[Document Title]
Deal: #[ID]-[side] | Date: [Date] | Agent: [Agent Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Document Footer Template
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This document was prepared by Diana Castellano Real Estate.
Questions: [agent_email] | [agent_phone]
```

### Quality Gate for Documents
Before any document reaches the agent confirmation gate it must pass:
- [ ] All `{{placeholders}}` resolved — no blanks
- [ ] Client name spelled correctly and consistently throughout
- [ ] Dates in consistent format: Month DD, YYYY (May 15, 2026)
- [ ] Dollar amounts formatted consistently: $612,000 (not $612000 or 612,000)
- [ ] Deal ID present in header
- [ ] Correct agent name and contact in footer

---

## 3. LISTING WEBSITE STANDARDS

### Design Philosophy
Editorial, not transactional. Each listing tells a story. The website feels curated — fewer listings shown with more depth per property. Photography leads. Text supports.

### Photography Standards
- Hero image: exterior shot, golden hour preferred, no clutter in foreground
- Minimum 3 photos required for publication
- Maximum hero image width: full browser width
- No watermarks, no agent headshots in property photos
- Gallery order: exterior → living spaces → kitchen → bedrooms → bathrooms → yard/outdoor

### Listing Page Structure
```
1. Full-width hero image
2. Property headline (punchy, character-forward — not a spec list)
3. Key attributes: price | beds | baths | sqft | year | garage | HOA
4. Property narrative (3-5 paragraphs — story, not specs)
5. Photo gallery
6. Neighborhood context (pulled from _catalog/neighborhoods/)
7. Agent card (name, photo, personal note, contact)
8. Contact / schedule showing form
```

### Headline Standards
Good headlines lead with character, not specs:
- ✓ "Character Bungalow in the Heart of Travis Heights — Original Details, Updated Kitchen"
- ✓ "Modern Infill on the Edge of Lady Bird Lake — Rooftop Views, Walkable to Everything"
- ✗ "3BR/2BA Single Family Home in 78704"
- ✗ "Great Location! Must See!"

### Narrative Standards
The property narrative is written in the editorial voice — describing the experience of living there, not listing features:
- Lead with the feeling of the property, then the details
- Reference the neighborhood naturally — not as a sales pitch
- Mention renovation potential honestly — do not obscure condition issues
- 150–300 words per narrative
- Written in present tense: "The living room opens to..." not "The living room opened to..."

### What Never Appears on the Listing Website
- Agent_notes (internal only)
- Bottom_line_price
- Days on market count (shown internally only)
- Prior offer history
- Seller motivation or timeline

---

## 4. CLIENT-FACING FORM STANDARDS

### Design Principles
- Mobile-first — clients fill on their phones
- One question per screen where possible
- Progress indicator showing steps remaining
- Plain language — no legal jargon in form fields
- Required fields clearly marked
- Helpful placeholder text showing expected format

### Form Header
```
[Form Title]
[Firm name] · Deal #[ID] · [Agent name]
"[One sentence explaining why this information is needed]"
```

### Form Confirmation
After submission, client sees:
```
Thank you — [Agent name] will review this shortly.
If you have questions: [agent_phone]
```

### What Never Appears in Client Forms
- Internal deal notes
- Bottom_line_price
- Other client information (no cross-contamination between deals)
- System or AI references

---

## 5. ALERT AND NOTIFICATION STANDARDS

### Slack Alert Formatting
Alerts are scannable at a glance. Structure is always:
```
[EMOJI] [URGENCY] TYPE — #[deal_id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[What happened / what is due]
[When]
[What the agent needs to do]
→ [Available action or link]
```

Urgency emojis:
- 🔔 Standard alert (48hr deadline)
- 🔴 Urgent (24hr or missed deadline)
- ⚑ Risk flag (immediate attention)
- ✅ Confirmation / completion
- 🎉 Celebration (offer accepted, deal closed)

### Dashboard Notification Standards
- Active deals sorted by urgency — most urgent first
- Overdue items always at top, highlighted
- Completed items visually distinct from pending
- No more than 3 action items per deal shown on overview — click through for full detail

---

## 6. QUALITY CHECKLIST — ALL CLIENT-FACING OUTPUTS

Before any output reaches the agent confirmation gate, the producing specialist verifies:

**Content**
- [ ] Client name correct and consistent
- [ ] Deal ID present
- [ ] All data from confirmed deal record — nothing inferred
- [ ] No internal fields surfaced (agent_notes, bottom_line_price, flags)
- [ ] No AI system references

**Voice**
- [ ] Agent profile loaded and applied (communication outputs)
- [ ] No corporate filler phrases
- [ ] Specific to this client and deal — not generic

**Format**
- [ ] Consistent date format (Month DD, YYYY)
- [ ] Consistent currency format ($XXX,XXX)
- [ ] Placeholders resolved
- [ ] Structure matches template for document type

**Standards**
- [ ] Passes boutique quality bar — would Diana approve this?
- [ ] Correct agent sign-off (communication outputs)
- [ ] Wire fraud advisory present (closing documents)

---

*Last updated: May 2026*
*Update process: Diana edits directly or requests update via dashboard settings*
