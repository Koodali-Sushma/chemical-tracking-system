import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChemical extends Document {
  name: string;
  formula: string;
  stockQuantity: number;
  unit: string;
  description: string;
}

const ChemicalSchema = new Schema<IChemical>({
  name: { type: String, required: true },
  formula: { type: String, required: true },
  stockQuantity: { type: Number, required: true },
  unit: { type: String, required: true },
  description: { type: String },
});

const Chemical: Model<IChemical> =
  mongoose.models.Chemical ||
  mongoose.model<IChemical>("Chemical", ChemicalSchema);

export default Chemical;
