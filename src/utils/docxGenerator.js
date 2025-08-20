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
} from "docx";
import { saveAs } from "file-saver";

// 🔹 Helper: Convert Base64 to Uint8Array
const base64ToUint8Array = (base64) => {
  const binary = atob(base64.split(",")[1]);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// ✅ Reusable borderless style
const borderNone = {
  top: { size: 0, color: "FFFFFF" },
  bottom: { size: 0, color: "FFFFFF" },
  left: { size: 0, color: "FFFFFF" },
  right: { size: 0, color: "FFFFFF" },
  insideHorizontal: { size: 0, color: "FFFFFF" },
  insideVertical: { size: 0, color: "FFFFFF" },
};

export const generateDocx = async (paper) => {
  const children = [];

  // ===== HEADER (Logo + School Info) =====
  const headerRow = [];

  // Left Cell → Logo
  if (paper.header.logo) {
    try {
      const byteArray = base64ToUint8Array(paper.header.logo);
      headerRow.push(
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          verticalAlign: "center",
          borders: borderNone,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: byteArray,
                  transformation: { width: 110, height: 110 },
                }),
              ],
            }),
          ],
        })
      );
    } catch {
      headerRow.push(
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          verticalAlign: "center",
          borders: borderNone,
          children: [new Paragraph("")],
        })
      );
    }
  }

  // Right Cell → School Info
  headerRow.push(
    new TableCell({
      width: { size: 80, type: WidthType.PERCENTAGE },
      verticalAlign: "center",
      borders: borderNone,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: paper.header.school || "SCHOOL NAME",
              bold: true,
              size: 44,
              font: "Times New Roman",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: paper.header.exam || "EXAMINATION",
              bold: true,
              underline: {},
              size: 34,
              font: "Times New Roman",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `CLASS: ${paper.header.class || ""}    SUB: ${
                paper.header.subject || ""
              }    TIME: ${paper.header.time || ""}    M.M.: ${
                paper.header.marks || ""
              }`,
              bold: true,
              font: "Times New Roman",
              size: 28,
            }),
          ],
        }),
      ],
    })
  );

  // Add Header Table (borderless)
  children.push(
    new Table({
      rows: [new TableRow({ children: headerRow, borders: borderNone })],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderNone,
    })
  );

  // HR line
  children.push(
    new Paragraph({
      border: { bottom: { color: "000000", size: 12, space: 1 } },
      spacing: { after: 200 },
    })
  );

  // ===== BODY (Sections + Questions) =====
  paper.sections.forEach((section, sIndex) => {
    const sectionTitle = (section.title || `Section ${sIndex + 1}`).toUpperCase();

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 200 },
        children: [
          new TextRun({
            text: sectionTitle,
            bold: true,
            size: 28,
            font: "Times New Roman",
            color: "000000",
          }),
        ],
      })
    );

    section.questions.forEach((q, qIndex) => {
      // Question row (left: text, right: marks)
      const questionRow = new TableRow({
        borders: borderNone,
        children: [
          new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: `Q${qIndex + 1}. ${q.text}`,
                    font: "Times New Roman",
                    size: 26,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `[${q.marks} Marks]`,
                    font: "Times New Roman",
                    size: 26,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      children.push(
        new Table({
          rows: [questionRow],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderNone,
        })
      );

      // Objective Options (borderless, fixed 60% width, centered)
      if (q.type === "objective") {
        const optionRows = [];
        for (let i = 0; i < q.options.length; i += 2) {
          optionRows.push(
            new TableRow({
              borders: borderNone,
              children: [
                new TableCell({
                  width: { size: 3572, type: WidthType.DXA }, // 50% of 7144
                  borders: borderNone,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `(${String.fromCharCode(65 + i)}) ${q.options[i] || ""}`,
                          size: 22,
                          font: "Times New Roman",
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 3572, type: WidthType.DXA }, // 50% of 7144
                  borders: borderNone,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text:
                            q.options[i + 1] !== undefined
                              ? `(${String.fromCharCode(65 + i + 1)}) ${q.options[i + 1]}`
                              : "",
                          size: 22,
                          font: "Times New Roman",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            })
          );
        }

        children.push(
          new Table({
            rows: optionRows,
            width: { size: 7144, type: WidthType.DXA }, // ✅ 60% fixed
            borders: borderNone,
            alignment: AlignmentType.LEFT,
            layout: "fixed", // ✅ enforce fixed width
          })
        );
      }

      // ✅ Add 5px (~100 twip) spacing after each question
      children.push(
        new Paragraph({
          text: "",
          spacing: { after: 100 },
        })
      );
    });
  });

  // ===== DOCUMENT =====
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 400,
              right: 400,
            },
          },
        },
        children,
      },
    ],
  });

  // File Name → Class_Subject_Question_Paper.docx
  const fileName = `${paper.header.class || "Class"}_${
    paper.header.subject || "Subject"
  }_Question_Paper.docx`;

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
};
