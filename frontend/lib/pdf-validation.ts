const PDF_SIZE_LIMIT = 4 * 1024 * 1024;

export const pdfValidationMessages = {
  invalid: "Choose a valid PDF file. / اختر ملف PDF صالحاً.",
  tooLarge: "The PDF must be 4 MB or smaller. / يجب ألا يتجاوز حجم ملف PDF أربعة ميغابايت.",
  tooManyPages: "For this prototype, PDF documents are limited to 5 pages. / في النسخة التجريبية، يقتصر ملف PDF على 5 صفحات كحد أقصى.",
} as const;

function decodeLatin1(buffer: ArrayBuffer): string {
  return new TextDecoder("iso-8859-1").decode(buffer);
}

async function hasPdfSignature(file: File): Promise<boolean> {
  const header = decodeLatin1(await file.slice(0, 1024).arrayBuffer());
  return header.includes("%PDF-");
}

async function countUncompressedPdfPages(file: File): Promise<number | null> {
  const source = decodeLatin1(await file.arrayBuffer());
  const objects = source.match(/\b\d+\s+\d+\s+obj\b[\s\S]*?\bendobj\b/g) ?? [];
  const pageObjects = objects.filter((object) => /\/Type\s*\/Page\b/.test(object));
  return pageObjects.length > 0 ? pageObjects.length : null;
}

export async function validatePdfFile(file: File): Promise<string | null> {
  const hasPdfName = file.name.toLowerCase().endsWith(".pdf");
  const hasPdfType = !file.type || file.type === "application/pdf";
  if (!hasPdfName || !hasPdfType) return pdfValidationMessages.invalid;
  if (file.size > PDF_SIZE_LIMIT) return pdfValidationMessages.tooLarge;

  try {
    if (!(await hasPdfSignature(file))) return pdfValidationMessages.invalid;
    const pageCount = await countUncompressedPdfPages(file);
    if (pageCount !== null && pageCount > 5) return pdfValidationMessages.tooManyPages;
  } catch {
    return pdfValidationMessages.invalid;
  }

  return null;
}
