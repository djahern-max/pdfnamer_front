/**
 * PdfNamer.jsx  –  RYZE.ai
 *
 * Drop a PDF → see extracted fields → confirm.
 * On confirm: saves DB record + sends file to backend → written to
 * ~/Desktop/To_Upload_To_Drive with the confirmed name, original deleted
 * from ~/Downloads.
 */

import { useState, useRef, useCallback } from "react";
import styles from "./PdfNamer.module.css";

const API = "/api/pdf-namer";
const API_KEY = process.env.REACT_APP_API_KEY || "";

// ── Icons ─────────────────────────────────────────────────────────────────────
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}
function FolderArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5a2.25 2.25 0 012.25-2.25h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 0012.37 7.5H18.75A2.25 2.25 0 0121 9.75v7.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V7.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m0 0l-2.25-2.25M12 16.5l2.25-2.25" />
    </svg>
  );
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
  const map = { high: styles.badgeHigh, medium: styles.badgeMed, low: styles.badgeLow };
  const label = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };
  const cls = map[level] ?? map.medium;
  return <span className={`${styles.badge} ${cls}`}>{label[level] ?? level}</span>;
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
  const [phase, setPhase] = useState("idle"); // idle | dragging | loading | result | saving | confirmed | error
  const [result, setResult] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [jobName, setJobName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [originalDeleted, setOriginalDeleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef(null);
  const originalFilenameRef = useRef("");
  const fileRef = useRef(null);

  // ── Analyze ───────────────────────────────────────────────────────────────
  const analyze = useCallback(async (file) => {
    if (!file || (!file.name.toLowerCase().endsWith(".pdf") && !file.name.toUpperCase().endsWith(".PDF"))) {
      setErrorMsg("Please upload a PDF file.");
      setPhase("error");
      return;
    }
    originalFilenameRef.current = file.name;
    fileRef.current = file;
    setPhase("loading");
    setResult(null);
    setEditedName("");
    setJobName("");
    setSaveMsg("");
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "X-API-Key": API_KEY },
        body: form,
      });
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

  // ── Confirm ───────────────────────────────────────────────────────────────
  // Two sequential calls:
  //   1. /confirm  — saves DB record + learns pattern
  //   2. /save-file — writes renamed PDF to To_Upload_To_Drive, deletes original
  const confirm = async () => {
    if (!result || !editedName.trim()) return;
    setConfirming(true);
    setPhase("saving");

    try {
      // Step 1: save DB record
      const confirmRes = await fetch(`${API}/confirm`, {
        method: "POST",
        headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: result.session_id,
          confirmed_name: editedName.trim(),
          original_filename: originalFilenameRef.current,
          job_name: jobName.trim() || null,
        }),
      });
      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        throw new Error(err.detail ?? `Confirm failed (${confirmRes.status})`);
      }

      // Step 2: send file to backend for saving
      const form = new FormData();
      form.append("file", fileRef.current);
      form.append("confirmed_name", editedName.trim());
      form.append("original_filename", originalFilenameRef.current);

      const saveRes = await fetch(`${API}/save-file`, {
        method: "POST",
        headers: { "X-API-Key": API_KEY },
        body: form,
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.detail ?? `Save failed (${saveRes.status})`);
      }
      const saveData = await saveRes.json();
      setSaveMsg(saveData.message);
      setOriginalDeleted(saveData.original_deleted);
      setPhase("confirmed");

    } catch (e) {
      setErrorMsg(e.message);
      setPhase("error");
    } finally {
      setConfirming(false);
    }
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setPhase("dragging"); };
  const onDragLeave = () => { if (phase === "dragging") setPhase("idle"); };
  const onDrop = (e) => { e.preventDefault(); analyze(e.dataTransfer.files[0]); };

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setEditedName("");
    setJobName("");
    setSaveMsg("");
    setErrorMsg("");
    fileRef.current = null;
  };

  return (
    <div className={styles.root}>

      {/* Header */}
      <header className={styles.header}>
        <h2 className={styles.title}>PDF Namer</h2>
        <p className={styles.subtitle}>Drop an invoice — AI names it and saves it to your upload folder</p>
      </header>

      {/* ── Idle / Dragging ── */}
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
            accept=".pdf,.PDF"
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

      {/* ── Saving ── */}
      {phase === "saving" && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p>Saving to To_Upload_To_Drive…</p>
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
            <Field label="Invoice #" value={result.extracted_fields.invoice_number} />
          </div>

          {/* Job name */}
          <div className={styles.jobRow}>
            <span className={styles.jobIcon}><BriefcaseIcon /></span>
            <input
              className={styles.jobInput}
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="Job name (optional)…"
              spellCheck={false}
            />
          </div>

          {/* Filename */}
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
              {confirming ? "Saving…" : <><FolderArrowIcon /> Confirm &amp; Save</>}
            </button>
            <button className={styles.btnGhost} onClick={reset}>Start over</button>
          </div>
        </div>
      )}

      {/* ── Confirmed ── */}
      {phase === "confirmed" && (
        <div className={styles.confirmedBox}>
          <div className={styles.confirmedIcon}>✓</div>
          <p className={styles.confirmedTitle}>Saved to To_Upload_To_Drive</p>
          <p className={styles.confirmedName}>{editedName}.pdf</p>
          {jobName && (
            <p className={styles.confirmedJob}>
              <BriefcaseIcon /> {jobName}
            </p>
          )}
          {originalDeleted ? (
            <p className={styles.confirmedSub}>Original deleted from Downloads.</p>
          ) : (
            <p className={styles.confirmedSubWarn}>Original not found in Downloads — delete it manually if needed.</p>
          )}
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