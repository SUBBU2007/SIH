import { createWorker, PSM } from "tesseract.js";

export async function recognizeLabel(file) {
  const worker = await createWorker("eng");

  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    preserve_interword_spaces: "1",
  });

  const { data } = await worker.recognize(file);

  await worker.terminate();

  return data;
}