const service = require('../services/document.service');

function createDocument(req, res, next) {
  try {
    const document = service.createDocument(req.file, req.body?.owner);
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

function listDocuments(req, res, next) {
  try {
    res.status(200).json(service.listDocuments());
  } catch (error) {
    next(error);
  }
}

function downloadDocument(req, res, next) {
  try {
    const { document, filePath } = service.getDocumentForDownload(req.params.id);

    res.download(filePath, document.originalName, (error) => {
      if (error) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDocument,
  listDocuments,
  downloadDocument,
};
