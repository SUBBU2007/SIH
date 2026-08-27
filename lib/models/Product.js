import mongoose, {
  Schema,
} from "mongoose";

// ---------------------------------------------------------
// LabelSense Product Schema
// ---------------------------------------------------------

const ProductSchema = new Schema(
  {
    productId: {
      type: String,
    },

    productName: {
      type: String,
    },

    category: {
      type: String,

      enum: [
        "solid",
        "beverage",
        "snacks",
        "dairy",
        "instant_food",
        "cereals",
        "unknown",
      ],

      default: "unknown",
    },

    // -------------------------------------------------------
    // DATA SOURCES
    // -------------------------------------------------------

    source: {
      barcodeUsed: {
        type: Boolean,
        default: false,
      },

      ocrUsed: {
        type: Boolean,
        default: false,
      },
    },

    // -------------------------------------------------------
    // NUTRITION
    //
    // Solid foods:
    // values are per 100 g
    //
    // Beverages:
    // values are per 100 ml
    // -------------------------------------------------------

    nutritionPer100: {
      sugar_g: {
        type: Number,
      },

      sodium_mg: {
        type: Number,
      },

      protein_g: {
        type: Number,
      },

      sat_fat_g: {
        type: Number,
      },

      energy_kcal: {
        type: Number,
      },

      fiber_g: {
        type: Number,
      },
    },

    // -------------------------------------------------------
    // BARCODE / OCR RECONCILIATION
    // -------------------------------------------------------

    reconciliation: {
      hasBothSources: {
        type: Boolean,
        default: false,
      },

      barcodeValues:
        Schema.Types.Mixed,

      ocrValues:
        Schema.Types.Mixed,
    },

    // -------------------------------------------------------
    // SCORE OUTPUT
    //
    // Stores the complete deterministic
    // ruleEngine result.
    // -------------------------------------------------------

    scoreOutput:
      Schema.Types.Mixed,
  },

  {
    timestamps: true,
  }
);

export default mongoose.models.Product ||
  mongoose.model(
    "Product",
    ProductSchema
  );