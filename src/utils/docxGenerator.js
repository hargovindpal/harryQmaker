// src/utils/docxGenerator.js
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  TableLayoutType,
  VerticalAlign,
} from "docx";

/* Helper: accept dataURL or base64 and return Uint8Array */
const base64ToUint8Array = (base64OrDataUrl = "") => {
  if (!base64OrDataUrl) return null;
  const hasComma = base64OrDataUrl.indexOf(",") !== -1;
  const b64 = hasComma ? base64OrDataUrl.split(",")[1] : base64OrDataUrl;
  try {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (e) {
    console.error("Invalid base64 image data", e);
    return null;
  }
};

const borderNone = {
  top: { size: 0, color: "FFFFFF" },
  bottom: { size: 0, color: "FFFFFF" },
  left: { size: 0, color: "FFFFFF" },
  right: { size: 0, color: "FFFFFF" },
  insideHorizontal: { size: 0, color: "FFFFFF" },
  insideVertical: { size: 0, color: "FFFFFF" },
};

/**
 * generateDocx(paper)
 * paper: { header: {...}, sections: [ { title, questions: [...] } ] }
 * returns Blob
 */
export const generateDocx = async (paper = {}) => {
  const children = [];
  const header = paper.header || {};
  const sections = Array.isArray(paper.sections) ? paper.sections : [];

  // ===== HEADER =====
  const headerRow = [];
  if (header.logo) {
    const logoBytes = base64ToUint8Array(header.logo);
    if (logoBytes) {
      headerRow.push(
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          borders: borderNone,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new ImageRun({ data: logoBytes, transformation: { width: 110, height: 110 } })],
            }),
          ],
        })
      );
    } else {
      headerRow.push(new TableCell({ borders: borderNone, children: [new Paragraph("")] }));
    }
  }

  headerRow.push(
    new TableCell({
      width: { size: header.logo ? 80 : 100, type: WidthType.PERCENTAGE },
      borders: borderNone,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: header.school || "SCHOOL NAME", bold: true, size: 44, font: "Times New Roman" })],
          spacing: { after: 100 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: header.exam || "EXAMINATION", bold: true, underline: {}, size: 34, font: "Times New Roman" })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `CLASS: ${header.class || ""}    SUB: ${header.subject || ""}    TIME: ${header.time || ""}    M.M.: ${header.marks || ""}`,
              bold: true,
              size: 28,
              font: "Times New Roman",
            }),
          ],
        }),
      ],
    })
  );

  children.push(
    new Table({
      rows: [new TableRow({ children: headerRow })],
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: borderNone,
    })
  );

  // divider
  children.push(new Paragraph({ border: { bottom: { color: "000000", size: 12, space: 1 } }, spacing: { after: 200 } }));

  // ===== BODY =====
  sections.forEach((section = {}, sIndex) => {
    const secTitle = section.title || `Section ${sIndex + 1}`;
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 100 },
        children: [new TextRun({ text: secTitle.toUpperCase(), bold: true, size: 28, font: "Times New Roman" })],
      })
    );

    const questions = Array.isArray(section.questions) ? section.questions : [];

    questions.forEach((q = {}, qIndex) => {
      const questionText = q.text || "";
      const marksText = q.marks ? `[${q.marks} Marks]` : "";
      const type = (q.type || "normal").toString().toLowerCase();

      // ------- Instruction on TOP (if applicable) -------
      // For types that benefit from explicit instruction, print it before the Q row.
      const instructionTypes = ["truefalse", "fill", "matching", "objective", "comprehension"];
      if (instructionTypes.includes(type)) {
        // choose custom instruction if provided or sensible default
        let instr = q.instruction && q.instruction.trim() ? q.instruction.trim() : "";

        if (!instr) {
          if (type === "truefalse") instr = "State whether the following is True or False:";
          else if (type === "fill") instr = "Fill in the blank:";
          else if (type === "matching") instr = questionText ? "" : "Match the following:";
          else if (type === "objective") instr = ""; // objective often doesn't need an extra instruction, allow custom only
          else if (type === "comprehension") instr = q.passage ? "" : "Read the passage and answer the following:";
        }

        if (instr) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: instr, italics: true, size: 22, font: "Times New Roman" })],
              spacing: { after: 60 },
            })
          );
        }
      }

      // ------- Main question row (Qx. text on left, marks on right) -------
      const questionRow = new TableRow({
        children: [
          new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: `Q${qIndex + 1}. ${questionText}`, size: 26, font: "Times New Roman" })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: marksText, size: 26, font: "Times New Roman" })],
              }),
            ],
          }),
        ],
      });

      children.push(
        new Table({
          rows: [questionRow],
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          borders: borderNone,
        })
      );

      // ------- Render type-specific content BELOW the Q row -------
      if (type === "truefalse") {
        // options
        children.push(new Paragraph({ children: [new TextRun({ text: "(a) True", size: 22, font: "Times New Roman" })] }));
        children.push(new Paragraph({ children: [new TextRun({ text: "(b) False", size: 22, font: "Times New Roman" })] }));
        children.push(new Paragraph({ text: "", spacing: { after: 150 } }));
      } else if (type === "fill") {
        if (questionText) {
          // show blank after the question row
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `______  ${questionText}  ______`, size: 22, font: "Times New Roman" })],
              spacing: { after: 100 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "______", size: 22, font: "Times New Roman" })],
              spacing: { after: 100 },
            })
          );
        }
      } else if (type === "matching") {
        const left = Array.isArray(q.columnA) ? q.columnA : [];
        const right = Array.isArray(q.columnB) ? q.columnB : [];
        const maxLen = Math.max(left.length, right.length);
        const matchRows = [];
        for (let i = 0; i < maxLen; i++) {
          matchRows.push(
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [new Paragraph({ children: [new TextRun({ text: left[i] ? `${i + 1}. ${left[i]}` : "", size: 22, font: "Times New Roman" })] })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [new Paragraph({ children: [new TextRun({ text: right[i] ? `${String.fromCharCode(65 + i)}. ${right[i]}` : "", size: 22, font: "Times New Roman" })] })],
                }),
              ],
            })
          );
        }
        if (matchRows.length > 0) {
          children.push(new Table({ rows: matchRows, width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: borderNone }));
        }
      } else if (type === "objective") {
        const options = Array.isArray(q.options) ? q.options : [];
        const optionRows = [];
        for (let i = 0; i < options.length; i += 2) {
          optionRows.push(
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [new Paragraph({ children: [new TextRun({ text: `(${String.fromCharCode(65 + i)}) ${options[i] || ""}`, size: 22, font: "Times New Roman" })] })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [new Paragraph({ children: [new TextRun({ text: options[i + 1] ? `(${String.fromCharCode(65 + i + 1)}) ${options[i + 1]}` : "", size: 22, font: "Times New Roman" })] })],
                }),
              ],
            })
          );
        }
        if (optionRows.length > 0) {
          children.push(new Table({ rows: optionRows, width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: borderNone }));
        }
      } else if (type === "image") {
        if (q.image) {
          const imgBytes = base64ToUint8Array(q.image);
          if (imgBytes) {
            children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imgBytes, transformation: { width: 250, height: 180 } })], spacing: { after: 200 } }));
          }
        }
      } else if (type === "comprehension") {
        if (q.passage) {
          children.push(new Paragraph({ children: [new TextRun({ text: q.passage, size: 24, font: "Times New Roman" })], spacing: { after: 100 } }));
        }
        if (q.image) {
          const imgBytes = base64ToUint8Array(q.image);
          if (imgBytes) {
            children.push(new Paragraph({ children: [new ImageRun({ data: imgBytes, transformation: { width: 200, height: 150 } })], spacing: { after: 100 } }));
          }
        }
        const subQuestions = Array.isArray(q.subQuestions) ? q.subQuestions : [];
        subQuestions.forEach((subQ = {}, subIndex) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `Q${qIndex + 1}.${subIndex + 1}. ${subQ.text || ""} [${subQ.marks || ""} Marks]`, size: 22, font: "Times New Roman" })],
              spacing: { after: 80 },
            })
          );
        });
      } else {
        // normal or unknown types: small gap
        children.push(new Paragraph({ text: "", spacing: { after: 150 } }));
      }

      // spacer after each question block
      children.push(new Paragraph({ text: "", spacing: { after: 150 } }));
    });
  });

  // Build and return blob
  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 400, right: 400 } } },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
};
