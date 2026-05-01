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
  settleReceipt,
  rejectReceipt,
} = require("../controllers/commissionController");
const { validateRequest } = require("../middleware/validateRequest");
const { z } = require("zod");

const router = express.Router();

const reviewSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
    settleImmediately: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

router.use(auth);

router.get("/", requireRole(ROLES.ADMIN), listCommissions);
router.get("/mine", requireRole(ROLES.DRIVER), getMyCommissions);
router.get("/:id", requireRole(ROLES.ADMIN, ROLES.DRIVER), getCommission);

router.post("/:id/submit-receipt", requireRole(ROLES.DRIVER), handleReceiptUpload, uploadReceipt);
router.post("/:id/approve", requireRole(ROLES.ADMIN), validateRequest(reviewSchema), approveReceipt);
router.post("/:id/settle", requireRole(ROLES.ADMIN), validateRequest(reviewSchema), settleReceipt);
router.post("/:id/reject", requireRole(ROLES.ADMIN), validateRequest(reviewSchema), rejectReceipt);

module.exports = router;
