/**
 * JobCosts.jsx
 *
 * Two views:
 *   Unassigned  — invoices with no job classification; inline assign or mark overhead.
 *                 Export to Excel to share with team, then classify as replies come in.
 *   Cost Summary — per-job totals once invoices have been classified.
 */

import { useState, useEffect } from "react";
import styles from "./JobCosts.module.css";

const API = "/api/job-costs";
const JOBS_API = "/api/jobs";
const API_KEY = process.env.REACT_APP_API_KEY;

const h = () => ({ "X-API-Key": API_KEY });
const hj = () => ({ "X-API-Key": API_KEY, "Content-Type": "application/json" });

// ── Icons ─────────────────────────────────────────────────────────────────────
const ExcelIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
);

const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-4.47" />
    </svg>
);

const fmt$ = (amt) =>
    amt ? `$${parseFloat(amt).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";

// ── Per-row inline assignment ─────────────────────────────────────────────────
function UnassignedRow({ item, jobs, onAssigned }) {
    const [selectedJobId, setSelectedJobId] = useState("");
    const [busy, setBusy] = useState(false);
    const [removing, setRemoving] = useState(false);

    const classify = async (isJobCost, jobId = null) => {
        setBusy(true);
        try {
            const res = await fetch(`${API}/${item.id}`, {
                method: "PATCH",
                headers: hj(),
                body: JSON.stringify({ is_job_cost: isJobCost, job_id: jobId }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            setRemoving(true);
            setTimeout(() => onAssigned(item.id), 350);
        } catch (e) {
            console.error("Classify failed:", e);
            setBusy(false);
        }
    };

    return (
        <tr className={`${styles.row} ${removing ? styles.rowRemoving : ""}`}>
            <td className={styles.tdVendor}>{item.vendor || "—"}</td>
            <td className={styles.tdDate}>{item.doc_date || "—"}</td>
            <td className={styles.tdBillNo}>{item.invoice_number || "—"}</td>
            <td className={styles.tdAmount}>{fmt$(item.amount)}</td>
            <td className={styles.tdType}>
                <span className={`${styles.typePill} ${styles[`type_${item.doc_type}`] || ""}`}>
                    {item.doc_type || "—"}
                </span>
            </td>
            <td className={styles.tdAssign}>
                <div className={styles.assignControls}>
                    <select
                        className={styles.jobSelect}
                        value={selectedJobId}
                        onChange={e => setSelectedJobId(e.target.value)}
                        disabled={busy}
                    >
                        <option value="">— Select Job —</option>
                        {jobs.map(j => (
                            <option key={j.id} value={j.id}>
                                {j.name}{j.customer ? ` · ${j.customer}` : ""}
                            </option>
                        ))}
                    </select>
                    <button
                        className={styles.btnAssign}
                        disabled={!selectedJobId || busy}
                        onClick={() => classify(true, parseInt(selectedJobId, 10))}
                    >
                        Assign
                    </button>
                    <span className={styles.assignOr}>or</span>
                    <button
                        className={styles.btnOverhead}
                        disabled={busy}
                        onClick={() => classify(false)}
                    >
                        Overhead
                    </button>
                </div>
                {item.existing_job_name && (
                    <div className={styles.existingHint}>
                        Previously tagged: {item.existing_job_name}
                    </div>
                )}
            </td>
        </tr>
    );
}

// ── Cost Summary view ─────────────────────────────────────────────────────────
function SummaryView() {
    const [data, setData] = useState(null);
    const [phase, setPhase] = useState("loading");
    const [errorMsg, setErrorMsg] = useState("");

    const load = async () => {
        setPhase("loading");
        try {
            const res = await fetch(`${API}/summary`, { headers: h() });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            setData(await res.json());
            setPhase("ready");
        } catch (e) {
            setErrorMsg(e.message);
            setPhase("error");
        }
    };

    useEffect(() => { load(); }, []);

    if (phase === "loading") return (
        <div className={styles.loadingBox}><div className={styles.spinner} /><p>Loading…</p></div>
    );
    if (phase === "error") return (
        <div className={styles.errorBox}>
            <p>{errorMsg}</p>
            <button className={styles.btnGhost} onClick={load}>Try again</button>
        </div>
    );
    if (!data || data.length === 0) return (
        <p className={styles.emptyState}>
            No classified invoices yet. Assign jobs or mark invoices as overhead in the Unassigned tab.
        </p>
    );

    const jobRows = data.filter(r => r.job_name !== "Overhead");
    const overheadRow = data.find(r => r.job_name === "Overhead");
    const grandTotal = data.reduce((s, r) => s + r.total, 0);
    const grandCount = data.reduce((s, r) => s + r.count, 0);

    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.thJob}>Job</th>
                        <th className={styles.thCustomer}>Customer</th>
                        <th className={styles.thCount}>Invoices</th>
                        <th className={styles.thSummaryTotal}>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {jobRows.map((row, i) => (
                        <tr
                            key={row.job_id ?? row.job_name}
                            className={`${styles.summaryRow} ${i % 2 === 0 ? styles.summaryRowEven : ""}`}
                        >
                            <td className={styles.tdJob}>{row.job_name}</td>
                            <td className={styles.tdCustomer}>{row.customer || "—"}</td>
                            <td className={styles.tdCount}>{row.count}</td>
                            <td className={styles.tdSummaryTotal}>{fmt$(row.total)}</td>
                        </tr>
                    ))}
                    {overheadRow && (
                        <tr className={styles.overheadRow}>
                            <td className={styles.tdJob}>Overhead</td>
                            <td className={styles.tdCustomer}>—</td>
                            <td className={styles.tdCount}>{overheadRow.count}</td>
                            <td className={styles.tdSummaryTotal}>{fmt$(overheadRow.total)}</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className={styles.footRow}>
                        <td colSpan={2} className={styles.footLabel}>Grand Total</td>
                        <td className={styles.footCount}>{grandCount}</td>
                        <td className={styles.footTotal}>{fmt$(grandTotal)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function JobCosts() {
    const [view, setView] = useState("unassigned");
    const [items, setItems] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [phase, setPhase] = useState("loading");
    const [errorMsg, setErrorMsg] = useState("");

    const load = async () => {
        setPhase("loading");
        setErrorMsg("");
        try {
            const [unassRes, jobsRes] = await Promise.all([
                fetch(`${API}/unassigned`, { headers: h() }),
                fetch(`${JOBS_API}?active_only=true`, { headers: h() }),
            ]);
            if (!unassRes.ok) throw new Error(`Server error ${unassRes.status}`);
            if (!jobsRes.ok) throw new Error(`Server error ${jobsRes.status}`);
            setItems(await unassRes.json());
            setJobs(await jobsRes.json());
            setPhase("ready");
        } catch (e) {
            setErrorMsg(e.message);
            setPhase("error");
        }
    };

    useEffect(() => { load(); }, []);

    const onAssigned = (id) => setItems(prev => prev.filter(i => i.id !== id));

    const exportExcel = () => {
        fetch(`${API}/unassigned.xlsx`, { headers: h() })
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `unassigned_invoices_${new Date().toISOString().slice(0, 10)}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
            });
    };

    const totalUnassigned = items.reduce((s, i) => s + parseFloat(i.amount || 0), 0);

    return (
        <div className={styles.root}>

            {/* Header */}
            <header className={styles.header}>
                <div>
                    <div className={styles.titleRow}>
                        <h2 className={styles.title}>Job Costs</h2>
                        {phase === "ready" && view === "unassigned" && items.length > 0 && (
                            <span className={styles.badge}>{items.length} unassigned</span>
                        )}
                    </div>
                    <p className={styles.subtitle}>
                        {view === "unassigned"
                            ? "Assign each invoice to a job or mark as overhead · export to share with your team"
                            : "Total costs by job across all classified invoices"}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    {view === "unassigned" && (
                        <button
                            className={styles.btnExcel}
                            onClick={exportExcel}
                            disabled={phase !== "ready" || items.length === 0}
                        >
                            <ExcelIcon /> Export
                        </button>
                    )}
                    <button className={styles.btnGhost} onClick={load}>
                        <RefreshIcon />
                    </button>
                </div>
            </header>

            {/* Sub-tab toggle */}
            <div className={styles.viewToggle}>
                {[["unassigned", "Unassigned"], ["summary", "Cost Summary"]].map(([v, l]) => (
                    <button
                        key={v}
                        className={`${styles.viewBtn} ${view === v ? styles.viewBtnActive : ""}`}
                        onClick={() => setView(v)}
                    >
                        {l}
                    </button>
                ))}
            </div>

            {/* Summary view */}
            {view === "summary" && <SummaryView />}

            {/* Unassigned view */}
            {view === "unassigned" && (
                <>
                    {phase === "loading" && (
                        <div className={styles.loadingBox}>
                            <div className={styles.spinner} />
                            <p>Loading…</p>
                        </div>
                    )}
                    {phase === "error" && (
                        <div className={styles.errorBox}>
                            <p>{errorMsg}</p>
                            <button className={styles.btnGhost} onClick={load}>Try again</button>
                        </div>
                    )}
                    {phase === "ready" && (
                        <>
                            {/* Stats */}
                            <div className={styles.statsBar}>
                                <div className={styles.stat}>
                                    <span className={styles.statNum}>{items.length}</span>
                                    <span className={styles.statLbl}>Unassigned</span>
                                </div>
                                <div className={styles.statDiv} />
                                <div className={styles.stat}>
                                    <span className={styles.statNum}>
                                        ${totalUnassigned.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className={styles.statLbl}>Total $</span>
                                </div>
                            </div>

                            {items.length === 0 ? (
                                <p className={styles.emptyState}>
                                    All invoices have been assigned — nothing left to classify.
                                </p>
                            ) : (
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th className={styles.thVendor}>Vendor</th>
                                                <th className={styles.thDate}>Date</th>
                                                <th className={styles.thBillNo}>Invoice #</th>
                                                <th className={styles.thAmount}>Amount</th>
                                                <th className={styles.thType}>Type</th>
                                                <th className={styles.thAssign}>Assign To</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className={styles.noJobsNote}>
                                                        No active jobs found. Go to the Jobs tab to create one first.
                                                    </td>
                                                </tr>
                                            ) : items.map(item => (
                                                <UnassignedRow
                                                    key={item.id}
                                                    item={item}
                                                    jobs={jobs}
                                                    onAssigned={onAssigned}
                                                />
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className={styles.footRow}>
                                                <td colSpan={3} className={styles.footLabel}>
                                                    {items.length} invoice{items.length !== 1 ? "s" : ""}
                                                </td>
                                                <td className={styles.footTotal}>
                                                    ${totalUnassigned.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td colSpan={2} />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
