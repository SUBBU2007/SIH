# LabelSense

Scan a barcode or a food label. Get a transparent, explainable nutrition score — not a mystery grade.

## Stack
- Next.js 15 (App Router) + Tailwind CSS v4 + Framer Motion — plain JavaScript, no TypeScript
- MongoDB Atlas via Mongoose
- Open Food Facts API for barcode lookup
- Tesseract.js for OCR (runs client-side, avoids serverless timeouts)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local`, fill in `MONGODB_URI` from your MongoDB Atlas cluster
3. `npm run dev`

## Structure
- `app/api/barcode/[code]` — Open Food Facts lookup
- `app/api/score` — rule engine (scoring, grading, mismatch detection)
- `lib/ruleEngine.js` — swap placeholder thresholds for `rules_contract_v1.json` once the Rulebook team freezes v1
- `lib/models/Product.js` — Mongoose schema matching the locked input/output contract
- `components/ScanInput.jsx` — barcode input wired up; OCR upload path is a TODO stub

## Not done yet (by design — these are next steps, not bugs)
- OCR upload UI + Tesseract.js wiring in `ScanInput.jsx`
- Real scoring thresholds from the Rulebook team's ground-truth validation
- Comparison view (rank N products by chosen priority, same-category only)
- AI explanation layer (single LLM call turning the score JSON into plain language)
