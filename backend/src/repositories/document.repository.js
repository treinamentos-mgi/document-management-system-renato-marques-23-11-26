const fs = require('node:fs');
const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

function ensureStorageDirectory() {
  fs.mkdirSync(storageDirectory, { recursive: true });
}

function create(document) {
  ensureStorageDirectory();
  documents.set(document.id, { ...document });
  return { ...document };
}

function list() {
  return Array.from(documents.values(), (document) => ({ ...document }));
}

function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

function getFilePath(storedName) {
  if (typeof storedName !== 'string' || path.basename(storedName) !== storedName) {
    return null;
  }

  return path.join(storageDirectory, storedName);
}

function fileExists(storedName) {
  const filePath = getFilePath(storedName);

  if (!filePath) {
    return false;
  }

  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

ensureStorageDirectory();

module.exports = {
  create,
  list,
  findById,
  getFilePath,
  fileExists,
  storageDirectory,
};
