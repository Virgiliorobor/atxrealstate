import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import "../App.css";
import "./production.css";

/**
 * Production app — Option C.
 *
 * Faithful to the ICM folder structure:
 *  - Login = agent identity (replaces Slack handle per rules.md)
 *  - Channels derived dynamically from _database/deals/*.json
 *  - Channel membership: agent sees their deals; Diana sees all
 *  - Every chat exchange persisted to deal.chat_log[] in the JSON schema
 *  - Orchestrator told who is speaking on every turn
 */

type User = {
  agent_id: string;
  name: string;
  slack_handle: string;
  role: "agent" | "principal";
  assigned_channel: string | null;
  open_channel: string;
};

type DealChannel = {
  channel: string;
  deal_file: string;
  deal_id: string;
  side: "buyer" | "seller";
  agent_id: string | null;
  client_name: string | null;
  stage: string | null;
  updated_at: string | null;
};

type ChatLogEntry = {
  ts: string;
  author: string;
  author_name?: string;
  role: "user" | "ai";
  text: string;
  specialist?: string | null;
};

type UiBlock =
  | { type: "brief"; title: string; markdown: string }
  | { type: "listing_preview"; title: string; property_id: string; markdown: string };

async function downloadBriefPdf(title: string, markdown: string): Promise<void> {
  const res = await fetch("/api/brief-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, markdown }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((data as { error?: string }).error || res.statusText);
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
}

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  author: string;
  author_name: string;
  text: string;
  specialist?: string | null;
  ui_blocks?: UiBlock[];
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

function specialistLabel(s: string | null | undefined): string {
  if (!s) return "🎯 Orchestrator";
  if (SPECIALIST_LABEL[s]) return SPECIALIST_LABEL[s];
  const short = s.replace(/^\d+_/, "");
  const hit = Object.keys(SPECIALIST_LABEL).find((k) => k.includes(short));
  return hit ? SPECIALIST_LABEL[hit] : `🎯 ${s}`;
}

function authorLabel(entry: ChatLogEntry | ChatMessage): string {
  if (entry.role === "ai") {
    return specialistLabel((entry as ChatMessage).specialist);
  }
  const name = (entry as ChatMessage).author_name || entry.author;
  return `${name} · @${entry.author}`;
}

/* ----------------------------------------------------------------- */
/* Login                                                              */
/* ----------------------------------------------------------------- */

function LoginScreen({
  onAuthed,
}: {
  onAuthed: (u: User) => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/auth/users");
        const j = (await r.json()) as { users: User[] };
        setUsers(j.users || []);
        if (j.users?.length) setSelected(j.users[0].agent_id);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  const submit = useCallback(async () => {
    if (!selected || !pin) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: selected, pin }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      onAuthed(j.user as User);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }, [selected, pin, onAuthed]);

  return (
    <div className="prod-login">
      <div className="prod-login-card">
        <p className="mono-eyebrow">The Agency · AI Operating System</p>
        <h1 className="headline-lg">Sign in</h1>
        <p className="body-md prod-login-blurb">
          Production version — your login replaces the Slack handle. The system loads your agent
          profile from <code>_config/agent_profiles/</code> and routes every message through the
          orchestrator. Everything you say is persisted to the deal JSON schema.
        </p>

        <label className="prod-field">
          <span>Agent</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={submitting || users.length === 0}
          >
            {users.map((u) => (
              <option key={u.agent_id} value={u.agent_id}>
                {u.name} ({u.slack_handle}) — {u.role}
              </option>
            ))}
          </select>
        </label>

        <label className="prod-field">
          <span>PIN</span>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Demo PIN"
            disabled={submitting}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </label>

        <p className="prod-login-hint">
          Demo PINs: <code>0000</code> for both Diana and Marco.
        </p>

        {error ? <div className="err-banner">{error}</div> : null}

        <button
          type="button"
          className="btn btn--primary"
          onClick={submit}
          disabled={submitting || !pin}
        >
          {submitting ? "Signing in…" : "Sign in →"}
        </button>

        <p className="prod-login-footer">
          Looking for the marketing demo? <a href="/">Back to demo →</a>
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Chat view (shared between agent + Diana)                           */
/* ----------------------------------------------------------------- */

function ChatView({
  user,
  channel,
  channelMeta,
  onBack,
}: {
  user: User;
  channel: string;
  channelMeta: DealChannel | null;
  onBack: (() => void) | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load persisted chat history
  useEffect(() => {
    let cancel = false;
    setHistoryLoading(true);
    setError(null);
    void (async () => {
      try {
        const r = await fetch(`/api/app/chat-log?channel=${encodeURIComponent(channel)}`);
        const j = await r.json();
        if (cancel) return;
        if (!r.ok) throw new Error(j.error || r.statusText);
        const entries = (j.entries || []) as ChatLogEntry[];
        const mapped: ChatMessage[] = entries.map((e, i) => ({
          id: `hist-${i}-${e.ts}`,
          role: e.role,
          author: e.author,
          author_name: e.author_name || e.author,
          text: e.text,
          specialist: e.specialist ?? null,
        }));
        setMessages(mapped);
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancel) setHistoryLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [channel]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const uid = `u-${Date.now()}`;
    setMessages((m) => [
      ...m,
      {
        id: uid,
        role: "user",
        author: user.agent_id,
        author_name: user.name,
        text,
      },
    ]);
    setLoading(true);
    try {
      const r = await fetch("/api/app/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, channel }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      setMessages((m) => [
        ...m,
        {
          id: `b-${Date.now()}`,
          role: "ai",
          author: "ai_orchestrator",
          author_name: "Orchestrator",
          text: j.chat_response || "",
          specialist: j.specialist_activated ?? null,
          ui_blocks: j.ui_blocks,
        },
      ]);
      if (j.persistence?.errors?.length) {
        setError(j.persistence.errors.join("; "));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [input, loading, user, channel]);

  const headerLabel = channelMeta
    ? `${channel} · ${channelMeta.client_name ?? "—"} · stage: ${channelMeta.stage ?? "—"}`
    : channel;

  return (
    <div className="prod-chat">
      <header className="prod-chat-header">
        <div className="prod-chat-header-main">
          {onBack ? (
            <button type="button" className="prod-back-btn" onClick={onBack}>
              ← All channels
            </button>
          ) : null}
          <div className="prod-chat-title">{headerLabel}</div>
        </div>
        <div className="prod-chat-header-sub">
          {channelMeta?.agent_id ? (
            <span>
              Assigned agent: <strong>@{channelMeta.agent_id}</strong>
              {user.role === "principal" && channelMeta.agent_id !== user.agent_id ? (
                <span className="prod-tag prod-tag--observer"> · you are observing as Diana</span>
              ) : null}
            </span>
          ) : (
            <span>Team channel</span>
          )}
        </div>
      </header>

      <div className="prod-messages">
        {historyLoading ? (
          <div className="prod-empty">Loading history…</div>
        ) : messages.length === 0 ? (
          <div className="prod-empty">
            No messages yet. Anything you send here is persisted to{" "}
            {channelMeta ? (
              <code>_database/deals/{channelMeta.deal_file}</code>
            ) : (
              <code>_database/team_channels/</code>
            )}{" "}
            in the <code>chat_log</code> array.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`prod-msg prod-msg--${m.role}`}>
              <div className="prod-msg-meta">{authorLabel(m)}</div>
              <div className="prod-msg-bubble">
                {m.role === "ai" ? (
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                ) : (
                  <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                )}
                {m.ui_blocks?.map((bl, i) =>
                  bl.type === "brief" ? (
                    <div key={i} className="brief-card">
                      <div className="brief-eyebrow">Brief</div>
                      <div className="brief-title">{bl.title}</div>
                      <ReactMarkdown>{bl.markdown}</ReactMarkdown>
                      <div className="apply-row" style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="apply-btn"
                          onClick={() =>
                            downloadBriefPdf(bl.title, bl.markdown).catch((e) =>
                              setError(e instanceof Error ? e.message : String(e))
                            )
                          }
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="brief-card">
                      <div className="brief-eyebrow">Listing preview · {bl.property_id}</div>
                      <div className="brief-title">{bl.title}</div>
                      <pre className="prod-pre">{bl.markdown}</pre>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
        {loading ? (
          <div className="thinking-strip">
            <span className="thinking-dot" />
            <span>Orchestrator is working…</span>
          </div>
        ) : null}
      </div>

      {error ? <div className="err-banner">{error}</div> : null}

      <div className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            user.role === "principal" && channelMeta && channelMeta.agent_id !== user.agent_id
              ? `Post as @diana in ${channel}…`
              : `Message ${channel}…`
          }
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button type="button" className="send-btn" onClick={send} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Diana dashboard                                                    */
/* ----------------------------------------------------------------- */

function DianaDashboard({
  user,
  channels,
  openChannel,
  onPick,
}: {
  user: User;
  channels: DealChannel[];
  openChannel: string;
  onPick: (channel: string, meta: DealChannel | null) => void;
}) {
  const isPrincipal = user.role === "principal";
  return (
    <div className="prod-dashboard">
      <header className="prod-dashboard-header">
        <p className="mono-eyebrow">
          {user.slack_handle} · {isPrincipal ? "Principal view" : "Agent view"}
        </p>
        <h1 className="headline-md">{isPrincipal ? "All channels" : "Your channels"}</h1>
        <p className="body-md">
          {isPrincipal
            ? <>Every deal channel in <code>_database/deals/</code> appears here. Click into any conversation to read the full <code>chat_log</code> from the deal JSON and post as <strong>@diana</strong>.</>
            : <>Your assigned deal channels. Click into any conversation to continue working with the Orchestrator.</>
          }
        </p>
      </header>

      <section className="prod-dashboard-section">
        <h2 className="headline-sm">Your open channel</h2>
        <div className="prod-channel-grid">
          <button
            type="button"
            className="prod-channel-card prod-channel-card--open"
            onClick={() => onPick(openChannel, null)}
          >
            <div className="prod-channel-card-title">{openChannel}</div>
            <div className="prod-channel-card-meta">Principal sandbox · cross-deal questions</div>
          </button>
        </div>
      </section>

      <section className="prod-dashboard-section">
        <h2 className="headline-sm">Deal channels ({channels.length})</h2>
        {channels.length === 0 ? (
          <div className="prod-empty">No deal files found in _database/deals/.</div>
        ) : (
          <div className="prod-channel-grid">
            {channels.map((c) => (
              <button
                key={c.channel}
                type="button"
                className="prod-channel-card"
                onClick={() => onPick(c.channel, c)}
              >
                <div className="prod-channel-card-title">{c.channel}</div>
                <div className="prod-channel-card-client">{c.client_name || "—"}</div>
                <div className="prod-channel-card-meta">
                  agent: <strong>@{c.agent_id || "unassigned"}</strong> · stage:{" "}
                  <strong>{c.stage || "—"}</strong>
                </div>
                <div className="prod-channel-card-foot">
                  {c.updated_at ? `updated ${c.updated_at}` : ""}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Root                                                               */
/* ----------------------------------------------------------------- */

type AppState =
  | { stage: "boot" }
  | { stage: "login" }
  | {
      stage: "authed";
      user: User;
      channels: DealChannel[];
      openChannel: string;
      view:
        | { type: "dashboard" }
        | { type: "chat"; channel: string; meta: DealChannel | null };
    };

export default function ProductionApp() {
  const [state, setState] = useState<AppState>({ stage: "boot" });

  const loadSession = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me");
      if (me.status === 401) {
        setState({ stage: "login" });
        return;
      }
      const meJson = (await me.json()) as { user: User };
      const user = meJson.user;
      const chRes = await fetch("/api/app/channels");
      const chJson = await chRes.json();
      // Don't go back to login if channel loading fails — show empty list instead.
      const channels = (chJson.deal_channels || []) as DealChannel[];
      const openChannel = (chJson.open_channel || user.open_channel) as string;
      if (chJson._channel_error) {
        console.warn("[channels] storage error:", chJson._channel_error);
      }
      setState({
        stage: "authed",
        user,
        channels,
        openChannel,
        view: { type: "dashboard" },
      });
    } catch (e) {
      console.error(e);
      setState({ stage: "login" });
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const onAuthed = useCallback(() => {
    setState({ stage: "boot" });
    void loadSession();
  }, [loadSession]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ stage: "login" });
  }, []);

  const goBack = useCallback(() => {
    setState((s) => {
      if (s.stage !== "authed") return s;
      return { ...s, view: { type: "dashboard" } };
    });
  }, []);

  const pickChannel = useCallback((channel: string, meta: DealChannel | null) => {
    setState((s) => {
      if (s.stage !== "authed") return s;
      return { ...s, view: { type: "chat", channel, meta } };
    });
  }, []);

  if (state.stage === "boot") {
    return <div className="prod-boot">Loading…</div>;
  }
  if (state.stage === "login") {
    return <LoginScreen onAuthed={onAuthed} />;
  }

  const { user, channels, openChannel, view } = state;
  const titleStrip = (
    <div className="prod-topbar">
      <div className="prod-topbar-brand">
        <div className="brand-mark">The Agency · Production</div>
        <div className="brand-sub">
          {user.name} · {user.slack_handle} · {user.role}
        </div>
      </div>
      <div className="prod-topbar-actions">
        <a href="/" className="prod-topbar-link">Demo →</a>
        <button type="button" className="prod-back-btn" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="prod-app">
      {titleStrip}
      {view.type === "dashboard" ? (
        <DianaDashboard
          user={user}
          channels={channels}
          openChannel={openChannel}
          onPick={pickChannel}
        />
      ) : (
        <ChatView
          user={user}
          channel={view.channel}
          channelMeta={view.meta}
          onBack={goBack}
        />
      )}
    </div>
  );
}
