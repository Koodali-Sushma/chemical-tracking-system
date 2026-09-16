import { Schema, model, models, Document } from "mongoose";

export interface IChemicalProvider extends Document {
  name: string;
  email: string;
  phone?: string;
  chemicalFormulas: string[];
  active: boolean;
}

const ChemicalProviderSchema = new Schema<IChemicalProvider>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    chemicalFormulas: { type: [String], default: [] },
    active: { type: Boolean, default: true, required: true },
  },
  {
    collection: "chemical_provider",
  },
);

export default models.ChemicalProvider ||
  model<IChemicalProvider>("ChemicalProvider", ChemicalProviderSchema);
