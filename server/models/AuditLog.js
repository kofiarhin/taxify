const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ actorUserId: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
