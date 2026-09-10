import mongoose, { Schema, Document } from "mongoose";

export interface IRefillLog extends Document {
  chemicalFormula: string;
  technicianEmail: string;
  amountRefilled: number;
  timestamp: Date;
}

const RefillLogSchema = new Schema<IRefillLog>({
  chemicalFormula: { type: String, required: true },
  technicianEmail: { type: String, required: true },
  amountRefilled: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.RefillLog ||
  mongoose.model<IRefillLog>("RefillLog", RefillLogSchema, "refilllogs");
