import { useEffect, useRef, useState } from "react";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileCode2,
  FileText,
  FlaskConical,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const configured = /^0x[a-fA-F0-9]{40}$/.test(ADDRESS);
const CHAIN_ID = "0xf22f";
const EXPLORER = "https://explorer-studio.genlayer.com";
const slots = ["DOCUMENTATION", "IMPLEMENTATION", "TESTS"];
const icons = [FileText, FileCode2, FlaskConical];
const empty = {
  tool: "SafeArchive CLI",
  flag: "--safe-extract",
  claim:
    "Archive members escaping the extraction directory must be rejected before extraction.",
  audit: "0",
  slot: "DOCUMENTATION",
  owner: "Azaria723",
  repo: "FlagSpecAudit",
  commit: "",
  path: "/fixtures/consistent/docs.md",
  digest: "",
};
const short = (v) => (v ? `${v.slice(0, 7)}…${v.slice(-5)}` : "—");
const source = (f) =>
  JSON.stringify({
    owner: f.owner,
    repo: f.repo,
    commit: f.commit,
    path: f.path,
    digest: f.digest,
  });
export default function App() {
  const [audits, setAudits] = useState([]),
    [selected, setSelected] = useState(null),
    [form, setForm] = useState(empty),
    [mode, setMode] = useState("create"),
    [panel, setPanel] = useState(false),
    [guide, setGuide] = useState(false),
    [account, setAccount] = useState(""),
    [chainId, setChainId] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [hasSnapshot, setHasSnapshot] = useState(false),
    [syncState, setSyncState] = useState("CONNECTING"),
    [txRecord, setTxRecord] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("fsa:lastTx")) || null;
      } catch {
        return null;
      }
    });
  const mounted = useRef(true);
  const read = () => createClient({ chain: studionet });
  const saveTx = (next) => {
    setTxRecord(next);
    if (next) localStorage.setItem("fsa:lastTx", JSON.stringify(next));
    else localStorage.removeItem("fsa:lastTx");
  };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function retryRead(operation, retries = 3) {
    let last;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        last = error;
        if (attempt < retries) await delay(900 * attempt);
      }
    }
    throw last;
  }
  async function refresh({ quiet = false } = {}) {
    if (!configured) {
      setLoading(false);
      setSyncState("MISCONFIGURED");
      return;
    }
    if (!quiet || !hasSnapshot) setLoading(true);
    setSyncState("SYNCING");
    try {
      const client = read();
      const c = JSON.parse(
          await retryRead(() => client.readContract({
            address: ADDRESS,
            functionName: "get_counts",
            args: [],
          })),
        ),
        list = [];
      for (let i = 0; i < c.audit_count; i++) {
        const audit = JSON.parse(
          await retryRead(() => client.readContract({
            address: ADDRESS,
            functionName: "get_audit",
            args: [BigInt(i)],
          })),
        );
        audit.sources = {};
        for (const slot of slots) {
          const e = JSON.parse(
            await retryRead(() => client.readContract({
              address: ADDRESS,
              functionName: "get_evidence",
              args: [BigInt(i), slot],
            })),
          );
          if (!e.error) audit.sources[slot] = e;
        }
        list.push(audit);
      }
      if (!mounted.current) return;
      setAudits(list);
      setHasSnapshot(true);
      setSyncState("LIVE");
      setSelected((s) =>
        s ? list.find((a) => a.audit_id === s.audit_id) : null,
      );
    } catch (e) {
      setSyncState(hasSnapshot ? "STALE" : "UNAVAILABLE");
      setNotice(
        hasSnapshot
          ? `StudioNet temporarily unavailable; preserving the last verified snapshot. ${e.message}`
          : `StudioNet readback unavailable; no zero-state substitution was made. ${e.message}`,
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    refresh();
    const provider = window.ethereum;
    if (!provider) return () => { mounted.current = false; };
    const restore = async () => {
      try {
        const [accounts, chain] = await Promise.all([
          provider.request({ method: "eth_accounts" }),
          provider.request({ method: "eth_chainId" }),
        ]);
        setAccount(accounts?.[0] || "");
        setChainId(chain || "");
      } catch {
        setNotice("Wallet reconnection is required.");
      }
    };
    const accountsChanged = (accounts) => {
      setAccount(accounts?.[0] || "");
      setNotice(accounts?.[0] ? "Wallet account changed." : "Wallet disconnected. Reconnect to write.");
    };
    const chainChanged = (chain) => {
      setChainId(chain || "");
      setNotice(chain?.toLowerCase() === CHAIN_ID ? "StudioNet detected." : "Wrong network. Switch to StudioNet (61999)." );
      refresh({ quiet: true });
    };
    restore();
    provider.on?.("accountsChanged", accountsChanged);
    provider.on?.("chainChanged", chainChanged);
    return () => {
      mounted.current = false;
      provider.removeListener?.("accountsChanged", accountsChanged);
      provider.removeListener?.("chainChanged", chainChanged);
    };
  }, []);
  useEffect(() => {
    if (txRecord?.hash && ["SUBMITTED", "PENDING", "TIMEOUT"].includes(txRecord.phase)) {
      reconcileTransaction(txRecord.hash, true);
    }
  }, []);
  async function connect() {
    if (!window.ethereum) return setNotice("Install an injected wallet.");
    try {
      const [a] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      setAccount(a || "");
      setChainId(chain || "");
      if (chain?.toLowerCase() !== CHAIN_ID) setNotice("Connected, but switch the wallet to StudioNet (61999) before writing.");
      else setNotice("Wallet connected to StudioNet.");
    } catch (error) {
      setNotice(error?.code === 4001 ? "Wallet connection rejected by user." : `Wallet connection failed: ${error.message}`);
    }
  }
  async function reconcileTransaction(hash, resumed = false) {
    setBusy(true);
    saveTx({ hash, phase: "PENDING", status: "Waiting for finalized consensus", resumed });
    try {
      const receipt = await read().waitForTransactionReceipt({
        hash,
        status: TransactionStatus.FINALIZED,
        interval: 3000,
        retries: 60,
      });
      const actual = receipt.status_name || receipt.status || "FINALIZED";
      if (actual !== TransactionStatus.FINALIZED) {
        const failed = ["CANCELED", "UNDETERMINED", "VALIDATORS_TIMEOUT", "LEADER_TIMEOUT"].includes(actual);
        saveTx({ hash, phase: failed ? "FAILED" : "REVERTED", status: actual });
        setNotice(`Transaction did not finalize successfully: ${actual}.`);
        return;
      }
      const reconciled = await refresh({ quiet: true });
      saveTx({ hash, phase: "FINALIZED", status: "FINALIZED · canonical state reconciled" });
      setNotice("Finalized successfully; UI reconciled from the canonical contract read.");
      return reconciled;
    } catch (error) {
      const text = error?.shortMessage || error?.message || "Unknown error";
      const timeout = /timeout|retries|timed out/i.test(text);
      const reverted = /revert|execution reverted/i.test(text);
      const phase = timeout ? "TIMEOUT" : reverted ? "REVERTED" : "FAILED";
      saveTx({ hash, phase, status: text });
      setNotice(timeout ? "Consensus wait timed out. The hash is retained; use Check status to resume." : `${phase === "REVERTED" ? "Transaction reverted" : "Transaction failed"} after submission: ${text}`);
    } finally {
      setBusy(false);
    }
  }
  async function write(fn, args) {
    setBusy(true);
    try {
      if (!configured) throw Error("Contract address is not configured.");
      if (!account) throw Error("Connect a wallet first.");
      if (!window.ethereum) throw Error("Injected wallet unavailable.");
      const liveAccounts = await window.ethereum.request({ method: "eth_accounts" });
      const liveChain = await window.ethereum.request({ method: "eth_chainId" });
      if (!liveAccounts?.[0] || liveAccounts[0].toLowerCase() !== account.toLowerCase()) throw Error("Wallet account changed. Reconnect before writing.");
      if (liveChain?.toLowerCase() !== CHAIN_ID) throw Error("Wrong network. Switch wallet to StudioNet (chain 61999).");
      const client = createClient({
        chain: studionet,
        provider: window.ethereum,
        account,
      });
      const hash = await client.writeContract({
        address: ADDRESS,
        functionName: fn,
        args,
      });
      saveTx({ hash, phase: "SUBMITTED", status: "Submitted to StudioNet" });
      setNotice("Transaction submitted. Waiting for finalized consensus…");
      await reconcileTransaction(hash);
    } catch (e) {
      const text = e.shortMessage || e.message || "Unknown error";
      const rejected = e?.code === 4001 || /rejected|denied/i.test(text);
      const reverted = /revert|execution reverted/i.test(text);
      const phase = rejected ? "REJECTED" : reverted ? "REVERTED" : "FAILED";
      saveTx({ hash: "", phase, status: text });
      setNotice(rejected ? "Transaction rejected in wallet; nothing was submitted." : `${phase === "REVERTED" ? "Transaction reverted" : "Transaction failed"} before submission: ${text}`);
    } finally {
      setBusy(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    if (mode === "create")
      write("create_audit", [form.tool, form.flag, form.claim]);
    if (mode === "attach")
      write("attach_evidence", [BigInt(form.audit), form.slot, source(form)]);
    if (mode === "seal") write("seal_audit", [BigInt(form.audit)]);
    if (mode === "assess") write("assess_audit", [BigInt(form.audit)]);
  }
  const counts = {
    draft: audits.filter((a) => a.status === "DRAFT").length,
    sealed: audits.filter((a) => a.status === "SEALED").length,
    final: audits.filter((a) => a.status === "FINALIZED").length,
  };
  return (
    <div className="app">
      <header>
        <div className="brand">
          <img src="/flagspecaudit-logo.png" />
          <div>
            <b>FlagSpecAudit</b>
            <span>CLI CLAIM CONSISTENCY</span>
          </div>
        </div>
        <nav>
          <button onClick={() => setGuide(true)}>
            <BookOpen />
            Method
          </button>
          <span className={chainId && chainId.toLowerCase() !== CHAIN_ID ? "network wrong" : "network"}>
            ● StudioNet · 61999 {chainId && chainId.toLowerCase() !== CHAIN_ID ? "· WRONG CHAIN" : ""}
          </span>
          <button className="wallet" onClick={connect}>
            {account ? short(account) : "Connect wallet"}
          </button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div>
            <p>EVIDENCE MATRIX / INTELLIGENT CONTRACT</p>
            <h1>
              Does the flag do
              <br />
              <em>what the docs promise?</em>
            </h1>
            <span>
              Bind documentation, implementation, and tests. Seal the matrix.
              Let comparative consensus expose drift.
            </span>
          </div>
          <button className="orange" onClick={() => setPanel(true)}>
            <Plus />
            New audit
          </button>
        </section>
        <section className="stats">
          <div>
            <b>{hasSnapshot ? audits.length : "—"}</b>
            <span>TOTAL AUDITS</span>
          </div>
          <div>
            <b>{hasSnapshot ? counts.draft : "—"}</b>
            <span>DRAFT</span>
          </div>
          <div>
            <b>{hasSnapshot ? counts.sealed : "—"}</b>
            <span>SEALED</span>
          </div>
          <div>
            <b>{hasSnapshot ? counts.final : "—"}</b>
            <span>FINALIZED</span>
          </div>
        </section>
        <section className="workbench">
          <div className="section-head">
            <div>
              <p>CONSISTENCY WORKBENCH</p>
              <h2>Audit register</h2>
              <div className="contract-line">
                <span>CONTRACT</span>
                <code>{ADDRESS || "Not configured"}</code>
                {configured && (
                  <a
                    href={`https://explorer-studio.genlayer.com/address/${ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explorer <ArrowUpRight />
                  </a>
                )}
              </div>
              <div className={`sync-state ${syncState.toLowerCase()}`}>
                {syncState === "LIVE" ? "● LIVE CANONICAL STATE" : `● ${syncState}`}
                {hasSnapshot && syncState === "STALE" ? " · LAST VERIFIED SNAPSHOT RETAINED" : ""}
              </div>
            </div>
            <button onClick={refresh}>
              <RefreshCw />
              Refresh
            </button>
          </div>
          {loading && !hasSnapshot ? (
            <div className="empty">
              <Loader2 className="spin" />
              Reading StudioNet…
            </div>
          ) : !hasSnapshot ? (
            <div className="empty unavailable-state">
              <ShieldCheck />
              <h3>Canonical state unavailable</h3>
              <p>No zero records were substituted. Retry the StudioNet readback.</p>
            </div>
          ) : audits.length ? (
            <div className="table">
              <div className="row labels">
                <span>TOOL / FLAG</span>
                <span>EVIDENCE MATRIX</span>
                <span>STATUS</span>
                <span>VERDICT</span>
              </div>
              {audits.map((a) => (
                <button
                  className="row"
                  key={a.audit_id}
                  onClick={() => setSelected(a)}
                >
                  <span>
                    <b>{a.tool_name}</b>
                    <small>{a.flag_name}</small>
                  </span>
                  <span className="coverage">
                    {slots.map((s, i) => {
                      const I = icons[i];
                      return (
                        <i className={a.sources[s] ? "on" : ""} key={s}>
                          <I />
                        </i>
                      );
                    })}
                    <small>{Object.keys(a.sources).length}/3</small>
                  </span>
                  <span>
                    <mark className={a.status.toLowerCase()}>{a.status}</mark>
                  </span>
                  <span className="verdict">{a.verdict}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">
              <ShieldCheck />
              <h3>No audits registered</h3>
              <p>
                Create a behavioral claim, then attach three immutable public
                sources.
              </p>
            </div>
          )}
        </section>
        {(notice || txRecord) && (
          <div className="notice">
            {busy && <Loader2 className="spin" />}
            <span>{notice || txRecord?.status}</span>
            {txRecord?.phase && <mark className={`tx-phase ${txRecord.phase.toLowerCase()}`}>{txRecord.phase}</mark>}
            {txRecord?.hash && (
              <a
                target="_blank"
                rel="noreferrer"
                href={`${EXPLORER}/tx/${txRecord.hash}`}
              >
                Transaction <ArrowUpRight />
              </a>
            )}
            {txRecord?.hash && ["TIMEOUT", "FAILED"].includes(txRecord.phase) && (
              <button onClick={() => reconcileTransaction(txRecord.hash, true)}>Check status</button>
            )}
          </div>
        )}
      </main>
      {selected && (
        <aside>
          <button className="close" onClick={() => setSelected(null)}>
            <X />
          </button>
          <p>AUDIT FSA-{String(selected.audit_id).padStart(3, "0")}</p>
          <h2>{selected.flag_name}</h2>
          <h3>{selected.behavioral_claim}</h3>
          <div className="rail">
            <span>CLAIM</span>
            <b>→</b>
            <span>DOCS</span>
            <b>→</b>
            <span>CODE</span>
            <b>→</b>
            <span>TESTS</span>
          </div>
          {slots.map((s, i) => {
            const I = icons[i],
              e = selected.sources[s];
            return (
              <div className={`source-card ${e ? "bound" : ""}`} key={s}>
                <I />
                <span>
                  <b>{s}</b>
                  <small>
                    {e
                      ? `${e.source.owner}/${e.source.repo}${e.source.path}`
                      : "Not attached"}
                  </small>
                </span>
                {e && <Check />}
              </div>
            );
          })}
          <div className="result">
            <small>{selected.status}</small>
            <b>{selected.verdict}</b>
            <span>{selected.confidence || "Awaiting assessment"}</span>
          </div>
        </aside>
      )}
      {panel && (
        <div className="overlay">
          <form onSubmit={submit}>
            <button
              type="button"
              className="close"
              onClick={() => setPanel(false)}
            >
              <X />
            </button>
            <p>COMMAND DESK</p>
            <h2>Build an audit matrix</h2>
            <div className="tabs">
              {["create", "attach", "seal", "assess"].map((x) => (
                <button
                  type="button"
                  className={mode === x ? "on" : ""}
                  onClick={() => setMode(x)}
                  key={x}
                >
                  {x}
                </button>
              ))}
            </div>
            {mode === "create" ? (
              <>
                <Field l="Tool name" k="tool" f={form} s={setForm} />
                <Field l="Flag name" k="flag" f={form} s={setForm} />
                <label>
                  Behavioral claim
                  <textarea
                    value={form.claim}
                    onChange={(e) =>
                      setForm({ ...form, claim: e.target.value })
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <Field l="Audit ID" k="audit" f={form} s={setForm} />
                {mode === "attach" && (
                  <>
                    <label>
                      Evidence slot
                      <select
                        value={form.slot}
                        onChange={(e) =>
                          setForm({ ...form, slot: e.target.value })
                        }
                      >
                        {slots.map((s) => (
                          <option>{s}</option>
                        ))}
                      </select>
                    </label>
                    {["owner", "repo", "commit", "path", "digest"].map((k) => (
                      <Field l={k.toUpperCase()} k={k} f={form} s={setForm} />
                    ))}
                  </>
                )}
              </>
            )}
            <button className="orange submit" disabled={busy}>
              {mode.toUpperCase()}
            </button>
          </form>
        </div>
      )}
      {guide && (
        <div className="overlay">
          <div className="guide">
            <button className="close" onClick={() => setGuide(false)}>
              <X />
            </button>
            <h2>Three sources. One bounded judgment.</h2>
            <ol>
              <li>Register a behavioral security claim.</li>
              <li>Bind docs, code, and tests to immutable GitHub bytes.</li>
              <li>Seal the evidence matrix so no source can change.</li>
              <li>Validators compare support across all three layers.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
function Field({ l, k, f, s }) {
  return (
    <label>
      {l}
      <input value={f[k]} onChange={(e) => s({ ...f, [k]: e.target.value })} />
    </label>
  );
}
