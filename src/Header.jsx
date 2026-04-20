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
                <span className={styles.logoIcon}>📄</span>
                PDF Auto-Namer
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