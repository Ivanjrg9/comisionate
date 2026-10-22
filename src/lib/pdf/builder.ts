import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const MARGIN = 50;
const PAGE: [number, number] = [595.28, 841.89]; // A4
const GREEN = rgb(0.086, 0.639, 0.29);

/** Constructor mínimo de PDFs A4: título, párrafos con salto de línea, filas etiqueta/valor y paginación. */
export class PdfBuilder {
  private page!: PDFPage;
  private y = 0;

  private constructor(private doc: PDFDocument, private font: PDFFont, private bold: PDFFont) {
    this.newPage();
  }

  static async create(title: string) {
    const doc = await PDFDocument.create();
    doc.setTitle(title);
    doc.setProducer("ComisionaTe");
    const builder = new PdfBuilder(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold));
    builder.brand();
    builder.heading(title);
    return builder;
  }

  private newPage() {
    this.page = this.doc.addPage(PAGE);
    this.y = PAGE[1] - MARGIN;
  }

  /** Helvetica solo cubre WinAnsi: normalizamos espacios raros y sustituimos lo que no se pueda dibujar. */
  private clean(text: string, font: PDFFont) {
    const supported = new Set(font.getCharacterSet());
    return [...text.replace(/[   ]/g, " ").replace(/[–—]/g, "-")]
      .map((c) => (supported.has(c.codePointAt(0)!) ? c : "?"))
      .join("");
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN) this.newPage();
  }

  private lines(text: string, font: PDFFont, size: number, maxWidth: number) {
    const out: string[] = [];
    for (const paragraph of this.clean(text, font).split("\n")) {
      let line = "";
      for (const word of paragraph.split(" ")) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
          out.push(line);
          line = word;
        } else line = test;
      }
      out.push(line);
    }
    return out;
  }

  private brand() {
    this.page.drawText("Comisiona", { x: MARGIN, y: this.y, size: 18, font: this.bold });
    const w = this.bold.widthOfTextAtSize("Comisiona", 18);
    this.page.drawRectangle({ x: MARGIN + w, y: this.y - 4, width: 22, height: 22, color: rgb(0.98, 0.8, 0.08) });
    this.page.drawText("Te", { x: MARGIN + w + 2, y: this.y, size: 18, font: this.bold });
    this.y -= 40;
  }

  heading(text: string) {
    this.ensure(30);
    this.page.drawText(this.clean(text, this.bold), { x: MARGIN, y: this.y, size: 16, font: this.bold, color: GREEN });
    this.y -= 26;
  }

  subheading(text: string) {
    this.ensure(40);
    this.y -= 8;
    this.page.drawText(this.clean(text, this.bold), { x: MARGIN, y: this.y, size: 12, font: this.bold });
    this.y -= 18;
  }

  paragraph(text: string, size = 10, muted = false) {
    for (const line of this.lines(text, this.font, size, PAGE[0] - 2 * MARGIN)) {
      this.ensure(size + 4);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color: muted ? rgb(0.35, 0.39, 0.45) : rgb(0, 0, 0) });
      this.y -= size + 4;
    }
    this.y -= 4;
  }

  row(label: string, value: string) {
    const labelWidth = 175;
    const valueLines = this.lines(value || "-", this.font, 10, PAGE[0] - 2 * MARGIN - labelWidth);
    this.ensure(valueLines.length * 14);
    this.page.drawText(this.clean(label, this.bold), { x: MARGIN, y: this.y, size: 10, font: this.bold });
    for (const line of valueLines) {
      this.page.drawText(line, { x: MARGIN + labelWidth, y: this.y, size: 10, font: this.font });
      this.y -= 14;
    }
  }

  spacer(height = 10) {
    this.y -= height;
  }

  async bytes() {
    return this.doc.save();
  }
}
