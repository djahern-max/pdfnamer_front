/**
 * Organizer.jsx
 *
 * Groups confirmed invoices into vendor sub-folders inside Downloads.
 * Offers a preview (dry-run) before committing the move.
 */

import { useState } from "react";
import styles from "./Organizer.module.css";

const API     = "/api/organizer";
const API_KEY = process.env.REACT_APP_API_KEY;

// ── Icons ─────────────────────────────────────────────────────────────────────
const FolderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

const SkipIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
);

const AlertIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
);

const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-4.47"/>
    </svg>
);

// ── Stat ──────────────────────────────────────────────────────────────────────
function Stat({ value, label, accent }) {
    return (
        <div className={`${styles.stat} ${accent ? styles.statAccent : ""}`}>
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
        </div>
    );
}

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({ item }) {
    const icons   = { moved: <CheckIcon />, already_there: <SkipIcon />, not_found: <AlertIcon /> };
    const classes = { moved: styles.rowMoved, already_there: styles.rowSkip, not_found: styles.rowMissing };

    return (
        <div className={`${styles.row} ${classes[item.status]}`}>
            <span className={styles.rowIcon}>{icons[item.status]}</span>
            <div className={styles.rowBody}>
                <span className={styles.rowFile}>{item.filename}</span>
                <span className={styles.rowDest}>
                    {item.status === "not_found"
                        ? "File not found on disk"
                        : `→ ${item.vendor}/`}
                </span>
            </div>
            <span className={styles.rowBadge} data-status={item.status}>
                {item.status === "moved"        && "Moved"}
                {item.status === "already_there" && "Already there"}
                {item.status === "not_found"     && "Not found"}
            </span>
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Organizer() {
    const [phase,    setPhase]    = useState("idle"); // idle | loading | preview | done | error
    const [result,   setResult]   = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [filter,   setFilter]   = useState("all"); // all | moved | already_there | not_found

    const call = async (endpoint) => {
        setPhase("loading");
        setResult(null);
        setErrorMsg("");
        try {
            const res = await fetch(`${API}/${endpoint}`, {
                method: endpoint === "preview" ? "GET" : "POST",
                headers: { "X-API-Key": API_KEY },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail ?? `Server error ${res.status}`);
            }
            const data = await res.json();
            setResult(data);
            setPhase(endpoint === "preview" ? "preview" : "done");
            setFilter("all");
        } catch (e) {
            setErrorMsg(e.message);
            setPhase("error");
        }
    };

    const reset = () => { setPhase("idle"); setResult(null); setErrorMsg(""); };

    const filtered = result?.results?.filter(r =>
        filter === "all" ? true : r.status === filter
    ) ?? [];

    // Group preview results by vendor for a cleaner summary
    const vendorGroups = result
        ? [...new Set(result.results.filter(r => r.status !== "not_found").map(r => r.vendor))].sort()
        : [];

    return (
        <div className={styles.root}>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerIcon}><FolderIcon /></div>
                <div>
                    <h2 className={styles.title}>Invoice Organizer</h2>
                    <p className={styles.subtitle}>
                        Group your renamed invoices into vendor folders inside Downloads
                    </p>
                </div>
            </header>

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className={styles.idleBox}>
                    <p className={styles.idleDesc}>
                        This will move each confirmed invoice into a sub-folder named after its vendor.
                        Run a <strong>Preview</strong> first to see exactly what will happen.
                    </p>
                    <div className={styles.idleExample}>
                        <span className={styles.examplePath}>Downloads/</span>
                        <span className={styles.exampleArrow}>→</span>
                        <span className={styles.examplePath}>Downloads/J.M. Hayden Equipment LLC/</span>
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.btnGhost} onClick={() => call("preview")}>
                            Preview
                        </button>
                        <button className={styles.btnPrimary} onClick={() => call("organize")}>
                            Organize Now
                        </button>
                    </div>
                </div>
            )}

            {/* ── Loading ── */}
            {phase === "loading" && (
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Scanning your files…</p>
                </div>
            )}

            {/* ── Preview or Done ── */}
            {(phase === "preview" || phase === "done") && result && (
                <div className={styles.results}>

                    {/* Banner */}
                    {phase === "preview" && (
                        <div className={styles.previewBanner}>
                            <strong>Preview only</strong> — no files have been moved yet.
                            Click <em>Organize Now</em> to apply.
                        </div>
                    )}
                    {phase === "done" && (
                        <div className={styles.doneBanner}>
                            <CheckIcon /> Done! {result.moved} file{result.moved !== 1 ? "s" : ""} moved
                            into {result.vendors_created} vendor folder{result.vendors_created !== 1 ? "s" : ""}.
                        </div>
                    )}

                    {/* Stats */}
                    <div className={styles.summary}>
                        <Stat value={result.moved}         label="To Move"        accent={result.moved > 0} />
                        <div className={styles.divider} />
                        <Stat value={result.vendors_created} label="Vendor Folders" />
                        <div className={styles.divider} />
                        <Stat value={result.already_there} label="Already There"  />
                        <div className={styles.divider} />
                        <Stat value={result.not_found}     label="Not Found"      />
                    </div>

                    {/* Vendor summary chips (preview only) */}
                    {phase === "preview" && vendorGroups.length > 0 && (
                        <div className={styles.vendorChips}>
                            {vendorGroups.map(v => (
                                <span key={v} className={styles.chip}>{v}</span>
                            ))}
                        </div>
                    )}

                    {/* Filter tabs */}
                    <div className={styles.filters}>
                        {["all", "moved", "already_there", "not_found"].map(f => (
                            <button
                                key={f}
                                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === "all"          && `All (${result.results.length})`}
                                {f === "moved"        && `Moving (${result.moved})`}
                                {f === "already_there" && `Already There (${result.already_there})`}
                                {f === "not_found"    && `Not Found (${result.not_found})`}
                            </button>
                        ))}
                    </div>

                    {/* Result rows */}
                    <div className={styles.rowList}>
                        {filtered.map((item, i) => <ResultRow key={i} item={item} />)}
                        {filtered.length === 0 && (
                            <p className={styles.empty}>No items in this category.</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        {phase === "preview" && result.moved > 0 && (
                            <button className={styles.btnPrimary} onClick={() => call("organize")}>
                                Organize Now ({result.moved} files)
                            </button>
                        )}
                        <button className={styles.btnGhost} onClick={reset}>
                            <RefreshIcon /> Reset
                        </button>
                    </div>
                </div>
            )}

            {/* ── Error ── */}
            {phase === "error" && (
                <div className={styles.errorBox}>
                    <AlertIcon />
                    <p>{errorMsg || "Something went wrong."}</p>
                    <button className={styles.btnGhost} onClick={reset}>Try again</button>
                </div>
            )}
        </div>
    );
}
