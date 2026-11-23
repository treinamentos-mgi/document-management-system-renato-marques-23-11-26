const { randomUUID } = require('node:crypto');
const repository = require('../repositories/document.repository');

function createError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    mimeType: document.mimeType,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocument(file, owner) {
  if (!file) {
    throw createError(400, 'FILE_REQUIRED', 'Nenhum arquivo foi enviado');
  }

  const normalizedOwner = typeof owner === 'string' && owner.trim()
    ? owner.trim()
    : 'anonymous';

  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    owner: normalizedOwner,
  };

  repository.create(document);
  return toPublicDocument(document);
}

function listDocuments() {
  return repository.list().map(toPublicDocument);
}

function getDocumentForDownload(id) {
  const document = repository.findById(id);

  if (!document || !repository.fileExists(document.storedName)) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
  }

  return {
    document,
    filePath: repository.getFilePath(document.storedName),
  };
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};
