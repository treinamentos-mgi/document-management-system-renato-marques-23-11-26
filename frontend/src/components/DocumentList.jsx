import { useCallback, useEffect, useState } from 'react';
import { listDocuments } from '../services/documentService.js';
import DownloadButton from './DownloadButton.jsx';

export default function DocumentList({ refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadDocuments = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const loadedDocuments = await listDocuments();
      setDocuments(loadedDocuments);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshKey]);

  if (status === 'loading') {
    return <p role="status">Carregando documentos...</p>;
  }

  if (status === 'error') {
    return <p role="alert">{errorMessage}</p>;
  }

  if (documents.length === 0) {
    return <p>Nenhum documento enviado.</p>;
  }

  return (
    <ul>
      {documents.map((document) => (
        <li key={document.id}>
          <div>
            <strong>{document.originalName}</strong>
            <span>
              {document.owner} · {document.size} bytes
            </span>
          </div>
          <DownloadButton document={document} />
        </li>
      ))}
    </ul>
  );
}
