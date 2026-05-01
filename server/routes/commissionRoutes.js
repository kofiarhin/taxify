const express = require("express");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { handleReceiptUpload } = require("../middleware/upload");
const {
  listCommissions,
  getMyCommissions,
  getCommission,
  uploadReceipt,
  approveReceipt,
  rejectReceipt,
} = require("../controllers/commissionController");

const router = express.Router();

router.use(auth);

router.get("/", requireRole(ROLES.ADMIN), listCommissions);
router.get("/mine", requireRole(ROLES.DRIVER), getMyCommissions);
router.get("/:id", requireRole(ROLES.ADMIN, ROLES.DRIVER), getCommission);

router.post("/:id/submit-receipt", requireRole(ROLES.DRIVER), handleReceiptUpload, uploadReceipt);
router.post("/:id/approve", requireRole(ROLES.ADMIN), approveReceipt);
router.post("/:id/reject", requireRole(ROLES.ADMIN), rejectReceipt);

module.exports = router;
