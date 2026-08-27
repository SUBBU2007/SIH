import mongoose, { Schema } from "mongoose";

// Mirrors the locked input/output contract from the rulebook doc.
const ProductSchema = new Schema(
  {
    barcode: { type: String, index: true },
    productId: String,
    productName: String,
    category: {
      type: String,
      enum: ["snacks", "beverages", "dairy", "instant_food", "cereals", "unknown"],
      default: "unknown",
    },
    source: {
      barcodeUsed: Boolean,
      ocrUsed: Boolean,
    },
    nutritionPer100: {
      sugar_g: Number,
      sodium_mg: Number,
      protein_g: Number,
      sat_fat_g: Number,
      energy_kcal: Number,
    },
    reconciliation: {
      hasBothSources: Boolean,
      barcodeValues: Schema.Types.Mixed,
      ocrValues: Schema.Types.Mixed,
    },
    scoreOutput: Schema.Types.Mixed, // full ruleEngine output JSON, stored as-is
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
