import { useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import './App.css';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUploaded() {
    setRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Gestão documental</p>
        <h1>Document Management System</h1>
      </header>

      <UploadComponent onUploaded={handleUploaded} />

      <section>
        <h2>Documentos</h2>
        <DocumentList refreshKey={refreshKey} />
      </section>
    </main>
  );
}
