const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const controller = require('../controllers/document.controller');
const repository = require('../repositories/document.repository');

const router = express.Router();

function getFileSizeLimit() {
  const configuredLimit = Number.parseInt(process.env.MAX_FILE_SIZE_BYTES, 10);

  if (Number.isInteger(configuredLimit) && configuredLimit > 0) {
    return configuredLimit;
  }

  return 10 * 1024 * 1024;
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, repository.storageDirectory);
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname);
    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: getFileSizeLimit(),
  },
});

router.post('/upload', upload.single('file'), controller.createDocument);
router.get('/documents', controller.listDocuments);
router.get('/documents/:id/download', controller.downloadDocument);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo excede o tamanho máximo permitido',
        },
      });
    }

    return res.status(400).json({
      error: {
        code: 'UPLOAD_INVALID',
        message: 'Requisição de upload inválida',
      },
    });
  }

  const status = error.status || 500;
  const code = error.code || 'INTERNAL_ERROR';

  return res.status(status).json({
    error: {
      code,
      message: status === 500 ? 'Erro interno do servidor' : error.message,
    },
  });
});

module.exports = router;
