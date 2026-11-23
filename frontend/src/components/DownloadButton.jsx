import { useState } from 'react';
import { downloadDocument } from '../services/documentService.js';

export default function DownloadButton({ document }) {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleDownload() {
    setStatus('loading');
    setErrorMessage('');

    try {
      await downloadDocument(document.id, document.originalName);
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Baixando...' : 'Baixar'}
      </button>
      {status === 'error' && <p role="alert">{errorMessage}</p>}
    </div>
  );
}
