import { useState } from 'react';
import Header from './Header';
import PdfNamer from './PdfNamer';
import QbChecker from './QbChecker';
import Organizer from './Organizer';
import BillsReport from './BillsReport';

function App() {
  const [tab, setTab] = useState('pdf');

  const tabs = [
    { id: 'pdf', label: 'PDF Namer' },
    { id: 'qb', label: 'QB Checker' },
    { id: 'organizer', label: 'Organizer' },
    { id: 'bills', label: 'Bills to Enter' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <Header />

      <div style={{ padding: '32px 20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto 24px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: tab === t.id ? '#2563eb' : '#e2e5eb',
                color: tab === t.id ? '#fff' : '#4a5060',
                fontWeight: 600, fontSize: '0.88rem'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'pdf' && <PdfNamer />}
        {tab === 'qb' && <QbChecker />}
        {tab === 'organizer' && <Organizer />}
        {tab === 'bills' && <BillsReport />}
      </div>
    </div>
  );
}

export default App;