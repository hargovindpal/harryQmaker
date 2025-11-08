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
  BorderStyle,
} from "docx";

/* ----------------- Helpers ----------------- */
function base64ToUint8Array(dataURI) {
  if (!dataURI) return null;
  try {
    const comma = dataURI.indexOf(",");
    const base64 = comma >= 0 ? dataURI.slice(comma + 1) : dataURI;
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (e) {
    return null;
  }
}

const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const tr = (text = "", opts = {}) =>
  new TextRun({
    text: text || "",
    font: "Times New Roman",
    size: opts.size || 26,
    bold: !!opts.bold,
    underline: !!opts.underline,
  });

const lowerRoman = (n) => {
  const romans = [
    "i","ii","iii","iv","v","vi","vii","viii","ix","x",
    "xi","xii","xiii","xiv","xv","xvi","xvii","xviii","xix","xx"
  ];
  return (n >= 1 && n <= romans.length) ? romans[n - 1] : String(n);
};

/* ----------------- Main generator ----------------- */

export async function generateDocx(paper) {
  const children = [];

  /* ----------------- HEADER ----------------- */
  const headerCells = [];

  if (paper.header?.logo) {
    const bytes = base64ToUint8Array(paper.header.logo);
    if (bytes) {
      headerCells.push(
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          verticalAlign: "center",
          borders: borderNone,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new ImageRun({ data: bytes, transformation: { width: 90, height: 90 } })],
            }),
          ],
        })
      );
    } else {
      headerCells.push(new TableCell({ borders: borderNone, children: [new Paragraph("")] }));
    }
  }

  const centerChildren = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [tr(paper.header?.school || "SCHOOL NAME", { bold: true, size: 44 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [tr(paper.header?.exam || "EXAMINATION", { bold: true, underline: true, size: 34 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        tr(
          `CLASS: ${paper.header?.class || ""}    SUB: ${paper.header?.subject || ""}    TIME: ${paper.header?.time || ""}    M.M: ${paper.header?.marks || ""}`,
          { bold: true, size: 28 }
        ),
      ],
    }),
  ];

  headerCells.push(
    new TableCell({
      width: { size: paper.header?.logo ? 82 : 100, type: WidthType.PERCENTAGE },
      borders: borderNone,
      children: centerChildren,
    })
  );

  children.push(
    new Table({
      rows: [new TableRow({ children: headerCells })],
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: borderNone,
    })
  );

  children.push(
    new Paragraph({
      border: { bottom: { color: "000000", size: 12 } },
      spacing: { after: 200 },
    })
  );

  /* ----------------- BODY (SECTIONS) ----------------- */
  const sections = Array.isArray(paper.sections) ? paper.sections : [];
  for (let sIndex = 0; sIndex < sections.length; sIndex++) {
    const section = sections[sIndex] || {};
    const sectionTitle = (section.title || `Section ${sIndex + 1}`).toUpperCase();

    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 300, after: 100 },
        children: [tr(sectionTitle, { bold: true, size: 28 })],
      })
    );

    const questions = Array.isArray(section.questions) ? section.questions : [];

    // Group consecutive types
    const groups = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i] || {};
      if (i === 0 || q.type !== (questions[i - 1] || {}).type) {
        groups.push({ type: q.type || "normal", items: [{ index: i, q }] });
      } else {
        groups[groups.length - 1].items.push({ index: i, q });
      }
    }

    // Render groups
    for (let g = 0; g < groups.length; g++) {
      const group = groups[g];
      const groupNo = g + 1;

      // ----- new logic: support group-level override (groupTotal / totalMarks / marksTotal)
      let groupMarks = 0;

      // look for override on first question object (backwards-compatible)
      const firstQ = group.items[0]?.q || {};
      const overrideRaw = firstQ.groupTotal ?? firstQ.totalMarks ?? firstQ.marksTotal;
      const overrideVal = overrideRaw !== undefined ? parseInt(overrideRaw, 10) : NaN;

      if (!Number.isNaN(overrideVal) && overrideVal > 0) {
        groupMarks = overrideVal;
      } else {
        // fallback: sum per-question marks (including comprehension subquestions)
        for (let it = 0; it < group.items.length; it++) {
          const qq = group.items[it].q || {};
          if (qq.type === "comprehension") {
            (qq.subQuestions || []).forEach((s) => { groupMarks += parseInt(s.marks || 0, 10) || 0; });
          } else {
            groupMarks += parseInt(qq.marks || 0, 10) || 0;
          }
        }
      }
      // ----- end group-total logic

      const firstInst = group.items[0]?.q?.instruction || (() => {
        switch (group.type) {
          case "objective": return "Choose the correct option:";
          case "truefalse": return "State whether the following are True or False:";
          case "fill": return "Fill in the blanks:";
          case "matching": return "Match the following:";
          case "comprehension": return "Read the passage and answer the following:";
          default: return "";
        }
      })();

      // Group header: instruction (left) + total marks for the group (right) shown as [X Marks]
      children.push(new Table({
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: 85, type: WidthType.PERCENTAGE },
              borders: borderNone,
              children: [
                new Paragraph({ children: [tr(`${groupNo}. ${firstInst}`, { size: 24, bold: true })] }),
              ],
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: borderNone,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [tr(groupMarks ? `[${groupMarks} Marks]` : "", { size: 24 })],
                }),
              ],
            }),
          ],
        })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: borderNone,
      }));

      // If this group type should be rendered as a single merged table (one row per question)
      const mergedTypes = ["fill", "normal", "truefalse"];
      if (mergedTypes.includes(group.type)) {
        const mergedRows = [];

        for (let ri = 0; ri < group.items.length; ri++) {
          const item = group.items[ri];
          const q = item.q || {};
          const leftPara = new Paragraph({
            children: [tr(`${ri + 1}. ${q.text || ""}`, { size: 26 })],
          });

          // Right cell intentionally left blank (no per-question marks)
          const rightPara = new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [tr("", { size: 26 })],
          });

          mergedRows.push(new TableRow({
            children: [
              new TableCell({
                borders: borderNone,
                verticalAlign: "top",
                children: [leftPara],
                margins: { top: 40, bottom: 40, left: 80, right: 80 },
              }),
              new TableCell({
                width: { size: 1500, type: WidthType.DXA },
                borders: borderNone,
                verticalAlign: "top",
                children: [rightPara],
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
              }),
            ],
          }));
        }

        if (mergedRows.length) {
          children.push(new Table({
            rows: mergedRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: borderNone,
          }));
        }

        children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
        continue;
      }

      // Per-question rendering for non-merged groups
      for (let itemIdx = 0; itemIdx < group.items.length; itemIdx++) {
        const { q } = group.items[itemIdx];

        // For matching where q.text may be empty, hide numbering
        const hasQText = q.text && String(q.text).trim().length > 0;
        const leftText =
          group.type === "matching" && !hasQText
            ? ""
            : `${itemIdx + 1}. ${q.text || ""}`;

        const qLeftPara = new Paragraph({
          children: [tr(leftText, { size: 26 })],
        });

        // Per-question right cell is intentionally blank (no per-question marks)
        const qRightPara = new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [tr("", { size: 26 })],
        });

        // QUESTION TABLE: force full-width for objective & matching; autofit otherwise
        if (group.type === "objective" || group.type === "matching") {
          children.push(new Table({
            rows: [new TableRow({
              children: [
                new TableCell({
                  width: { size: 85, type: WidthType.PERCENTAGE }, // left cell: 85%
                  borders: borderNone,
                  children: [qLeftPara],
                  verticalAlign: "top",
                  margins: { top: 40, bottom: 40, left: 80, right: 80 },
                }),
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE }, // right cell: 15%
                  borders: borderNone,
                  children: [qRightPara],
                  verticalAlign: "top",
                  margins: { top: 40, bottom: 40, left: 40, right: 40 },
                }),
              ],
            })],
            width: { size: 100, type: WidthType.PERCENTAGE }, // full page width
            layout: TableLayoutType.FIXED,
            borders: borderNone,
          }));
        } else {
          children.push(new Table({
            rows: [new TableRow({
              children: [
                new TableCell({
                  borders: borderNone,
                  children: [qLeftPara],
                  margins: { top: 40, bottom: 40, left: 80, right: 80 },
                }),
                new TableCell({
                  width: { size: 1500, type: WidthType.DXA },
                  borders: borderNone,
                  children: [qRightPara],
                  margins: { top: 40, bottom: 40, left: 40, right: 40 },
                }),
              ],
            })],
            layout: TableLayoutType.AUTOFIT,
            borders: borderNone,
          }));
        }

        // OBJECTIVE: options table (unchanged except no per-question marks)
        if (group.type === "objective") {
          const opts = Array.isArray(q.options) ? q.options : [];
          const optRows = [];

          for (let i = 0; i < opts.length; i += 2) {
            const leftText = opts[i] ? `(${String.fromCharCode(97 + i)}) ${opts[i]}` : "";
            const rightText = opts[i + 1] ? `(${String.fromCharCode(97 + i + 1)}) ${opts[i + 1]}` : "";

            optRows.push(new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [new Paragraph({ children: [tr(leftText, { size: 22 })] })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [new Paragraph({ children: [tr(rightText, { size: 22 })] })],
                }),
              ],
            }));
          }

          // small spacer between question row and options table
          children.push(new Paragraph({ text: "", spacing: { after: 5 } }));

          if (optRows.length) {
            children.push(new Table({
              rows: optRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              borders: borderNone,
            }));
          }

          children.push(new Paragraph({ text: "", spacing: { after: 150 } }));
          continue;
        }

        // MATCHING: question row shown (may be empty left) and options table below
        if (group.type === "matching") {
          const left = Array.isArray(q.columnA) ? q.columnA : [];
          const right = Array.isArray(q.columnB) ? q.columnB : [];
          const maxLen = Math.max(left.length, right.length);
          const matchRows = [];

          // spacer so Word doesn't merge tables
          children.push(new Paragraph({ text: "", spacing: { after: 5 } }));

          for (let i = 0; i < maxLen; i++) {
            const ltext = left[i] ? `${i + 1}. ${left[i]}` : "";
            const rtext = right[i] ? `${String.fromCharCode(65 + i)}. ${right[i]}` : "";

            matchRows.push(new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  verticalAlign: "top",
                  children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [tr(ltext, { size: 22 })] })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  verticalAlign: "top",
                  children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [tr(rtext, { size: 22 })] })],
                }),
              ],
            }));
          }

          if (matchRows.length) {
            children.push(new Table({
              rows: matchRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              borders: borderNone,
            }));
          }

          children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
          continue;
        }

        // COMPREHENSION: show passage then subquestions; subquestion rows no longer show per-sub marks
        if (group.type === "comprehension") {
          if (q.passage) {
            children.push(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 80 }, children: [tr(q.passage, { size: 24 })] }));
          }
          if (q.image) {
            const img = base64ToUint8Array(q.image);
            if (img) {
              children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: img, transformation: { width: 250, height: 160 } })], spacing: { after: 100 } }));
            }
          }
          const subs = Array.isArray(q.subQuestions) ? q.subQuestions : [];
          for (let si = 0; si < subs.length; si++) {
            const sub = subs[si] || {};
            const leftPara = new Paragraph({ alignment: AlignmentType.LEFT, children: [tr(`${lowerRoman(si + 1)}. ${sub.text || ""}`, { size: 22 })] });

            // right cell intentionally blank (no per-subquestion marks)
            const rightPara = new Paragraph({ alignment: AlignmentType.RIGHT, children: [tr("", { size: 22 })] });

            children.push(new Table({
              rows: [ new TableRow({ children: [
                new TableCell({ width: { size: 85, type: WidthType.PERCENTAGE }, borders: borderNone, children: [leftPara] } ),
                new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: borderNone, children: [rightPara] } ),
              ] }) ],
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              borders: borderNone,
            }));
            children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
          }
          continue;
        }

        // Default small spacing for any other types
        children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      } // end per-item loop
    } // end groups loop
  } // end sections loop

  // Create Document
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 400, right: 400 } } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export default generateDocx;
