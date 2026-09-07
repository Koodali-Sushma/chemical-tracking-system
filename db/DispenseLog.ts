import mongoose, { Schema, Document } from "mongoose";

export interface IDispenseLog extends Document {
  chemicalFormula: string;
  scientistEmail: string;
  amountDrawn: number;
  timestamp: Date;
}

const DispenseLogSchema = new Schema<IDispenseLog>({
  chemicalFormula: { type: String, required: true },
  scientistEmail: { type: String, required: true },
  amountDrawn: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.DispenseLog ||
  mongoose.model<IDispenseLog>("DispenseLog", DispenseLogSchema);
