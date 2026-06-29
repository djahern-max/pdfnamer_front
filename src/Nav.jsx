import { useState, useEffect } from "react";
import styles from "./Nav.module.css";

const API_KEY = process.env.REACT_APP_API_KEY;
const h = () => ({ "X-API-Key": API_KEY });

// ── Icons ─────────────────────────────────────────────────────────────────────
const DocumentIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);
const CloudIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.886 11.095H6.75z" />
    </svg>
);
const ListIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const FolderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
    </svg>
);
const BriefcaseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
const DollarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const GearIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// ── Nav item ──────────────────────────────────────────────────────────────────
function Item({ id, label, icon, activeTab, setTab, badge }) {
    const isActive = activeTab === id;
    return (
        <button
            className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
            onClick={() => setTab(id)}
        >
            <span className={styles.itemIcon}>{icon}</span>
            <span className={styles.itemLabel}>{label}</span>
            {badge > 0 && <span className={styles.badge}>{badge}</span>}
        </button>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Nav({ activeTab, setTab }) {
    const [unassignedCount, setUnassignedCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch("/api/job-costs/unassigned/count", { headers: h() });
                if (res.ok) {
                    const data = await res.json();
                    setUnassignedCount(data.count);
                }
            } catch { /* silent — badge is non-critical */ }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30_000);
        return () => clearInterval(interval);
    }, []);

    return (
        <aside className={styles.sidebar}>
            <nav className={styles.nav}>
                <div className={styles.group}>
                    <span className={styles.groupLabel}>Workflow</span>
                    <Item id="pdf" label="PDF Namer" icon={<DocumentIcon />} activeTab={activeTab} setTab={setTab} />
                    <Item id="drive" label="Archive to Drive" icon={<CloudIcon />} activeTab={activeTab} setTab={setTab} />
                </div>

                <div className={styles.group}>
                    <span className={styles.groupLabel}>QB Entry</span>
                    <Item id="bills" label="Bills to Enter" icon={<ListIcon />} activeTab={activeTab} setTab={setTab} />
                    <Item id="qb" label="QB Checker" icon={<SearchIcon />} activeTab={activeTab} setTab={setTab} />
                    <Item id="organizer" label="Organizer" icon={<FolderIcon />} activeTab={activeTab} setTab={setTab} />
                </div>

                <div className={styles.group}>
                    <span className={styles.groupLabel}>Job Costing</span>
                    <Item id="jobs" label="Jobs" icon={<BriefcaseIcon />} activeTab={activeTab} setTab={setTab} />
                    <Item id="jobcosts" label="Job Costs" icon={<DollarIcon />} activeTab={activeTab} setTab={setTab} badge={unassignedCount} />
                </div>

                <div className={styles.bottom}>
                    <Item id="settings" label="Settings" icon={<GearIcon />} activeTab={activeTab} setTab={setTab} />
                </div>
            </nav>
        </aside>
    );
}
