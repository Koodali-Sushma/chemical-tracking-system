import mongoose, { Schema, Document } from "mongoose";

export interface IAccessRequest extends Document {
  userEmail: string;
  formula: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const AccessRequestSchema = new Schema<IAccessRequest>({
  userEmail: { type: String, required: true, index: true },
  formula: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

// Compound index to ensure a user can't request the same chemical formula multiple times concurrently
AccessRequestSchema.index({ userEmail: 1, formula: 1 }, { unique: true });

export default mongoose.models.AccessRequest ||
  mongoose.model<IAccessRequest>(
    "AccessRequest",
    AccessRequestSchema,
    "accessrequests",
  );
