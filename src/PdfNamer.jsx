/**
 * PdfNamer.jsx  –  RYZE.ai
 *
 * Drop a PDF → see extracted fields → confirm or edit the suggested filename.
 * Each confirmation trains the system to match your naming pattern.
 */

import { useState, useRef, useCallback } from "react";
import styles from "./PdfNamer.module.css";

const API = "/api/pdf-namer";
const API_KEY = process.env.REACT_APP_API_KEY;

// ── Icons (inline SVG, no dependency) ────────────────────────────────────────
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
  const map = {
    high: { label: "High confidence", cls: styles.badgeHigh },
    medium: { label: "Medium confidence", cls: styles.badgeMedium },
    low: { label: "Low confidence", cls: styles.badgeLow },
  };
  const { label, cls } = map[level] ?? map.medium;
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

// ── Field pill ────────────────────────────────────────────────────────────────
function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PdfNamer() {
  const [phase, setPhase] = useState("idle"); // idle | dragging | loading | result | confirmed | error
  const [result, setResult] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef(null);
  const originalFilenameRef = useRef("");
  const fileRef = useRef(null); // ← stores the actual File object for download

  // ── Upload & analyze ──────────────────────────────────────────────────────
  const analyze = useCallback(async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Please upload a PDF file.");
      setPhase("error");
      return;
    }
    originalFilenameRef.current = file.name;
    fileRef.current = file; // ← save file for later download
    setPhase("loading");
    setResult(null);
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/analyze`, { method: "POST", headers: { "X-API-Key": API_KEY }, body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setEditedName(data.suggested_name);
      setPhase("result");
    } catch (e) {
      setErrorMsg(e.message);
      setPhase("error");
    }
  }, []);

  // ── Confirm & download ────────────────────────────────────────────────────
  const confirm = async () => {
    if (!result || !editedName.trim()) return;
    setConfirming(true);
    try {
      const res = await fetch(`${API}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({
          session_id: result.session_id,
          confirmed_name: editedName.trim(),
          original_filename: originalFilenameRef.current,
        }),
      });
      if (!res.ok) throw new Error("Confirm failed");

      // ── Trigger download with new filename ──────────────────────────────
      if (fileRef.current) {
        const url = URL.createObjectURL(fileRef.current);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${editedName.trim()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setPhase("confirmed");
    } catch (e) {
      setErrorMsg(e.message);
      setPhase("error");
    } finally {
      setConfirming(false);
    }
  };

  // ── Drag events ───────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setPhase("dragging"); };
  const onDragLeave = () => { if (phase === "dragging") setPhase("idle"); };
  const onDrop = (e) => { e.preventDefault(); analyze(e.dataTransfer.files[0]); };

  const reset = () => { setPhase("idle"); setResult(null); setErrorMsg(""); fileRef.current = null; };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <SparkIcon />
        <div>
          <h2 className={styles.title}>PDF Auto-Namer</h2>
          <p className={styles.subtitle}>
            Drop a document · review extracted fields · confirm to teach your pattern
          </p>
        </div>
      </header>

      {/* ── Drop zone ── */}
      {(phase === "idle" || phase === "dragging") && (
        <div
          className={`${styles.dropzone} ${phase === "dragging" ? styles.dropzoneDragging : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className={styles.hiddenInput}
            onChange={(e) => analyze(e.target.files[0])}
          />
          <span className={styles.dropIcon}><UploadIcon /></span>
          <p className={styles.dropText}>
            {phase === "dragging" ? "Release to analyze" : "Drop a PDF here or click to browse"}
          </p>
          <p className={styles.dropHint}>Invoices, statements, contracts, receipts</p>
        </div>
      )}

      {/* ── Loading ── */}
      {phase === "loading" && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p>Extracting fields and applying your naming pattern…</p>
        </div>
      )}

      {/* ── Result ── */}
      {phase === "result" && result && (
        <div className={styles.resultCard}>
          <div className={styles.resultTop}>
            <ConfidenceBadge level={result.confidence} />
            {result.pattern_used && (
              <span className={styles.patternNote}>
                <SparkIcon /> {result.pattern_used}
              </span>
            )}
          </div>

          <div className={styles.fields}>
            <Field label="Vendor" value={result.extracted_fields.vendor} />
            <Field label="Date" value={result.extracted_fields.date} />
            <Field label="Amount" value={result.extracted_fields.amount ? `$${result.extracted_fields.amount}` : null} />
            <Field label="Doc type" value={result.extracted_fields.doc_type} />
          </div>

          <div className={styles.nameRow}>
            <span className={styles.nameIcon}><EditIcon /></span>
            <input
              className={styles.nameInput}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Filename…"
              spellCheck={false}
            />
            <span className={styles.ext}>.pdf</span>
          </div>
          <p className={styles.nameHint}>
            Edit the name above if needed — your edit will update the learned pattern.
          </p>

          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={confirm} disabled={confirming}>
              {confirming ? "Saving…" : <><DownloadIcon /> Confirm &amp; download</>}
            </button>
            <button className={styles.btnGhost} onClick={reset}>
              Try another
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmed ── */}
      {phase === "confirmed" && (
        <div className={styles.successBox}>
          <span className={styles.successIcon}><CheckIcon /></span>
          <h3>Saved!</h3>
          <p className={styles.savedName}>{editedName}.pdf</p>
          <p className={styles.successSub}>
            Pattern learned. Future PDFs from this vendor will follow the same format.
          </p>
          <button className={styles.btnPrimary} onClick={reset}>
            Name another PDF
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {phase === "error" && (
        <div className={styles.errorBox}>
          <p>{errorMsg || "Something went wrong."}</p>
          <button className={styles.btnGhost} onClick={reset}>Try again</button>
        </div>
      )}
    </div>
  );
}