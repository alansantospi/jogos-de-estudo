/* O PDF chega em base64 e vai para a leitura uma página por vez. */

import { PDFDocument } from "npm:pdf-lib@1.17.1";

const deBase64 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
function paraBase64(u: Uint8Array) {
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}

/* Um PDF de uma página para cada página do original. */
export async function dividirPdf(b64: string): Promise<string[]> {
  const doc = await PDFDocument.load(deBase64(b64));
  const partes: string[] = [];
  for (const k of doc.getPageIndices()) {
    const um = await PDFDocument.create();
    const [pg] = await um.copyPages(doc, [k]);
    um.addPage(pg);
    partes.push(paraBase64(await um.save()));
  }
  return partes;
}
