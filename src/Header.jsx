import { useEffect, useState } from 'react';
import styles from './Header.module.css';

const API_KEY = process.env.REACT_APP_API_KEY;

export default function Header() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetch_stats = async () => {
            try {
                const res = await fetch('/api/usage-stats', {
                    headers: { 'X-API-Key': API_KEY },
                });
                if (res.ok) setStats(await res.json());
            } catch (e) {
                console.error('Usage stats fetch failed', e);
            }
        };

        fetch_stats();
        const interval = setInterval(fetch_stats, 30_000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
                RYZE Operations
            </div>

            <div className={styles.right}>
                {stats ? (
                    <div className={styles.pill}>
                        <span className={styles.pillLabel}>Claude Cost</span>
                        <span className={styles.pillValue}>
                            ${stats.estimated_cost_usd.toFixed(4)}
                        </span>
                        <span className={styles.pillDivider} />
                        <span className={styles.pillSub}>
                            {stats.total_pdfs_analyzed} PDFs
                        </span>
                        <span className={styles.pillDivider} />
                        <span className={styles.pillSub}>
                            {(stats.total_input_tokens + stats.total_output_tokens).toLocaleString()} tokens
                        </span>
                    </div>
                ) : (
                    <div className={styles.pillLoading}>Loading usage…</div>
                )}
            </div>
        </header>
    );
}