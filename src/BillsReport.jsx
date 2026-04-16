/**
 * BillsReport.jsx
 *
 * Displays confirmed invoices in QuickBooks bill-entry order.
 * Click any cell to copy its value. Print-friendly layout.
 */

import { useState, useEffect } from "react";
import styles from "./BillsReport.module.css";

const API = "/api/bills-report";
const API_KEY = process.env.REACT_APP_API_KEY;

// ── Icons ─────────────────────────────────────────────────────────────────────
const PrintIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
    </svg>
);

const CopyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ExcelIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-4.47" />
    </svg>
);

// ── Copy cell ─────────────────────────────────────────────────────────────────
function CopyCell({ value, className }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <td
            className={`${styles.copyCell} ${className || ""} ${!value ? styles.empty : ""}`}
            onClick={copy}
            title={value ? `Click to copy: ${value}` : "—"}
        >
            <span className={styles.cellValue}>{value || "—"}</span>
            {value && (
                <span className={`${styles.copyIcon} ${copied ? styles.copied : ""}`}>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                </span>
            )}
        </td>
    );
}

// ── Vendor group ──────────────────────────────────────────────────────────────
function VendorGroup({ vendor, bills, checked, onToggle }) {
    const vendorTotal = bills.reduce((s, b) => s + parseFloat(b.amount || 0), 0);

    return (
        <>
            <tr className={styles.vendorRow}>
                <td colSpan={6} className={styles.vendorHeader}>
                    <span className={styles.vendorName}>{vendor}</span>
                    <span className={styles.vendorMeta}>
                        {bills.length} bill{bills.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
                        ${vendorTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                </td>
            </tr>
            {bills.map((bill, i) => {
                const isChecked = checked.has(bill.confirmed_name);
                return (
                    <tr
                        key={bill.confirmed_name}
                        className={`${styles.billRow} ${isChecked ? styles.billRowDone : ""} ${i % 2 === 0 ? styles.billRowEven : ""}`}
                    >
                        <td className={styles.checkCell}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={isChecked}
                                onChange={() => onToggle(bill.confirmed_name)}
                            />
                        </td>
                        <CopyCell value={bill.vendor} className={styles.tdVendor} />
                        <CopyCell value={bill.bill_date} className={styles.tdDate} />
                        <CopyCell value={bill.bill_no} className={styles.tdBillNo} />
                        <CopyCell
                            value={bill.amount
                                ? `$${parseFloat(bill.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                                : null}
                            className={styles.tdAmount}
                        />
                        <td className={styles.tdType}>
                            <span className={`${styles.typePill} ${styles[`type_${bill.doc_type}`]}`}>
                                {bill.doc_type || "—"}
                            </span>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BillsReport() {
    const [phase, setPhase] = useState("loading");
    const [data, setData] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [filter, setFilter] = useState("all"); // all | pending | done
    const [checked, setChecked] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem("bills_checked") || "[]")); }
        catch { return new Set(); }
    });

    // ── Load ─────────────────────────────────────────────────────────────
    const load = async () => {
        setPhase("loading");
        setErrorMsg("");
        try {
            const res = await fetch(`${API}/pending`, {
                headers: { "X-API-Key": API_KEY },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail ?? `Server error ${res.status}`);
            }
            setData(await res.json());
            setPhase("ready");
        } catch (e) {
            setErrorMsg(e.message);
            setPhase("error");
        }
    };

    useEffect(() => { load(); }, []);

    // ── Export ───────────────────────────────────────────────────────────
    const exportToExcel = () => {
        fetch(`${API}/export.xlsx`, { headers: { "X-API-Key": API_KEY } })
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `bills_to_enter_${new Date().toISOString().slice(0, 10)}.xlsx`;
                link.click();
                URL.revokeObjectURL(url);
            });
    };

    // ── Checked state ────────────────────────────────────────────────────
    const toggleChecked = (name) => {
        setChecked(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            localStorage.setItem("bills_checked", JSON.stringify([...next]));
            return next;
        });
    };

    const clearChecked = () => {
        setChecked(new Set());
        localStorage.removeItem("bills_checked");
    };

    // ── Derived state ────────────────────────────────────────────────────
    const groupedBills = () => {
        if (!data) return {};
        const bills = data.bills.filter(b => {
            if (filter === "pending") return !checked.has(b.confirmed_name);
            if (filter === "done") return checked.has(b.confirmed_name);
            return true;
        });
        return bills.reduce((acc, b) => {
            const v = b.vendor || "Unknown";
            if (!acc[v]) acc[v] = [];
            acc[v].push(b);
            return acc;
        }, {});
    };

    const groups = groupedBills();
    const vendors = Object.keys(groups).sort();
    const doneCount = data ? data.bills.filter(b => checked.has(b.confirmed_name)).length : 0;
    const pendingCount = data ? data.bills.length - doneCount : 0;
    const remaining = data ? data.bills
        .filter(b => !checked.has(b.confirmed_name))
        .reduce((s, b) => s + parseFloat(b.amount || 0), 0) : 0;

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div className={styles.root}>

            {/* Header */}
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Bills to Enter</h2>
                    <p className={styles.subtitle}>
                        Click any cell to copy · check off bills as you enter them in QuickBooks
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnExcel} onClick={exportToExcel} disabled={phase !== "ready"}>
                        <ExcelIcon /> Export to Excel
                    </button>
                    <button className={styles.btnGhost} onClick={() => window.print()}>
                        <PrintIcon /> Print
                    </button>
                    <button className={styles.btnGhost} onClick={load}>
                        <RefreshIcon />
                    </button>
                </div>
            </header>

            {/* Loading */}
            {phase === "loading" && (
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Loading bills…</p>
                </div>
            )}

            {/* Error */}
            {phase === "error" && (
                <div className={styles.errorBox}>
                    <p>{errorMsg}</p>
                    <button className={styles.btnGhost} onClick={load}>Try again</button>
                </div>
            )}

            {/* Ready */}
            {phase === "ready" && data && (
                <>
                    {/* Stats bar */}
                    <div className={styles.statsBar}>
                        <div className={styles.stat}>
                            <span className={styles.statNum}>{pendingCount}</span>
                            <span className={styles.statLbl}>Remaining</span>
                        </div>
                        <div className={styles.statDiv} />
                        <div className={styles.stat}>
                            <span className={styles.statNum}>{doneCount}</span>
                            <span className={styles.statLbl}>Entered ✓</span>
                        </div>
                        <div className={styles.statDiv} />
                        <div className={styles.stat}>
                            <span className={styles.statNum}>
                                ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            <span className={styles.statLbl}>$ Remaining</span>
                        </div>
                        <div className={styles.statDiv} />
                        <div className={styles.stat}>
                            <span className={styles.statNum}>
                                ${data.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            <span className={styles.statLbl}>Total</span>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className={styles.toolbar}>
                        <div className={styles.filters}>
                            {[["all", "All"], ["pending", "Remaining"], ["done", "Entered"]].map(([v, l]) => (
                                <button
                                    key={v}
                                    className={`${styles.filterBtn} ${filter === v ? styles.filterActive : ""}`}
                                    onClick={() => setFilter(v)}
                                >{l}</button>
                            ))}
                        </div>
                        {doneCount > 0 && (
                            <button className={styles.btnClear} onClick={clearChecked}>
                                Clear {doneCount} ✓
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.thCheck}></th>
                                    <th className={styles.thVendor}>Vendor</th>
                                    <th className={styles.thDate}>Bill Date</th>
                                    <th className={styles.thBillNo}>Bill No.</th>
                                    <th className={styles.thAmount}>Amount</th>
                                    <th className={styles.thType}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.length === 0 ? (
                                    <tr><td colSpan={6} className={styles.emptyState}>
                                        {filter === "done" ? "No bills entered yet." : "All bills have been entered! 🎉"}
                                    </td></tr>
                                ) : vendors.map(vendor => (
                                    <VendorGroup
                                        key={vendor}
                                        vendor={vendor}
                                        bills={groups[vendor]}
                                        checked={checked}
                                        onToggle={toggleChecked}
                                    />
                                ))}
                            </tbody>
                            {vendors.length > 0 && (
                                <tfoot>
                                    <tr className={styles.footRow}>
                                        <td colSpan={4} className={styles.footLabel}>
                                            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
                                            {Object.values(groups).flat().length} bills
                                        </td>
                                        <td className={styles.footAmount}>
                                            ${Object.values(groups).flat()
                                                .reduce((s, b) => s + parseFloat(b.amount || 0), 0)
                                                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}