import { useState } from 'react';
import Header from './Header';
import Nav from './Nav';
import PdfNamer from './PdfNamer';
import QbChecker from './QbChecker';
import Organizer from './Organizer';
import BillsReport from './BillsReport';
import DriveUpload from './DriveUpload';
import Jobs from './Jobs';
import JobCosts from './JobCosts';
import Settings from './Settings';

function App() {
  const [tab, setTab] = useState('pdf');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f4f5f7' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start' }}>
        <Nav activeTab={tab} setTab={setTab} />
        <main style={{ flex: 1, minWidth: 0, padding: '28px 24px' }}>
          {tab === 'pdf'      && <PdfNamer />}
          {tab === 'qb'       && <QbChecker />}
          {tab === 'organizer'&& <Organizer />}
          {tab === 'bills'    && <BillsReport />}
          {tab === 'jobs'     && <Jobs />}
          {tab === 'jobcosts' && <JobCosts />}
          {tab === 'drive'    && <DriveUpload />}
          {tab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default App;
