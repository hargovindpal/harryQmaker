// src/pages/Editor.jsx
import { useState, useEffect } from "react";
import { generateDocx } from "../utils/docxGenerator";
import { saveAs } from "file-saver";
import { Accordion, Button, Form } from "react-bootstrap";
import "../styles/global.css";

function Editor() {
  const [paper, setPaper] = useState({
    header: {
      school: "",
      exam: "",
      class: "",
      subject: "",
      time: "",
      marks: "0",
      logo: null,
    },
    sections: [],
  });

  const [quickAdd, setQuickAdd] = useState([]);

  // ---------- total marks ----------
  const calculateTotalMarks = () => {
    let total = 0;
    const sections = paper.sections || [];
    for (let s = 0; s < sections.length; s++) {
      const section = sections[s] || {};
      const qs = section.questions || [];
      for (let q = 0; q < qs.length; q++) {
        const question = qs[q] || {};
        if (question.type === "comprehension") {
          const subs = question.subQuestions || [];
          for (let i = 0; i < subs.length; i++) {
            total += parseInt(subs[i].marks || 0, 10) || 0;
          }
        } else {
          total += parseInt(question.marks || 0, 10) || 0;
        }
      }
    }
    return total;
  };

  const totalMarks = calculateTotalMarks();

  // sync header marks & quickAdd length
  useEffect(() => {
    if (paper.header.marks !== totalMarks.toString()) {
      setPaper((p) => ({ ...p, header: { ...p.header, marks: totalMarks.toString() } }));
    }
    // ensure quickAdd array matches sections length (preserve existing values)
    setQuickAdd((prev) => (paper.sections || []).map((_, i) => !!prev[i]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMarks, paper.sections.length]);

  // ---------- header ----------
  const updateHeader = (e) => {
    const { name, value } = e.target;
    if (name === "marks") return;
    setPaper((p) => ({ ...p, header: { ...p.header, [name]: value } }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPaper((p) => ({ ...p, header: { ...p.header, logo: reader.result } }));
    reader.readAsDataURL(file);
  };

  // ---------- sections ----------
  const addSection = () => {
    setPaper((p) => ({ ...p, sections: [...(p.sections || []), { title: "", questions: [] }] }));
    setQuickAdd((q) => [...(q || []), false]);
  };

  const deleteSection = (index) => {
    setPaper((p) => ({ ...p, sections: (p.sections || []).filter((_, i) => i !== index) }));
    setQuickAdd((q) => (q || []).filter((_, i) => i !== index));
  };

  const updateSection = (index, value) => {
    setPaper((p) => {
      const s = [...(p.sections || [])];
      s[index] = { ...(s[index] || {}), title: value };
      return { ...p, sections: s };
    });
  };

  const toggleQuickAdd = (index) => {
    setQuickAdd((q) => {
      const arr = [...(q || [])];
      arr[index] = !arr[index];
      return arr;
    });
  };

  // ---------- defaults ----------
  const defaultInstruction = (type) => {
    switch (type) {
      case "truefalse":
        return "State whether the following is True or False:";
      case "fill":
        return "Fill in the blank:";
      case "matching":
        return "Match the following:";
      case "objective":
        return "Choose the correct option:";
      case "comprehension":
        return "Read the passage and answer the following:";
      case "normal":
        // Make sure normal questions get a non-empty default so "Add Instruction" actually creates an editable instruction field
        return "Answer the following:";
      default:
        return "Answer the following:";
    }
  };

  // ---------- question operations ----------
  const addQuestion = (sectionIndex, type = "normal") => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const useQuick = !!quickAdd[sectionIndex];
      const q = {
        type,
        text: "",
        marks: "",
        instruction: useQuick ? defaultInstruction(type) : "",
      };
      if (type === "objective") q.options = ["", ""];
      if (type === "matching") {
        q.columnA = [""];
        q.columnB = [""];
      }
      if (type === "image") q.image = null;
      if (type === "comprehension") {
        q.passage = "";
        q.subQuestions = [];
        q.image = null;
      }
      sections[sectionIndex] = { ...(sections[sectionIndex] || {}), questions: [...(sections[sectionIndex]?.questions || []), q] };
      return { ...p, sections };
    });
  };

  const deleteQuestion = (sectionIndex, qIndex) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      sections[sectionIndex] = { ...sections[sectionIndex], questions: (sections[sectionIndex].questions || []).filter((_, i) => i !== qIndex) };
      return { ...p, sections };
    });
  };

  const updateQuestion = (sectionIndex, qIndex, field, value) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = { ...((sections[sectionIndex].questions || [])[qIndex] || {}), [field]: value };
      sections[sectionIndex].questions[qIndex] = q;
      return { ...p, sections };
    });
  };

  const addInstruction = (sectionIndex, qIndex) => {
    const t = paper.sections?.[sectionIndex]?.questions?.[qIndex]?.type || "normal";
    // set a non-empty instruction so the UI switches to the instruction input
    updateQuestion(sectionIndex, qIndex, "instruction", defaultInstruction(t));
  };

  const removeInstruction = (sectionIndex, qIndex) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = { ...(sections[sectionIndex].questions[qIndex] || {}) };
      delete q.instruction;
      sections[sectionIndex].questions[qIndex] = q;
      return { ...p, sections };
    });
  };

  // objective options
  const addOption = (sectionIndex, qIndex) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = sections[sectionIndex].questions[qIndex];
      q.options = Array.isArray(q.options) ? [...q.options, ""] : [""];
      sections[sectionIndex].questions[qIndex] = q;
      return { ...p, sections };
    });
  };

  const removeOption = (sectionIndex, qIndex, optIndex) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = sections[sectionIndex].questions[qIndex];
      q.options = (q.options || []).filter((_, i) => i !== optIndex);
      sections[sectionIndex].questions[qIndex] = q;
      return { ...p, sections };
    });
  };

  const updateOption = (sectionIndex, qIndex, optionIndex, value) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = sections[sectionIndex].questions[qIndex];
      q.options = q.options || [];
      q.options[optionIndex] = value;
      sections[sectionIndex].questions[qIndex] = q;
      return { ...p, sections };
    });
  };

  // image
  const handleImageUpload = (sectionIndex, qIndex, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setPaper((p) => {
        const sections = [...(p.sections || [])];
        sections[sectionIndex].questions[qIndex] = { ...(sections[sectionIndex].questions[qIndex] || {}), image: reader.result };
        return { ...p, sections };
      });
    reader.readAsDataURL(file);
  };

  // comprehension
  const addSubQuestion = (sIdx, qIdx) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = sections[sIdx].questions[qIdx];
      q.subQuestions = q.subQuestions || [];
      q.subQuestions.push({ text: "", marks: "" });
      sections[sIdx].questions[qIdx] = q;
      return { ...p, sections };
    });
  };

  const updateSubQuestion = (sIdx, qIdx, subIdx, field, value) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      sections[sIdx].questions[qIdx].subQuestions[subIdx][field] = value;
      return { ...p, sections };
    });
  };

  const deleteSubQuestion = (sIdx, qIdx, subIdx) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      sections[sIdx].questions[qIdx].subQuestions = (sections[sIdx].questions[qIdx].subQuestions || []).filter((_, i) => i !== subIdx);
      return { ...p, sections };
    });
  };

  // matching
  const addMatchingPair = (sIdx, qIdx) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = sections[sIdx].questions[qIdx];
      q.columnA = Array.isArray(q.columnA) ? [...q.columnA, ""] : [""];
      q.columnB = Array.isArray(q.columnB) ? [...q.columnB, ""] : [""];
      sections[sIdx].questions[qIdx] = q;
      return { ...p, sections };
    });
  };

  const updateMatchingPair = (sIdx, qIdx, side, pIdx, value) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = sections[sIdx].questions[qIdx];
      if (side === "A") {
        q.columnA = q.columnA || [];
        q.columnA[pIdx] = value;
      } else {
        q.columnB = q.columnB || [];
        q.columnB[pIdx] = value;
      }
      sections[sIdx].questions[qIdx] = q;
      return { ...p, sections };
    });
  };

  const removeMatchingPair = (sIdx, qIdx, pIdx) => {
    setPaper((p) => {
      const sections = [...(p.sections || [])];
      const q = sections[sIdx].questions[qIdx];
      q.columnA = (q.columnA || []).filter((_, i) => i !== pIdx);
      q.columnB = (q.columnB || []).filter((_, i) => i !== pIdx);
      sections[sIdx].questions[qIdx] = q;
      return { ...p, sections };
    });
  };

  // print / export
  const handlePrint = () => window.print();

  const handleExportDocx = async () => {
    try {
      const totalQuestions = (paper.sections || []).reduce((acc, s) => acc + ((s.questions || []).length || 0), 0);
      if (totalQuestions === 0) {
        alert("Add at least one question before exporting.");
        return;
      }
      const blob = await generateDocx(paper);
      const fname = `${(paper.header.exam || "Question_Paper").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.docx`;
      saveAs(blob, fname);
    } catch (err) {
      console.error(err);
      alert("Export failed: " + (err?.message || err));
    }
  };

  // ---------- render ----------
  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-4">📄 Question Paper Generator</h2>

      <div className="alert alert-info text-center fs-5 fw-bold">🔢 Total Marks: {totalMarks}</div>

      {/* Header */}
      <div className="card shadow-lg border-0 rounded-4 p-4 mb-4">
        <h4 className="fw-bold mb-3 text-white bg-dark p-2 text-center">📝 Paper Header</h4>
        <div className="row g-3">
          <div className="col-md-4 text-center">
            <input type="file" accept="image/*" className="form-control-file" onChange={handleLogoUpload} />
          </div>
          {Object.keys(paper.header).filter((k) => k !== "logo" && k !== "marks").map((key) => (
            <div key={key} className="col-md-4">
              <input type="text" className="form-control" placeholder={key.toUpperCase()} name={key} value={paper.header[key] || ""} onChange={updateHeader} />
            </div>
          ))}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="small text-muted">Tip: toggle Quick Add to create questions quickly.</div>
          <div><span className="badge total-marks">Total: {totalMarks}</span></div>
        </div>
      </div>

      {/* Sections */}
      <Accordion defaultActiveKey="0">
        {paper.sections.map((section, sIndex) => {
          const sectionMarks = (section.questions || []).reduce((sum, q) => {
            if (!q) return sum;
            if (q.type === "comprehension") return sum + (q.subQuestions || []).reduce((ss, sub) => ss + (parseInt(sub.marks || 0, 10) || 0), 0);
            return sum + (parseInt(q.marks || 0, 10) || 0);
          }, 0);

          // Precompute group starts & group numbers for this section's questions
          const qs = section.questions || [];
          const groupStart = [];
          const groupNumber = [];
          let grp = 0;
          let prevType = null;
          for (let i = 0; i < qs.length; i++) {
            const t = qs[i]?.type || "normal";
            if (i === 0 || t !== prevType) {
              grp++;
              groupStart[i] = true;
            } else {
              groupStart[i] = false;
            }
            groupNumber[i] = grp;
            prevType = t;
          }

          return (
            <Accordion.Item eventKey={String(sIndex)} key={sIndex}>
              <Accordion.Header>
                {section.title || `SECTION-${String.fromCharCode(65 + sIndex)}`} <span className="ms-2 text-muted">({sectionMarks} Marks)</span>
              </Accordion.Header>
              <Accordion.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <input type="text" className="form-control fw-bold section-title" placeholder="Section Title" value={section.title || ""} onChange={(e) => updateSection(sIndex, e.target.value)} />
                  <div className="d-flex align-items-center gap-2">
                    <Form.Check type="switch" id={`quick-add-${sIndex}`} label="Quick Add" checked={!!quickAdd[sIndex]} onChange={() => toggleQuickAdd(sIndex)} />
                    <Button variant="outline-danger" size="sm" onClick={() => deleteSection(sIndex)}>❌</Button>
                  </div>
                </div>

                {qs.map((q, qIndex) => {
                  const isGroupStart = !!groupStart[qIndex];
                  const gNum = groupNumber[qIndex] || 0;
                  return (
                    <div key={qIndex} className="question-card mb-3 p-3 border rounded">
                      {/* If this question is the first of a consecutive-type group, show group heading */}
                      {isGroupStart && (
                        <div className="group-heading mb-2">
                          <strong>Q-{gNum}</strong>
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="q-label">
                          <strong>Q{qIndex + 1}</strong>
                          {q.marks ? <span className="ms-2 mark-badge">[{q.marks} Marks]</span> : null}
                        </div>
                        <div>
                          <Button variant="outline-danger" size="sm" onClick={() => deleteQuestion(sIndex, qIndex)}>🗑</Button>
                        </div>
                      </div>

                      {/* Instruction control */}
                      {q.instruction ? (
                        <div className="d-flex gap-2 align-items-center my-2">
                          <input type="text" className="form-control" placeholder={defaultInstruction(q.type)} value={q.instruction || ""} onChange={(e) => updateQuestion(sIndex, qIndex, "instruction", e.target.value)} />
                          <Button variant="outline-danger" size="sm" onClick={() => removeInstruction(sIndex, qIndex)}>🗑</Button>
                        </div>
                      ) : (
                        <div className="my-2">
                          <Button variant="outline-secondary" size="sm" onClick={() => addInstruction(sIndex, qIndex)}>➕ Add Instruction</Button>
                        </div>
                      )}

                      {/* Question text (NOT shown for matching questions) */}
                      {q.type !== "matching" && (
                        <>
                          <label className="small text-muted">Question Text</label>
                          <input type="text" className="form-control my-2" placeholder="Enter Question Text" value={q.text || ""} onChange={(e) => updateQuestion(sIndex, qIndex, "text", e.target.value)} />
                        </>
                      )}

                      {q.type !== "comprehension" && (
                        <>
                          <label className="small text-muted">Marks</label>
                          <input type="number" className="form-control my-2" placeholder="Marks" value={q.marks || ""} onChange={(e) => updateQuestion(sIndex, qIndex, "marks", e.target.value)} />
                        </>
                      )}

                      {/* Objective */}
                      {q.type === "objective" && (
                        <div className="mb-2">
                          <label className="small text-muted">Options</label>
                          {(q.options || []).map((opt, i) => (
                            <div key={i} className="option-row d-flex gap-2 mb-1 align-items-center">
                              <span className="option-label" style={{ minWidth: 36, display: "inline-block" }}>{`(${String.fromCharCode(97 + i)})`}</span>
                              <input type="text" className="form-control" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt || ""} onChange={(e) => updateOption(sIndex, qIndex, i, e.target.value)} />
                              <Button variant="outline-danger" size="sm" onClick={() => removeOption(sIndex, qIndex, i)}>🗑</Button>
                            </div>
                          ))}
                          <div className="action-bar d-flex gap-2">
                            <Button variant="outline-success" size="sm" onClick={() => addOption(sIndex, qIndex)}>➕ Add Option</Button>
                          </div>
                        </div>
                      )}

                      {/* Image upload */}
                      {(q.type === "image" || q.type === "comprehension") && (
                        <>
                          <label className="small text-muted">Upload Image (optional)</label>
                          <input type="file" accept="image/*" className="form-control my-2" onChange={(e) => handleImageUpload(sIndex, qIndex, e)} />
                        </>
                      )}

                      {/* Matching */}
                      {q.type === "matching" && (
                        <>
                          <div className="mb-2 fw-semibold">Pairs (Left — Right)</div>
                          {(q.columnA || []).map((left, i) => (
                            <div key={i} className="pair-row d-flex gap-2 mb-2 align-items-center">
                              <input type="text" className="form-control" placeholder={`Left ${i + 1}`} value={left || ""} onChange={(e) => updateMatchingPair(sIndex, qIndex, "A", i, e.target.value)} />
                              <input type="text" className="form-control" placeholder={`Right ${i + 1}`} value={(q.columnB || [])[i] || ""} onChange={(e) => updateMatchingPair(sIndex, qIndex, "B", i, e.target.value)} />
                              <Button variant="outline-danger" size="sm" onClick={() => removeMatchingPair(sIndex, qIndex, i)}>🗑</Button>
                            </div>
                          ))}
                          <div className="action-bar d-flex gap-2">
                            <Button variant="outline-success" size="sm" onClick={() => addMatchingPair(sIndex, qIndex)}>➕ Add Pair</Button>
                          </div>
                        </>
                      )}

                      {/* Comprehension */}
                      {q.type === "comprehension" && (
                        <>
                          <label className="small text-muted">Passage</label>
                          <textarea className="form-control my-2" placeholder="Passage" value={q.passage || ""} onChange={(e) => updateQuestion(sIndex, qIndex, "passage", e.target.value)} />
                          {(q.subQuestions || []).map((subQ, subIndex) => (
                            <div key={subIndex} className="d-flex gap-2 my-1">
                              <input type="text" className="form-control" placeholder={`Sub-question ${subIndex + 1}`} value={subQ.text || ""} onChange={(e) => updateSubQuestion(sIndex, qIndex, subIndex, "text", e.target.value)} />
                              <input type="number" className="form-control" placeholder="Marks" value={subQ.marks || ""} onChange={(e) => updateSubQuestion(sIndex, qIndex, subIndex, "marks", e.target.value)} />
                              <Button variant="outline-danger" size="sm" onClick={() => deleteSubQuestion(sIndex, qIndex, subIndex)}>🗑</Button>
                            </div>
                          ))}
                          <Button variant="outline-success" size="sm" className="my-1" onClick={() => addSubQuestion(sIndex, qIndex)}>➕ Add Sub-question</Button>
                        </>
                      )}
                    </div>
                  );
                })}

                <div className="d-flex flex-wrap gap-2 mt-2">
                  <Button variant="outline-success" size="sm" onClick={() => addQuestion(sIndex, "normal")}>➕ Normal Question</Button>
                  <Button variant="outline-info" size="sm" onClick={() => addQuestion(sIndex, "objective")}>➕ Objective</Button>
                  <Button variant="outline-primary" size="sm" onClick={() => addQuestion(sIndex, "image")}>➕ Question Image</Button>
                  <Button variant="outline-warning" size="sm" onClick={() => addQuestion(sIndex, "fill")}>➕ Fill in the Blank</Button>
                  <Button variant="outline-dark" size="sm" onClick={() => addQuestion(sIndex, "truefalse")}>➕ True/False</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => addQuestion(sIndex, "matching")}>➕ Matching</Button>
                  <Button variant="outline-info" size="sm" onClick={() => addQuestion(sIndex, "comprehension")}>➕ Comprehension Question</Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
      </Accordion>

      <div className="text-center my-4">
        <Button variant="primary" onClick={addSection}>➕ Add Section</Button>
      </div>

      <div className="text-center d-flex justify-content-center gap-3">
        <Button variant="success" size="lg" className="fw-bold px-5" onClick={handleExportDocx}>⬇ Export as DOCX</Button>
        <Button variant="warning" size="lg" className="fw-bold px-5" onClick={handlePrint}>🖨 Print Paper</Button>
      </div>
    </div>
  );
}

export default Editor;
