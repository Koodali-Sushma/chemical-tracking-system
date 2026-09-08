import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChemical extends Document {
  name: string;
  formula: string;
  mainStock: number;
  nodeStock: number;
  unit: string;
  state: "solid" | "liquid" | "gas";
  description: string;
}

const ChemicalSchema = new Schema<IChemical>({
  name: { type: String, required: true },
  formula: { type: String, required: true, unique: true },
  mainStock: { type: Number, required: true, default: 20 },
  nodeStock: { type: Number, required: true, default: 5, max: 5 },
  unit: { type: String, required: true },
  state: {
    type: String,
    required: true,
    enum: ["solid", "liquid", "gas"],
  },
  description: { type: String },
});

const Chemical: Model<IChemical> =
  mongoose.models.Chemical ||
  mongoose.model<IChemical>("Chemical", ChemicalSchema);

export default Chemical;
