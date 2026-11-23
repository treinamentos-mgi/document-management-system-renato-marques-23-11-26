const API_PREFIX = '/api';

async function parseError(response) {
  try {
    const payload = await response.json();
    return payload.error?.message || 'Erro na comunicação com o servidor';
  } catch {
    return 'Erro na comunicação com o servidor';
  }
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  if (owner.trim()) {
    formData.append('owner', owner.trim());
  }

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function listDocuments() {
  const response = await fetch(`${API_PREFIX}/documents`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function downloadDocument(id, originalName) {
  const response = await fetch(`${API_PREFIX}/documents/${encodeURIComponent(id)}/download`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = downloadUrl;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}
