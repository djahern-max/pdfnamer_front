/**
 * Settings.jsx
 *
 * Vendor alias management.
 * Maps invoice vendor name variants → canonical QB/Drive folder names.
 */

import { useState, useEffect } from "react";
import styles from "./Settings.module.css";

const API = "/api/vendor-aliases";
const API_KEY = process.env.REACT_APP_API_KEY;

// ── Icons ─────────────────────────────────────────────────────────────────────
const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
    </svg>
);

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
    const [aliases, setAliases] = useState([]);
    const [phase, setPhase] = useState("loading"); // loading | ready | error
    const [errorMsg, setErrorMsg] = useState("");
    const [invoiceName, setInvoiceName] = useState("");
    const [canonicalName, setCanonicalName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    // ── Load ─────────────────────────────────────────────────────────────
    const load = async () => {
        setPhase("loading");
        setErrorMsg("");
        try {
            const res = await fetch(API, { headers: { "X-API-Key": API_KEY } });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            setAliases(await res.json());
            setPhase("ready");
        } catch (e) {
            setErrorMsg(e.message);
            setPhase("error");
        }
    };

    useEffect(() => { load(); }, []);

    // ── Add alias ────────────────────────────────────────────────────────
    const addAlias = async () => {
        if (!invoiceName.trim() || !canonicalName.trim()) return;
        setSaving(true);
        setSaveError("");
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoice_name: invoiceName.trim(),
                    canonical_name: canonicalName.trim(),
                }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const created = await res.json();
            // Upsert locally — replace if same invoice_name already exists
            setAliases(prev => {
                const filtered = prev.filter(a => a.invoice_name !== created.invoice_name);
                return [...filtered, created].sort((a, b) =>
                    a.invoice_name.localeCompare(b.invoice_name)
                );
            });
            setInvoiceName("");
            setCanonicalName("");
        } catch (e) {
            setSaveError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Delete alias ─────────────────────────────────────────────────────
    const deleteAlias = async (id) => {
        setDeletingId(id);
        try {
            const res = await fetch(`${API}/${id}`, {
                method: "DELETE",
                headers: { "X-API-Key": API_KEY },
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            setAliases(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            console.error("Delete failed:", e);
        } finally {
            setDeletingId(null);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div className={styles.root}>

            {/* ── Vendor Aliases section ── */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Vendor Aliases</h2>
                        <p className={styles.sectionSubtitle}>
                            Map invoice vendor name variants to their canonical QuickBooks name.
                            Used by QB Checker (matching) and Archive to Drive (folder naming).
                        </p>
                    </div>
                </div>

                {/* Add form */}
                <div className={styles.addForm}>
                    <div className={styles.addFields}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Invoice Name (as it appears on the PDF)</label>
                            <input
                                className={styles.input}
                                value={invoiceName}
                                onChange={e => setInvoiceName(e.target.value)}
                                placeholder="e.g. Eliminator Systems Inc."
                                spellCheck={false}
                                onKeyDown={e => e.key === "Enter" && addAlias()}
                            />
                        </div>
                        <div className={styles.arrow}>→</div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Canonical Name (as it appears in QuickBooks)</label>
                            <input
                                className={styles.input}
                                value={canonicalName}
                                onChange={e => setCanonicalName(e.target.value)}
                                placeholder="e.g. Eliminator Systems Inc"
                                spellCheck={false}
                                onKeyDown={e => e.key === "Enter" && addAlias()}
                            />
                        </div>
                    </div>
                    <button
                        className={styles.btnAdd}
                        onClick={addAlias}
                        disabled={saving || !invoiceName.trim() || !canonicalName.trim()}
                    >
                        <PlusIcon /> {saving ? "Saving…" : "Add Alias"}
                    </button>
                    {saveError && <p className={styles.saveError}>{saveError}</p>}
                </div>

                {/* Alias table */}
                {phase === "loading" && (
                    <div className={styles.loadingBox}>
                        <div className={styles.spinner} />
                        <p>Loading aliases…</p>
                    </div>
                )}

                {phase === "error" && (
                    <div className={styles.errorBox}>
                        <p>{errorMsg}</p>
                        <button className={styles.btnGhost} onClick={load}>Try again</button>
                    </div>
                )}

                {phase === "ready" && (
                    aliases.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No aliases yet. Add one above to fix vendor name mismatches.</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.thInvoice}>Invoice Name</th>
                                    <th className={styles.thArrow}></th>
                                    <th className={styles.thCanonical}>Canonical Name (QB / Drive)</th>
                                    <th className={styles.thAction}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {aliases.map((alias, i) => (
                                    <tr
                                        key={alias.id}
                                        className={`${styles.row} ${i % 2 === 0 ? styles.rowEven : ""}`}
                                    >
                                        <td className={styles.tdInvoice}>{alias.invoice_name}</td>
                                        <td className={styles.tdArrow}>→</td>
                                        <td className={styles.tdCanonical}>{alias.canonical_name}</td>
                                        <td className={styles.tdAction}>
                                            <button
                                                className={styles.btnDelete}
                                                onClick={() => deleteAlias(alias.id)}
                                                disabled={deletingId === alias.id}
                                                title="Remove alias"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </section>
        </div>
    );
}