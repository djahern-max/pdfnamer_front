/**
 * QbChecker.jsx  –  RYZE.ai
 *
 * Upload a QuickBooks Unpaid Bills Report export → instantly see which
 * of your scanned & renamed invoices still need to be entered in QuickBooks.
 *
 * cc_receipt and check_receipt types are automatically excluded.
 */

import { useState, useRef, useCallback } from "react";
import styles from "./QbChecker.module.css";

const API = "/api/qb-checker";
const API_KEY = process.env.REACT_APP_API_KEY;

// ── Icons ─────────────────────────────────────────────────────────────────────
const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const AlertIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-4.47" />
    </svg>
);

const ExcelIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={16} height={16}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

// ── Bill card ─────────────────────────────────────────────────────────────────
function BillCard({ item, status }) {
    const isNeeded = status === "needs_entry";
    return (
        <div className={`${styles.card} ${isNeeded ? styles.cardNeeded : styles.cardDone}`}>
            <div className={styles.cardIcon}>
                {isNeeded ? <AlertIcon /> : <CheckCircleIcon />}
            </div>
            <div className={styles.cardBody}>
                <div className={styles.cardVendor}>{item.vendor || "Unknown Vendor"}</div>
                <div className={styles.cardFilename}>{item.confirmed_name}.pdf</div>
                <div className={styles.cardMeta}>
                    {item.invoice_number && (
                        <span className={styles.metaPill}>INV {item.invoice_number}</span>
                    )}
                    {item.amount && (
                        <span className={styles.metaPill}>${item.amount}</span>
                    )}
                    {item.doc_date && (
                        <span className={styles.metaPill}>{item.doc_date}</span>
                    )}
                    {item.doc_type && (
                        <span className={`${styles.metaPill} ${styles.metaType}`}>{item.doc_type}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Summary stat ──────────────────────────────────────────────────────────────
function Stat({ value, label, accent }) {
    return (
        <div className={`${styles.stat} ${accent ? styles.statAccent : ""}`}>
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QbChecker() {
    const [phase, setPhase] = useState("idle"); // idle | dragging | loading | results | error
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [activeTab, setActiveTab] = useState("needs_entry");
    const fileInputRef = useRef(null);
    const fileRef = useRef(null);

    const compare = useCallback(async (file) => {
        if (!file || !file.name.toLowerCase().match(/\.xlsx?$/)) {
            setErrorMsg("Please upload a QuickBooks Excel export (.xlsx or .xls).");
            setPhase("error");
            return;
        }

        fileRef.current = file;
        setPhase("loading");
        setResult(null);
        setErrorMsg("");

        const form = new FormData();
        form.append("file", file);

        try {
            const res = await fetch(`${API}/compare`, {
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
            setActiveTab(data.needs_entry.length > 0 ? "needs_entry" : "already_entered");
            setPhase("results");
        } catch (e) {
            setErrorMsg(e.message);
            setPhase("error");
        }
    }, []);

    const onDragOver = (e) => { e.preventDefault(); setPhase("dragging"); };
    const onDragLeave = () => { if (phase === "dragging") setPhase("idle"); };
    const onDrop = (e) => { e.preventDefault(); compare(e.dataTransfer.files[0]); };
    const reset = () => { setPhase("idle"); setResult(null); setErrorMsg(""); };

    const exportToExcel = async () => {
        if (!fileRef.current) return;
        const form = new FormData();
        form.append("file", fileRef.current);
        try {
            const res = await fetch(`${API}/export.xlsx`, {
                method: "POST",
                headers: { "X-API-Key": API_KEY },
                body: form,
            });
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `QB_Checker_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export error:", e);
        }
    };

    return (
        <div className={styles.root}>
            {/* ── Header ── */}
            <header className={styles.header}>
                <div className={styles.headerIcon}>
                    <FileIcon />
                </div>
                <div>
                    <h2 className={styles.title}>QuickBooks Bill Checker</h2>
                    <p className={styles.subtitle}>
                        Upload your Unpaid Bills Report · see which scanned invoices still need to be entered
                    </p>
                </div>
            </header>

            {/* ── Idle / Drag ── */}
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
                        accept=".xlsx,.xls"
                        className={styles.hiddenInput}
                        onChange={(e) => compare(e.target.files[0])}
                    />
                    <span className={styles.dropIcon}><UploadIcon /></span>
                    <p className={styles.dropText}>
                        {phase === "dragging" ? "Release to upload" : "Drop your QuickBooks export here or click to browse"}
                    </p>
                    <p className={styles.dropHint}>QuickBooks → Reports → Unpaid Bills → Export to Excel</p>
                </div>
            )}

            {/* ── Loading ── */}
            {phase === "loading" && (
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Comparing your invoices against QuickBooks…</p>
                </div>
            )}

            {/* ── Results ── */}
            {phase === "results" && result && (
                <div className={styles.results}>

                    {/* Summary bar */}
                    <div className={styles.summary}>
                        <Stat
                            value={result.needs_entry.length}
                            label="Need Entry"
                            accent={result.needs_entry.length > 0}
                        />
                        <div className={styles.summaryDivider} />
                        <Stat
                            value={result.already_entered.length}
                            label="Already in QuickBooks"
                        />
                        <div className={styles.summaryDivider} />
                        <Stat
                            value={result.skipped_receipts}
                            label="Receipts Skipped"
                        />
                        <div className={styles.summaryDivider} />
                        <Stat
                            value={result.qb_bills_parsed}
                            label="QB Bills Parsed"
                        />
                    </div>

                    {/* Zero-state: everything is entered */}
                    {result.needs_entry.length === 0 && (
                        <div className={styles.allClear}>
                            <CheckCircleIcon />
                            <p>All scanned invoices are already in QuickBooks!</p>
                        </div>
                    )}

                    {/* Tabs */}
                    {(result.needs_entry.length > 0 || result.already_entered.length > 0) && (
                        <>
                            <div className={styles.tabs}>
                                <button
                                    className={`${styles.tab} ${activeTab === "needs_entry" ? styles.tabActive : ""}`}
                                    onClick={() => setActiveTab("needs_entry")}
                                >
                                    <span className={styles.tabDot} data-status="needed" />
                                    Needs Entry
                                    <span className={styles.tabCount}>{result.needs_entry.length}</span>
                                </button>
                                <button
                                    className={`${styles.tab} ${activeTab === "already_entered" ? styles.tabActive : ""}`}
                                    onClick={() => setActiveTab("already_entered")}
                                >
                                    <span className={styles.tabDot} data-status="done" />
                                    Already Entered
                                    <span className={styles.tabCount}>{result.already_entered.length}</span>
                                </button>
                            </div>

                            <div className={styles.cardList}>
                                {activeTab === "needs_entry" &&
                                    (result.needs_entry.length === 0
                                        ? <p className={styles.emptyState}>No invoices need entry — you're all caught up!</p>
                                        : result.needs_entry.map((item, i) => (
                                            <BillCard key={i} item={item} status="needs_entry" />
                                        ))
                                    )
                                }
                                {activeTab === "already_entered" &&
                                    (result.already_entered.length === 0
                                        ? <p className={styles.emptyState}>None of your scanned invoices matched QuickBooks records.</p>
                                        : result.already_entered.map((item, i) => (
                                            <BillCard key={i} item={item} status="already_entered" />
                                        ))
                                    )
                                }
                            </div>
                        </>
                    )}

                    {/* Export button */}
                    {result.needs_entry.length > 0 && (
                        <button className={styles.btnExport} onClick={exportToExcel}>
                            <ExcelIcon /> Export to Excel
                        </button>
                    )}

                    {/* Re-upload button */}
                    <button className={styles.btnRefresh} onClick={reset}>
                        <RefreshIcon /> Check a new export
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