const multer = require("multer");
const path = require("path");
const { ApiError } = require("../utils/apiError");

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(__dirname, "../uploads/receipts"));
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only JPG, PNG, and PDF files are allowed"));
  }
}

const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("receipt");

function handleReceiptUpload(req, res, next) {
  uploadReceipt(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new ApiError(400, err.message));
    }
    if (err) {
      return next(err);
    }
    next();
  });
}

module.exports = { handleReceiptUpload };
