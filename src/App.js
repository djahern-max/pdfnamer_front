import { useState } from 'react';
import PdfNamer from './PdfNamer';
import QbChecker from './QbChecker';

function App() {
  const [tab, setTab] = useState('pdf');

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', padding: '40px 20px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto 24px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => setTab('pdf')}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === 'pdf' ? '#2563eb' : '#e2e5eb',
            color: tab === 'pdf' ? '#fff' : '#4a5060',
            fontWeight: 600, fontSize: '0.88rem'
          }}
        >
          PDF Namer
        </button>
        <button
          onClick={() => setTab('qb')}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === 'qb' ? '#2563eb' : '#e2e5eb',
            color: tab === 'qb' ? '#fff' : '#4a5060',
            fontWeight: 600, fontSize: '0.88rem'
          }}
        >
          QB Checker
        </button>
      </div>

      {tab === 'pdf' ? <PdfNamer /> : <QbChecker />}
    </div>
  );
}

export default App;