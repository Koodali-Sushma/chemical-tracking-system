import mongoose, { Schema, Document } from "mongoose";

export interface IScientistAccess extends Document {
  scientistEmail: string;
  chemicalFormulas: string[]; // e.g., ["H2O", "NaCl", "HCl"]
}

const ScientistAccessSchema = new Schema<IScientistAccess>({
  scientistEmail: { type: String, required: true, unique: true },
  chemicalFormulas: { type: [String], required: true, default: [] },
});

export default mongoose.models.ScientistAccess ||
  mongoose.model<IScientistAccess>(
    "ScientistAccess",
    ScientistAccessSchema,
    "scientistaccess",
  );
