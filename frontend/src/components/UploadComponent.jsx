import { useState } from 'react';
import { uploadDocument } from '../services/documentService.js';

export default function UploadComponent({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setStatus('error');
      setMessage('Selecione um arquivo antes de enviar.');
      return;
    }

    setStatus('loading');
    setMessage('Enviando documento...');

    try {
      await uploadDocument(file, owner);
      setStatus('success');
      setMessage('Documento enviado com sucesso.');
      setFile(null);
      setOwner('');
      event.target.reset();
      onUploaded?.();
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  return (
    <section>
      <h2>Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="document-file">Arquivo</label>
          <input
            id="document-file"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label htmlFor="document-owner">Dono (opcional)</label>
          <input
            id="document-owner"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="anonymous"
          />
        </div>

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {message && <p role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
    </section>
  );
}
