import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const CHANNELS = ["#019-buyer", "#412-buyer", "#327-seller", "#inbound-lead", "#open-entry"] as const;
const AGENCY_WEBSITE_URL =
  import.meta.env.VITE_AGENCY_WEBSITE_URL || "/the_agency_website/";

type ChannelId = (typeof CHANNELS)[number];

const CHANNEL_SUBTITLE: Record<ChannelId, string> = {
  "#019-buyer": "Marco · Jordan Kim · ATX-012 offer",
  "#412-buyer": "Elena · Chen · Due diligence · ⚠ 2 flags",
  "#327-seller": "Carlos · Hoffman · Offer received · 28 DOM",
  "#inbound-lead": "New inquiry · ATX-004 · Website lead",
  "#open-entry": "Diana Castellano · Principal · Open sandbox",
};

const CHANNEL_AGENT: Record<ChannelId, string> = {
  "#019-buyer": "Marco Reyes · Junior Agent · Guided mode",
  "#412-buyer": "Elena Reyes · Senior Agent · Buyer specialist",
  "#327-seller": "Carlos Mendoza · Senior Agent · Listing specialist",
  "#inbound-lead": "Unassigned · Lead qualification pending",
  "#open-entry": "Diana Castellano · Principal · Open entry",
};

const CHANNEL_USER_LABEL: Record<ChannelId, string> = {
  "#019-buyer": "Marco Reyes",
  "#412-buyer": "Elena Reyes",
  "#327-seller": "Carlos Mendoza",
  "#inbound-lead": "You",
  "#open-entry": "Diana Castellano",
};

const CHANNEL_WELCOME: Record<ChannelId, string> = {
  "#019-buyer": `**Marco Reyes · Junior Agent · Guided Mode**

Deal #019 is on file: **Jordan Kim** reached out about ATX-012 — the 4BR in Parmer Village listed at **$480K**. He texted saying he wants to offer $475K, but pre-approval hasn't been confirmed yet.

The system walks you through each step of the lead intake SOP, explains what it's checking and writing, and keeps you on track. Type naturally or use a chip below.`,

  "#412-buyer": `**Elena Reyes · Senior Agent · Deal #412 — Due Diligence**

**Chen deal** · ATX-016, Travis Heights · $612K contract · Closing May 28

Two open flags need attention:
- ⚠️ **Appraisal gap** — appraised at $589K vs. $612K contract ($23K under) · deadline May 20
- 🔴 **Inspection response** — $8K roof credit offered by seller, response still pending

Earnest money ($12K) posted. Five deadlines remain before closing.`,

  "#327-seller": `**Carlos Mendoza · Senior Agent · Deal #327 — Active Listing**

**Hoffman listing** · 1842 Rivercrest Drive · Listed at $849K · **28 days on market**

Patricia & James Hoffman are motivated — downsizing to a downtown condo. A buyer just submitted at **$810K**. Patricia wants to counter at $835K.

Draft the counter, pull comparable sales, and prep talking points for your call with Patricia.`,

  "#inbound-lead": `**New Inquiry · Via Agency Website** · Just now

A buyer submitted through the listing page.

**Sarah Martinez** · sarah.m@email.com
*"I've been pre-approved up to $900K and I'm ready to move in 60 days. ATX-004 caught my eye — can we schedule a showing this week?"*

**ATX-004** · Modern Urban · East Austin · $895,000 · 1,500 sqft

This lead hasn't been qualified or assigned yet. The lead intake SOP is ready to run.`,

  "#open-entry": `**Diana Castellano · Principal · Open Sandbox**

No active deal loaded. Ask anything — strategy, how the system works, cross-deal questions, market analysis, or hypotheticals.

Reference any deal (#412-buyer, #327-seller, #019-buyer) or property (ATX-001 through ATX-016) to load live context. Switch to another channel for the scripted agent scenarios.`,
};

const CHANNEL_START_CHIPS: Record<ChannelId, string[]> = {
  "#019-buyer": [
    "Jordan Kim texted me — he wants to offer $475K on ATX-012. What do I do first?",
    "status #019-buyer",
    "brief ATX-012",
    "help",
  ],
  "#412-buyer": [
    "How do we handle the $23K appraisal gap?",
    "Draft the inspection response for #412-buyer",
    "What's still open before closing?",
    "status #412-buyer",
  ],
  "#327-seller": [
    "Draft a counter-offer at $835K on the Hoffman listing",
    "What do 28 DOM comps look like in this price range?",
    "Draft talking points for my call with Patricia Hoffman",
    "status #327-seller",
  ],
  "#inbound-lead": [
    "Qualify Sarah Martinez for ATX-004",
    "Create a deal record for Sarah",
    "What other East Austin properties match a $900K budget?",
    "brief ATX-004",
  ],
  "#open-entry": [
    "What's the status across all active deals?",
    "How does the system route a new lead?",
    "What are the risks on #412-buyer?",
    "Generate a brief for ATX-002",
  ],
};

function followUpChips(lastUserText: string, ch: ChannelId): string[] {
  const t = lastUserText.trim().toLowerCase();
  if (t.includes("atx-012") || t.includes("#019")) {
    return ["brief ATX-012", "What documents do I need from Jordan?"];
  }
  if (t.includes("intake") || t.includes("sop") || (ch === "#019-buyer" && t.includes("first"))) {
    return ["What's the next step?", "Is Jordan pre-approved?"];
  }
  if (t.includes("appraisal gap") || t.includes("appraisal")) {
    return ["Draft the inspection response for #412-buyer", "What's left before closing?"];
  }
  if (t.includes("status #412")) {
    return ["How do we handle the $23K appraisal gap?", "Draft inspection response"];
  }
  if (t.includes("counter") || t.includes("hoffman")) {
    return ["Draft talking points for my call with Patricia", "What do comps say at 28 DOM?"];
  }
  if (t.includes("sarah") || t.includes("atx-004") || t.includes("qualify")) {
    return ["Create a deal record for Sarah", "brief ATX-004"];
  }
  if (t.includes("comps") || t.includes("travis_heights")) {
    return ["brief ATX-016", "draft seller_update #327-seller"];
  }
  return [];
}

function logLineClass(line: { icon: string; label: string }): string {
  const L = line.label.toLowerCase();
  if (line.icon.includes("⚠") || L.includes("risk") || (L.includes("flag") && L.includes("alert"))) {
    return "log-line log--risk";
  }
  if (L.includes("evt") || L.includes("logged") || L.includes("database") || line.icon === "🗄️") {
    return "log-line log--db";
  }
  if (line.icon === "✅" || L.includes("complete") || (L.includes("generated") && L.includes("returning"))) {
    return "log-line log--ok";
  }
  if (
    line.icon === "🔍" ||
    line.icon === "👤" ||
    line.icon === "✉️" ||
    line.icon === "📋" ||
    line.icon === "🏠" ||
    L.includes("routing") ||
    L.includes("specialist")
  ) {
    return "log-line log--spec";
  }
  if (line.icon === "🎯" || L.includes("orchestrator")) {
    return "log-line log--orch";
  }
  return "log-line";
}

function memoryKindIcon(kind: MemoryEntry["kind"]): string {
  switch (kind) {
    case "risk":
      return "⚠️";
    case "communication":
      return "✉️";
    case "deadline":
      return "⏱️";
    case "event":
    default:
      return "🗂️";
  }
}

type ActivityItem = { time: string; icon: string; label: string };
type ResponseMeta = {
  model: string;
  stop_reason: string | null;
  output_tokens: number;
  input_tokens: number;
  latency_ms: number;
  max_tokens: number;
};
type MemoryEntry = {
  id: string;
  time: string;
  source: string;
  kind: "event" | "communication" | "risk" | "deadline";
  title: string;
  detail: string;
};

type UiBlock =
  | { type: "brief"; title: string; markdown: string }
  | { type: "listing_preview"; title: string; property_id: string; markdown: string };

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  who: string;
  text: string;
  ui_blocks?: UiBlock[];
  chips?: string[];
};

const SPECIALIST_LABEL: Record<string, string> = {
  orchestrator: "🎯 Orchestrator",
  "00_orchestrator": "🎯 Orchestrator",
  "01_lead_qualifier": "👤 Lead Qualifier",
  "02_property_research": "🔍 Property Research",
  "03_client_communication": "✉️ Client Communication",
  "04_transaction_coordinator": "📋 Transaction Coordinator",
  "05_listing_manager": "🏠 Listing Manager",
};

function botLabel(specialist: string | null): string {
  if (!specialist) return "🎯 Orchestrator";
  if (SPECIALIST_LABEL[specialist]) return SPECIALIST_LABEL[specialist];
  const short = specialist.replace(/^\d+_/, "");
  const hit = Object.keys(SPECIALIST_LABEL).find((k) => k.includes(short));
  if (hit) return SPECIALIST_LABEL[hit];
  return `🎯 ${specialist}`;
}

function Onboarding({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <p className="mono-eyebrow">The Agency · AI Operating System</p>
        <h1 className="headline-lg">Diana Castellano Real Estate</h1>
        <p className="body-lg" style={{ maxWidth: "56ch", marginTop: "1rem" }}>
          Six AI specialists working alongside a boutique Austin team — across the full transaction
          lifecycle, grounded in live deal data and persistent memory.
        </p>
        <a className="agency-site-link" href={AGENCY_WEBSITE_URL} target="_blank" rel="noreferrer">
          View the property catalog ↗
        </a>
      </div>

      <hr className="neo-rule" />

      <section>
        <h2 className="headline-md">What it does</h2>
        <ul className="onboarding-caps">
          <li>
            <strong>Reads &amp; writes deal JSON</strong> — persistent memory that survives sessions, not
            just conversation history
          </li>
          <li>
            <strong>SOP-guided workflows</strong> — walks new agents through each step, explaining what
            it&apos;s checking and why
          </li>
          <li>
            <strong>Briefs &amp; documents on demand</strong> — property snapshots, offer responses,
            client emails — downloadable as PDF
          </li>
          <li>
            <strong>Full transaction pipeline</strong> — inbound lead → qualification → offer → due
            diligence → close
          </li>
          <li>
            <strong>Live risk tracking</strong> — appraisal gaps, inspection deadlines, financing flags —
            surfaced before they become problems
          </li>
        </ul>
      </section>

      <h2 className="headline-md" style={{ marginTop: "2.5rem" }}>
        Four scenarios to explore
      </h2>
      <div className="onboarding-grid onboarding-grid--channels">
        <div className="neo-card onboarding-card">
          <div className="onboarding-card-title">#019-buyer · Marco · Guided</div>
          <h3>New agent + lead intake</h3>
          <p>
            Marco just got a text from Jordan Kim wanting to offer $475K on ATX-012. The system walks
            him through the intake SOP step by step, explains every action, and writes the deal record
            to disk.
          </p>
          <button type="button" className="chip" disabled>
            "Jordan texted me about ATX-012…"
          </button>
        </div>
        <div className="neo-card onboarding-card">
          <div className="onboarding-card-title">#412-buyer · Elena · Due Diligence</div>
          <h3>Active deal management</h3>
          <p>
            Chen deal — $612K under contract with two open flags: a $23K appraisal gap and an
            inspection response still pending. Real JSON on disk, real deadlines, real risk flags.
          </p>
          <button type="button" className="chip" disabled>
            "Handle the appraisal gap"
          </button>
        </div>
        <div className="neo-card onboarding-card">
          <div className="onboarding-card-title">#327-seller · Carlos · Listing</div>
          <h3>Seller-side + offer strategy</h3>
          <p>
            Hoffman listing, 28 DOM, just received a $810K offer on their $849K list. Draft the
            counter at $835K, pull comparable sales, prep Patricia&apos;s talking points for the call.
          </p>
          <button type="button" className="chip" disabled>
            "Draft counter at $835K"
          </button>
        </div>
        <div className="neo-card onboarding-card">
          <div className="onboarding-card-title">#inbound-lead · New inquiry</div>
          <h3>Website lead → deal creation</h3>
          <p>
            Sarah Martinez submitted an inquiry from the listing page for ATX-004 ($895K, East
            Austin). Qualify the lead, create the deal record, assign to an agent — or trigger this
            directly from the agency website.
          </p>
          <button type="button" className="chip" disabled>
            "Qualify Sarah for ATX-004"
          </button>
        </div>
      </div>

      <div className="onboarding-cta">
        <button type="button" className="btn btn--primary" onClick={onEnter}>
          Enter demo →
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [channel, setChannel] = useState<ChannelId>("#019-buyer");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserText, setLastUserText] = useState("");
  const [requestStartedAt, setRequestStartedAt] = useState<number | null>(null);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [lastResponseMeta, setLastResponseMeta] = useState<ResponseMeta | null>(null);
  const [viewMode, setViewMode] = useState<"conversation" | "workspace">("conversation");
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);

  const refreshMemory = useCallback(
    async (targetChannel: ChannelId = channel) => {
      setMemoryLoading(true);
      try {
        const r = await fetch(`/api/channel-memory?channel=${encodeURIComponent(targetChannel)}`);
        const data = await r.json();
        if (Array.isArray(data?.entries)) {
          setMemoryEntries(data.entries as MemoryEntry[]);
        } else {
          setMemoryEntries([]);
        }
      } catch {
        setMemoryEntries([]);
      } finally {
        setMemoryLoading(false);
      }
    },
    [channel]
  );

  const seededWelcome = useMemo((): ChatMessage[] => {
    const id = `welcome-${channel}`;
    return [
      {
        id,
        role: "bot",
        who: "🎯 Orchestrator",
        text: CHANNEL_WELCOME[channel],
        chips: CHANNEL_START_CHIPS[channel],
      },
    ];
  }, [channel]);

  useEffect(() => {
    if (!onboarded) return;
    setMessages(seededWelcome);
    setActivity([]);
    setError(null);
    setLastUserText("");
  }, [channel, seededWelcome, onboarded]);

  useEffect(() => {
    if (!onboarded) return;
    void refreshMemory(channel);
  }, [channel, onboarded, refreshMemory]);

  // Handle inquiry deep-link from agency website listing page: /?inquiry=ATX-004&addr=...&price=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inquiry = params.get("inquiry");
    if (!inquiry) return;
    const addr = params.get("addr") || "";
    const priceRaw = params.get("price") || "";
    const headline = params.get("headline") || inquiry;
    const priceStr = priceRaw ? `$${parseInt(priceRaw, 10).toLocaleString()}` : "";
    setOnboarded(true);
    setChannel("#inbound-lead");
    setInput(
      `New website inquiry: a buyer is interested in ${inquiry}${headline !== inquiry ? ` — ${headline}` : ""}${addr ? `, ${addr}` : ""}${priceStr ? `, listed at ${priceStr}` : ""}. They are pre-approved and ready to move quickly. What's the first step?`
    );
    window.history.replaceState({}, "", window.location.pathname);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading || !requestStartedAt) return;
    const tick = () => {
      setThinkingSeconds(Math.max(0, Math.floor((Date.now() - requestStartedAt) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [loading, requestStartedAt]);

  const sendWithText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || loading) return;
      setInput("");
      setError(null);
      setLastUserText(text);
      setLastResponseMeta(null);
      const uid = `u-${Date.now()}`;
      const userLabel = CHANNEL_USER_LABEL[channel];
      setMessages((m) => [...m, { id: uid, role: "user", who: userLabel, text }]);
      setLoading(true);
      setThinkingSeconds(0);
      setRequestStartedAt(Date.now());
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, channel }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);

        const spec = data.specialist_activated as string | null;
        const bid = `b-${Date.now()}`;
        setMessages((m) => [
          ...m,
          {
            id: bid,
            role: "bot",
            who: botLabel(spec),
            text: data.chat_response || "",
            ui_blocks: data.ui_blocks,
          },
        ]);

        const log: ActivityItem[] = Array.isArray(data.activity_log) ? data.activity_log : [];
        setActivity((a) => [...log, ...a]);
        if (data?._meta && typeof data._meta === "object") {
          setLastResponseMeta(data._meta as ResponseMeta);
        }
        void refreshMemory(channel);

        if (data.persistence?.errors?.length) {
          setError(data.persistence.errors.join("; "));
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
        setRequestStartedAt(null);
      }
    },
    [channel, loading]
  );

  const send = useCallback(() => {
    void sendWithText(input);
  }, [input, sendWithText]);

  const applyProperty = async (propertyId: string, markdown: string) => {
    setError(null);
    try {
      const res = await fetch("/api/apply-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, markdown }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setActivity((a) => [
        {
          time: new Date().toTimeString().slice(0, 8),
          icon: "🗄️",
          label: `Property ${propertyId} written to _catalog/properties/`,
        },
        ...a,
      ]);
      void refreshMemory(channel);
    } catch (e) {
      setError(String(e));
    }
  };

  const downloadBrief = async (title: string, markdown: string) => {
    setError(null);
    try {
      const res = await fetch("/api/brief-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, markdown }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.error || res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9-_ ]/gi, "_").trim() || "brief"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const goHome = useCallback(() => {
    setOnboarded(false);
    setChannel("#019-buyer");
    setMessages([]);
    setActivity([]);
    setInput("");
    setError(null);
    setLastUserText("");
    setLoading(false);
    setRequestStartedAt(null);
    setThinkingSeconds(0);
    setLastResponseMeta(null);
    setViewMode("conversation");
    setMemoryEntries([]);
  }, []);

  const followUps = followUpChips(lastUserText, channel);
  const recentMemory = useMemo(() => memoryEntries.slice(-6).reverse(), [memoryEntries]);

  if (!onboarded) {
    return <Onboarding onEnter={() => setOnboarded(true)} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <div>
              <div className="brand-mark">ATX Boutique Real Estate</div>
              <div className="brand-sub">The Agency · Live demo · Diana Castellano, Principal</div>
              <a className="brand-site-link" href={AGENCY_WEBSITE_URL} target="_blank" rel="noreferrer">
                Agency website ↗
              </a>
            </div>
            <button type="button" className="nav-home-btn" onClick={goHome} title="Back to intro">
              Home
            </button>
          </div>
        </div>
        <ul className="channel-list">
          {CHANNELS.map((ch) => (
            <li key={ch}>
              <button
                type="button"
                className={`channel-btn ${channel === ch ? "active" : ""}`}
                onClick={() => setChannel(ch)}
              >
                <span className="channel-name">{ch}</span>
                <span className="channel-sub">{CHANNEL_SUBTITLE[ch]}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-memory">
          <div className="sidebar-memory-title">Recent memory</div>
          {memoryLoading ? (
            <div className="sidebar-memory-empty">Loading…</div>
          ) : recentMemory.length === 0 ? (
            <div className="sidebar-memory-empty">No persisted entries yet.</div>
          ) : (
            <div className="sidebar-memory-list">
              {recentMemory.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="sidebar-memory-item"
                  onClick={() => setViewMode("workspace")}
                  title={`${e.title} — ${e.detail}`}
                >
                  <span className="sidebar-memory-icon">{memoryKindIcon(e.kind)}</span>
                  <span className="sidebar-memory-copy">
                    <span className="sidebar-memory-item-title">{e.title}</span>
                    <span className="sidebar-memory-item-meta">
                      {e.time || "--:--:--"} · {e.source}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="agent-strip">{CHANNEL_AGENT[channel]}</div>
      </aside>

      <main className="chat">
        {error ? <div className="err-banner">{error}</div> : null}
        <header className="chat-header">
          <span>{channel}</span>
          <div className="view-toggle">
            <button
              type="button"
              className={`view-btn ${viewMode === "conversation" ? "active" : ""}`}
              onClick={() => setViewMode("conversation")}
            >
              Live chat
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === "workspace" ? "active" : ""}`}
              onClick={() => setViewMode("workspace")}
            >
              Workspace feed
            </button>
          </div>
        </header>
        <div className="messages">
          {viewMode === "workspace" ? (
            <div className="workspace-feed">
              <div className="workspace-intro">
                Timeline from deal memory (`events`, communications, risks, deadlines) + this live thread.
              </div>
              {memoryLoading ? (
                <div className="workspace-loading">Loading memory…</div>
              ) : memoryEntries.length === 0 ? (
                <div className="workspace-empty">No persisted memory entries for this channel yet.</div>
              ) : (
                memoryEntries.map((e) => (
                  <div key={e.id} className={`memory-card kind-${e.kind}`}>
                    <div className="memory-meta">
                      <span>{e.time || "--:--:--"}</span>
                      <span>{e.source}</span>
                      <span>{e.kind}</span>
                    </div>
                    <div className="memory-title">{e.title}</div>
                    <div className="memory-detail">{e.detail}</div>
                  </div>
                ))
              )}
              <div className="workspace-divider">Current live messages</div>
              {messages.map((m) => (
                <div key={m.id} className={`msg-row ${m.role}`}>
                  <div className="msg-meta">{m.who}</div>
                  <div className="msg-bubble">
                    {m.role === "bot" ? (
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    ) : (
                      <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`msg-row ${m.role}`}>
                <div className="msg-meta">{m.who}</div>
                <div className="msg-bubble">
                  {m.role === "bot" ? (
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                  )}
                  {m.chips && m.chips.length > 0 ? (
                    <div className="chip-row">
                      {m.chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="chip"
                          disabled={loading}
                          onClick={() => void sendWithText(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {m.ui_blocks?.map((bl, i) =>
                    bl.type === "brief" ? (
                      <div key={i} className="brief-card">
                        <div className="brief-eyebrow">Brief</div>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.35rem",
                            marginBottom: 12,
                            fontWeight: 600,
                          }}
                        >
                          {bl.title}
                        </div>
                        <ReactMarkdown>{bl.markdown}</ReactMarkdown>
                        <div className="apply-row" style={{ marginTop: 12 }}>
                          <button
                            type="button"
                            className="apply-btn"
                            onClick={() => downloadBrief(bl.title, bl.markdown)}
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="brief-card">
                        <div className="brief-eyebrow">Listing preview · {bl.property_id}</div>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.2rem",
                            marginBottom: 12,
                            fontWeight: 600,
                          }}
                        >
                          {bl.title}
                        </div>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            maxHeight: 220,
                            overflow: "auto",
                            border: "var(--border-thin)",
                            padding: 10,
                            background: "#fafafa",
                          }}
                        >
                          {bl.markdown}
                        </pre>
                        <div className="apply-row">
                          <button
                            type="button"
                            className="apply-btn"
                            onClick={() => applyProperty(bl.property_id, bl.markdown)}
                          >
                            Confirm · write catalog
                          </button>
                          <span className="apply-note">Diana gate simulated — you confirm here.</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {loading ? (
          <div className="thinking-strip">
            <span className="thinking-dot" />
            <span>AI is thinking… {thinkingSeconds}s</span>
          </div>
        ) : null}

        {!loading && lastResponseMeta ? (
          <div className="response-meta">
            model: {lastResponseMeta.model} · stop: {lastResponseMeta.stop_reason ?? "unknown"} · tokens:{" "}
            {lastResponseMeta.output_tokens}/{lastResponseMeta.max_tokens} out · latency:{" "}
            {Math.round(lastResponseMeta.latency_ms / 100) / 10}s
          </div>
        ) : null}

        {followUps.length > 0 ? (
          <div className="followup-strip">
            <div className="followup-label">Suggested next</div>
            <div className="chip-row">
              {followUps.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="chip"
                  disabled={loading}
                  onClick={() => void sendWithText(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="composer">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message… e.g. status #412-buyer"
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
          />
          <button type="button" className="send-btn" disabled={loading} onClick={send}>
            Send
          </button>
        </div>
      </main>

      <aside className="log">
        <header className="log-header">Activity</header>
        <div className="log-body">
          {activity.length === 0 ? (
            <div style={{ color: "var(--ink-muted)" }}>System feed updates after each send.</div>
          ) : (
            activity.map((line, i) => (
              <div key={i} className={logLineClass(line)}>
                <span className="log-time">{line.time}</span>
                <span>
                  {line.icon} {line.label}
                </span>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
