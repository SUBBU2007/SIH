import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function GET() {
  await connectDB();
  const products = await Product.find({}, {
    productName: 1, category: 1, nutritionPer100: 1, scoreOutput: 1, barcode: 1,
  }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(products);
}