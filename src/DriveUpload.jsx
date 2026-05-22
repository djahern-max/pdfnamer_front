import { useState, useRef, useCallback } from "react";
import styles from "./DriveUpload.module.css";

const API = "/api/drive";
const API_KEY = process.env.REACT_APP_API_KEY;
const HEADERS = { "X-API-Key": API_KEY };

function DriveIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 87.3 78" fill="none">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
        </svg>
    );
}

function FolderIcon({ color }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                fill={color || "currentColor"} opacity="0.9" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function WarnIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SpinIcon() {
    return (
        <svg className={styles.spin} width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function LinkIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function extractVendorFromFilename(filename) {
    const base = filename.replace(/\.pdf$/i, "");
    const parts = base.split("_");
    if (parts.length < 3) return base;
    let amountIdx = -1;
    for (let i = parts.length - 1; i >= 1; i--) {
        if (/^\d+\.\d+$/.test(parts[i])) { amountIdx = i; break; }
    }
    const vendorParts = amountIdx > 1 ? parts.slice(1, amountIdx) : parts.slice(1, parts.length - 1);
    return vendorParts.join(" ");
}

function FileRow({ item }) {
    const rowClass = item.status === "done" ? styles.rowDone
        : item.status === "uploading" ? styles.rowUploading
            : item.status === "error" ? styles.rowError
                : item.folderMatch ? styles.rowReady
                    : styles.rowMissing;

    const folderColor = item.status === "done" ? "var(--green)"
        : item.status === "error" ? "var(--red)"
            : item.folderMatch ? "var(--accent)"
                : "var(--amber)";

    return (
        <div className={`${styles.fileRow} ${rowClass}`}>
            <div className={styles.fileIcon}><FolderIcon color={folderColor} /></div>
            <div className={styles.fileMeta}>
                <span className={styles.fileName}>{item.filename}</span>
                <span className={styles.fileVendor}>{item.vendor}</span>
            </div>
            <div className={styles.fileStatus}>
                {item.status === "uploading" && <span className={styles.statusPill} data-s="uploading"><SpinIcon /> Uploading</span>}
                {item.status === "done" && <a href={item.link} target="_blank" rel="noreferrer" className={styles.statusPill} data-s="done"><CheckIcon /> Uploaded <LinkIcon /></a>}
                {item.status === "error" && <span className={styles.statusPill} data-s="error" title={item.error}>Failed</span>}
                {!item.status && item.folderMatch && <span className={styles.statusPill} data-s="ready">Ready</span>}
                {!item.status && !item.folderMatch && <span className={styles.statusPill} data-s="missing"><WarnIcon /> No folder</span>}
            </div>
        </div>
    );
}

export default function DriveUpload() {
    const [phase, setPhase] = useState("idle");
    const [files, setFiles] = useState([]);
    const [missingVendors, setMissingVendors] = useState([]);
    const [pendingCreate, setPendingCreate] = useState([]);
    const [errorMsg, setErrorMsg] = useState("");
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
    const fileInputRef = useRef(null);

    const onFilesSelected = useCallback(async (rawFiles) => {
        const pdfs = Array.from(rawFiles).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
        if (!pdfs.length) { setErrorMsg("No PDF files found."); setPhase("error"); return; }
        setPhase("parsing");
        setErrorMsg("");
        try {
            const res = await fetch(`${API}/vendor-folders`, { headers: HEADERS });
            if (!res.ok) throw new Error(`Drive folder fetch failed (${res.status})`);
            const data = await res.json();
            const folders = data.folders ?? [];
            const parsed = pdfs.map((f) => {
                const vendor = extractVendorFromFilename(f.name);
                const folderMatch = folders.find(
                    (folder) => folder.name.toLowerCase().replace(/_/g, " ").trim() ===
                        vendor.toLowerCase().replace(/_/g, " ").trim()
                ) ?? null;
                return { filename: f.name, file: f, vendor, folderMatch, status: null, link: null, error: null };
            });
            setFiles(parsed);
            const missing = [...new Set(parsed.filter((p) => !p.folderMatch).map((p) => p.vendor))];
            setMissingVendors(missing);
            setPendingCreate(missing);
            setPhase(missing.length > 0 ? "confirm-missing" : "review");
        } catch (e) {
            setErrorMsg(e.message);
            setPhase("error");
        }
    }, []);

    const toggleVendorCreate = (vendor) => {
        setPendingCreate((prev) => prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]);
    };

    const proceedFromConfirm = async () => {
        setPhase("review");
        if (pendingCreate.length === 0) return;
        for (const vendor of pendingCreate) {
            try {
                await fetch(`${API}/create-vendor-folder`, {
                    method: "POST",
                    headers: { ...HEADERS, "Content-Type": "application/json" },
                    body: JSON.stringify({ vendor_name: vendor }),
                });
            } catch (e) { console.error(e); }
        }
    };

    const startUpload = async () => {
        const toUpload = files.filter((f) => !f.status);
        if (!toUpload.length) return;
        setPhase("uploading");
        setUploadProgress({ done: 0, total: toUpload.length });
        let done = 0;
        for (const item of toUpload) {
            setFiles((prev) => prev.map((f) => f.filename === item.filename ? { ...f, status: "uploading" } : f));
            try {
                const form = new FormData();
                form.append("file", item.file, item.filename);
                form.append("vendor_name", item.vendor);  // ← fixed
                const res = await fetch(`${API}/upload-file`, { method: "POST", headers: HEADERS, body: form });  // ← fixed URL
                if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail ?? "Upload failed"); }
                const result = await res.json();
                done++;
                setUploadProgress({ done, total: toUpload.length });
                setFiles((prev) => prev.map((f) => f.filename === item.filename ? { ...f, status: "done", link: result.link } : f));
            } catch (e) {
                done++;
                setUploadProgress({ done, total: toUpload.length });
                setFiles((prev) => prev.map((f) => f.filename === item.filename ? { ...f, status: "error", error: e.message } : f));
            }
        }
        setPhase("done");
    };

    const reset = () => {
        setPhase("idle"); setFiles([]); setMissingVendors([]);
        setPendingCreate([]); setErrorMsg(""); setUploadProgress({ done: 0, total: 0 });
    };

    const onDrop = (e) => { e.preventDefault(); if (e.dataTransfer.files.length) onFilesSelected(e.dataTransfer.files); };
    const onDragOver = (e) => e.preventDefault();

    const readyCount = files.filter((f) => !f.status).length;
    const doneCount = files.filter((f) => f.status === "done").length;
    const errorCount = files.filter((f) => f.status === "error").length;

    return (
        <div className={styles.root}>
            <header className={styles.header}>
                <DriveIcon />
                <div>
                    <h2 className={styles.title}>Archive to Drive</h2>
                    <p className={styles.subtitle}>Select invoices · they upload to their vendor subfolder automatically</p>
                </div>
            </header>

            {phase === "idle" && (
                <div className={styles.dropzone} onDrop={onDrop} onDragOver={onDragOver}
                    onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.PDF" multiple
                        className={styles.hiddenInput} onChange={(e) => onFilesSelected(e.target.files)} />
                    <UploadIcon />
                    <p className={styles.dropTitle}>Select <strong>PDF invoices</strong> to upload</p>
                    <p className={styles.dropHint}>Cmd+click to select multiple · or drag files here</p>
                </div>
            )}

            {phase === "parsing" && (
                <div className={styles.loading}><SpinIcon /><span>Reading Drive folders…</span></div>
            )}

            {phase === "confirm-missing" && (
                <div className={styles.card}>
                    <div className={styles.warnBanner}>
                        <WarnIcon />
                        <span><strong>{missingVendors.length} vendor folder{missingVendors.length !== 1 ? "s" : ""}</strong> don't exist in Drive yet. Choose which to create:</span>
                    </div>
                    <div className={styles.missingList}>
                        {missingVendors.map((v) => (
                            <label key={v} className={styles.missingItem}>
                                <input type="checkbox" checked={pendingCreate.includes(v)}
                                    onChange={() => toggleVendorCreate(v)} className={styles.checkbox} />
                                <FolderIcon color="var(--amber)" />
                                <span>{v}</span>
                            </label>
                        ))}
                    </div>
                    <div className={styles.confirmActions}>
                        <button className={styles.btnPrimary} onClick={proceedFromConfirm}>
                            {pendingCreate.length > 0 ? `Create ${pendingCreate.length} folder${pendingCreate.length !== 1 ? "s" : ""} & Continue` : "Skip & Continue"}
                        </button>
                        <button className={styles.btnGhost} onClick={reset}>Cancel</button>
                    </div>
                </div>
            )}

            {(phase === "review" || phase === "uploading" || phase === "done") && (
                <div className={styles.card}>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statNum}>{files.length}</span>
                            <span className={styles.statLabel}>Total PDFs</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statNum} style={{ color: "var(--green)" }}>{doneCount || readyCount}</span>
                            <span className={styles.statLabel}>{doneCount ? "Uploaded" : "Ready"}</span>
                        </div>
                        {errorCount > 0 && <>
                            <div className={styles.statDivider} />
                            <div className={styles.stat}>
                                <span className={styles.statNum} style={{ color: "var(--red)" }}>{errorCount}</span>
                                <span className={styles.statLabel}>Failed</span>
                            </div>
                        </>}
                    </div>

                    {phase === "uploading" && (
                        <div className={styles.progressWrap}>
                            <div className={styles.progressBar} style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }} />
                            <span className={styles.progressLabel}>{uploadProgress.done} / {uploadProgress.total}</span>
                        </div>
                    )}

                    {phase === "done" && (
                        <div className={styles.doneBanner}>
                            <CheckIcon />
                            <span>{doneCount} file{doneCount !== 1 ? "s" : ""} uploaded to Google Drive{errorCount > 0 && ` · ${errorCount} failed`}</span>
                        </div>
                    )}

                    <div className={styles.fileList}>
                        {files.map((f) => <FileRow key={f.filename} item={f} />)}
                    </div>

                    <div className={styles.actions}>
                        {phase === "review" && readyCount > 0 && (
                            <button className={styles.btnPrimary} onClick={startUpload}>
                                Upload {readyCount} file{readyCount !== 1 ? "s" : ""} to Drive
                            </button>
                        )}
                        <button className={styles.btnGhost} onClick={reset}>
                            {phase === "done" ? "Upload another batch" : "Start over"}
                        </button>
                    </div>
                </div>
            )}

            {phase === "error" && (
                <div className={styles.errorBox}>
                    <p>{errorMsg || "Something went wrong."}</p>
                    <button className={styles.btnGhost} onClick={reset}>Try again</button>
                </div>
            )}
        </div>
    );
}