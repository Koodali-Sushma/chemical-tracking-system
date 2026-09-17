import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IChemicalOrderRequest extends Document {
  chemicalFormula: string;
  chemicalName: string;
  providerId: mongoose.Types.ObjectId;
  providerName: string;
  requestedBy: string;
  requestedAmount: number;
  status: "pending" | "approved" | "rejected" | "received";
  createdAt: Date;
  reviewedAt?: Date;
  emailStatus: "pending" | "sent" | "failed";
  emailSentAt?: Date;
  emailError?: string;
  receivedBy?: string;
  receivedAt?: Date;
}

const ChemicalOrderRequestSchema = new Schema<IChemicalOrderRequest>(
  {
    chemicalFormula: { type: String, required: true, trim: true },
    chemicalName: { type: String, required: true, trim: true },
    providerId: { type: Schema.Types.ObjectId, required: true },
    providerName: { type: String, required: true },
    requestedBy: { type: String, required: true },
    requestedAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "received"],
      default: "pending",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      required: true,
    },
    emailSentAt: { type: Date },
    emailError: { type: String },
    receivedBy: {
      type: String,
      trim: true,
      lowercase: true,
    },
    receivedAt: {
      type: Date,
    },
  },
  {
    collection: "chemical_order_requests",
  },
);

ChemicalOrderRequestSchema.index(
  { chemicalFormula: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
);

export default models.ChemicalOrderRequest ||
  model<IChemicalOrderRequest>(
    "ChemicalOrderRequest",
    ChemicalOrderRequestSchema,
  );
