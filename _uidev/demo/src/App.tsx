import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const CHANNELS = ["#team-general", "#412-buyer", "#327-seller", "#open-entry"] as const;
const AGENCY_WEBSITE_URL =
  import.meta.env.VITE_AGENCY_WEBSITE_URL || "/the_agency_website/";

type ChannelId = (typeof CHANNELS)[number];

const CHANNEL_SUBTITLE: Record<ChannelId, string> = {
  "#team-general": "New lead intake →",
  "#412-buyer": "Chen · Due diligence · ⚠ 2 flags",
  "#327-seller": "Hoffman · Active · 28 DOM",
  "#open-entry": "Diana Castellano · Principal · Open sandbox",
};

const CHANNEL_WELCOME: Record<ChannelId, string> = {
  "#team-general": `You are **Marco Reyes** (guided mode — the system explains as it works).

This channel is for new business. Try starting a lead intake:

The system will extract structured data from your natural language, confirm it with you, create a deal record, and trigger research automatically.`,
  "#412-buyer": `**Chen deal** · $612,000 · Travis Heights · Due diligence stage

Two active risk flags:
- **Appraisal gap** — $23,000 below contract price  
- **Inspection response** — pending resolution

This deal is pre-loaded with real data. Every command returns live AI responses based on the actual deal record.`,
  "#327-seller": `**Hoffman listing** · $725,000 · Travis Heights · **28 DOM** · No offer yet

Price review threshold approaching. Market context available.

Pull neighborhood data, property snapshots, and draft client updates.`,
  "#open-entry": `**Open entry** — you are **Diana Castellano**, principal.

This channel is **not** the guided Marco demo. Ask anything: strategy, team operations, how the AI system works, hypotheticals, cross-deal questions, or ad-hoc requests. The model loads **your** principal profile (diana.yaml / diana.md) and the full specialist context, without locking to a single deal unless you reference one (for example: status #412-buyer).

Switch to another channel when you want the scripted judge flows.`,
};

const CHANNEL_START_CHIPS: Record<ChannelId, string[]> = {
  "#team-general": ["new buyer", "new seller", "help"],
  "#412-buyer": ["status #412-buyer", "deadlines #412-buyer", "draft inspection #412-buyer"],
  "#327-seller": ["comps travis_heights", "brief ATX-016", "status #327-seller"],
  "#open-entry": [
    "Summarize how The Agency routes a new lead",
    "What are the risks on #412-buyer?",
    "help",
  ],
};

function followUpChips(lastUserText: string): string[] {
  const t = lastUserText.trim().toLowerCase();
  if (t.includes("status #412-buyer")) {
    return ["draft inspection #412-buyer", "deadlines #412-buyer"];
  }
  if (t.includes("new buyer")) {
    return ["brief east_austin", "help"];
  }
  if (t.includes("comps travis_heights")) {
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
        <p className="mono-eyebrow">The Agency · Competition demo</p>
        <h1 className="headline-lg">ATX Boutique Real Estate</h1>
        <p className="body-lg" style={{ maxWidth: "52ch", marginTop: "1rem" }}>
          Diana Castellano, Principal · Austin, TX — live AI operating system preview. Neo-Austin editorial
          shell; production team chat runs in Slack.
        </p>
      </div>

      <hr className="neo-rule" />

      <section>
        <h2 className="headline-md">What this is</h2>
        <p className="body-lg" style={{ maxWidth: "65ch" }}>
          The Agency is an AI operating system for a boutique residential team. Six AI specialists work
          together — orchestrator, lead qualifier, property research, client communication, transaction
          coordinator, and listing manager — across the transaction workflow, grounded in the same markdown
          and JSON files the production system uses.
        </p>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 className="headline-md">Why it feels like Slack</h2>
        <p className="body-lg" style={{ maxWidth: "65ch" }}>
          Diana&apos;s team does not want another platform to learn. In production this runs in real Slack.
          This browser demo simulates that experience so you can type real commands and get real Claude
          responses with the folder system loaded as context — no Claude Projects setup required.
        </p>
        <a className="agency-site-link" href={AGENCY_WEBSITE_URL} target="_blank" rel="noreferrer">
          Visit the agency website ↗
        </a>
      </section>

      <h2 className="headline-md" style={{ marginTop: "2.5rem" }}>
        Channels to try
      </h2>
      <div className="onboarding-grid onboarding-grid--channels">
        <div className="neo-card onboarding-card">
          <div className="onboarding-card-title">#team-general</div>
          <h3>New lead intake</h3>
          <p>Type naturally about a new buyer. The system extracts, structures, and creates a deal record.</p>
          <button type="button" className="chip" disabled>
            new buyer
          </button>
        </div>
        <div className="neo-card onboarding-card">
          <div className="onboarding-card-title">#412-buyer</div>
          <h3>Active deal management</h3>
          <p>
            The Chen deal is live at due diligence with an appraisal gap and inspection tension — real JSON on
            disk.
          </p>
          <button type="button" className="chip" disabled>
            status #412-buyer
          </button>
        </div>
        <div className="neo-card onboarding-card">
          <div className="onboarding-card-title">#327-seller</div>
          <h3>Listing intelligence</h3>
          <p>Hoffman listing — Travis Heights, 28 DOM, no offer. Pull comps and briefs from catalog + research files.</p>
          <button type="button" className="chip" disabled>
            comps travis_heights
          </button>
        </div>
        <div className="neo-card onboarding-card">
          <div className="onboarding-card-title">#open-entry</div>
          <h3>Principal sandbox</h3>
          <p>
            Open conversation as Diana Castellano — strategy, system questions, or anything else. Loads your
            principal profile instead of the guided-agent demo.
          </p>
          <button type="button" className="chip" disabled>
            Summarize how The Agency routes a new lead
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
  const [channel, setChannel] = useState<ChannelId>("#team-general");
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
      const userLabel = channel === "#open-entry" ? "Diana Castellano" : "You";
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
    setChannel("#team-general");
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

  const followUps = followUpChips(lastUserText);
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
        <div className="agent-strip">
          {channel === "#open-entry"
            ? "Diana Castellano · Principal · Open entry"
            : "Marco Reyes · Guided mode"}
        </div>
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
