/**
 * Jobs.jsx
 *
 * Job / project list management.
 * Each cost is classified per-invoice (in PDF Namer) as a job cost — linked
 * to a job defined here — or as Overhead. The PDF Namer dropdown pulls the
 * active jobs from this list.
 */

import { useState, useEffect } from "react";
import styles from "./Jobs.module.css";

const API = "/api/jobs";
const API_KEY = process.env.REACT_APP_API_KEY;

// ── Icons ─────────────────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
    </svg>
);
const ArchiveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" />
        <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
);
const RestoreIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 12a9 9 0 109-9 9 9 0 00-6.7 3" />
        <polyline points="3 3 3 6 6 6" />
    </svg>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [phase, setPhase] = useState("loading"); // loading | ready | error
    const [errorMsg, setErrorMsg] = useState("");
    const [name, setName] = useState("");
    const [customer, setCustomer] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [busyId, setBusyId] = useState(null);

    // ── Load ─────────────────────────────────────────────────────────────
    const load = async () => {
        setPhase("loading");
        setErrorMsg("");
        try {
            const res = await fetch(API, { headers: { "X-API-Key": API_KEY } });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            setJobs(await res.json());
            setPhase("ready");
        } catch (e) {
            setErrorMsg(e.message);
            setPhase("error");
        }
    };

    useEffect(() => { load(); }, []);

    // ── Add job ──────────────────────────────────────────────────────────
    const addJob = async () => {
        if (!name.trim()) return;
        setSaving(true);
        setSaveError("");
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    customer: customer.trim() || null,
                }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const created = await res.json();
            setJobs(prev => {
                const filtered = prev.filter(j => j.id !== created.id);
                return [...filtered, created].sort((a, b) => a.name.localeCompare(b.name));
            });
            setName("");
            setCustomer("");
        } catch (e) {
            setSaveError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Archive / restore ────────────────────────────────────────────────
    const setActive = async (id, is_active) => {
        setBusyId(id);
        try {
            const res = await fetch(`${API}/${id}`, {
                method: "PATCH",
                headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
                body: JSON.stringify({ is_active }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const updated = await res.json();
            setJobs(prev => prev.map(j => (j.id === id ? updated : j)));
        } catch (e) {
            console.error("Update failed:", e);
        } finally {
            setBusyId(null);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────
    const deleteJob = async (id) => {
        setBusyId(id);
        try {
            const res = await fetch(`${API}/${id}`, {
                method: "DELETE",
                headers: { "X-API-Key": API_KEY },
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            setJobs(prev => prev.filter(j => j.id !== id));
        } catch (e) {
            console.error("Delete failed:", e);
        } finally {
            setBusyId(null);
        }
    };

    const active = jobs.filter(j => j.is_active);
    const archived = jobs.filter(j => !j.is_active);

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div className={styles.root}>
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Jobs</h2>
                        <p className={styles.sectionSubtitle}>
                            Define the jobs you cost invoices against. In PDF Namer, mark each
                            invoice as a job cost (and pick a job here) or as Overhead.
                        </p>
                    </div>
                </div>

                {/* Add form */}
                <div className={styles.addForm}>
                    <div className={styles.addFields}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Job Name</label>
                            <input
                                className={styles.input}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. MYERS"
                                spellCheck={false}
                                onKeyDown={e => e.key === "Enter" && addJob()}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Customer (optional)</label>
                            <input
                                className={styles.input}
                                value={customer}
                                onChange={e => setCustomer(e.target.value)}
                                placeholder="e.g. Myers Residence"
                                spellCheck={false}
                                onKeyDown={e => e.key === "Enter" && addJob()}
                            />
                        </div>
                        <button
                            className={styles.addBtn}
                            onClick={addJob}
                            disabled={saving || !name.trim()}
                        >
                            <PlusIcon /> Add
                        </button>
                    </div>
                    {saveError && <p className={styles.saveError}>{saveError}</p>}
                </div>

                {/* States */}
                {phase === "loading" && <p className={styles.muted}>Loading jobs…</p>}
                {phase === "error" && (
                    <div className={styles.errorBox}>
                        <p>{errorMsg}</p>
                        <button className={styles.btnGhost} onClick={load}>Try again</button>
                    </div>
                )}

                {/* Active jobs */}
                {phase === "ready" && (
                    <>
                        {active.length === 0 ? (
                            <p className={styles.muted}>No active jobs yet — add one above.</p>
                        ) : (
                            <ul className={styles.list}>
                                {active.map(j => (
                                    <li key={j.id} className={styles.row}>
                                        <div className={styles.rowMain}>
                                            <span className={styles.jobName}>{j.name}</span>
                                            {j.customer && (
                                                <span className={styles.jobCustomer}>{j.customer}</span>
                                            )}
                                        </div>
                                        <div className={styles.rowActions}>
                                            <button
                                                className={styles.iconBtn}
                                                title="Archive"
                                                disabled={busyId === j.id}
                                                onClick={() => setActive(j.id, false)}
                                            >
                                                <ArchiveIcon />
                                            </button>
                                            <button
                                                className={`${styles.iconBtn} ${styles.iconDanger}`}
                                                title="Delete"
                                                disabled={busyId === j.id}
                                                onClick={() => deleteJob(j.id)}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Archived jobs */}
                        {archived.length > 0 && (
                            <>
                                <h3 className={styles.subhead}>Archived</h3>
                                <ul className={styles.list}>
                                    {archived.map(j => (
                                        <li key={j.id} className={`${styles.row} ${styles.rowArchived}`}>
                                            <div className={styles.rowMain}>
                                                <span className={styles.jobName}>{j.name}</span>
                                                {j.customer && (
                                                    <span className={styles.jobCustomer}>{j.customer}</span>
                                                )}
                                            </div>
                                            <div className={styles.rowActions}>
                                                <button
                                                    className={styles.iconBtn}
                                                    title="Restore"
                                                    disabled={busyId === j.id}
                                                    onClick={() => setActive(j.id, true)}
                                                >
                                                    <RestoreIcon />
                                                </button>
                                                <button
                                                    className={`${styles.iconBtn} ${styles.iconDanger}`}
                                                    title="Delete"
                                                    disabled={busyId === j.id}
                                                    onClick={() => deleteJob(j.id)}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}