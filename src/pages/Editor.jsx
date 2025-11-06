// src/pages/Editor.jsx
import { useState, useEffect } from "react";
import { generateDocx } from "../utils/docxGenerator";
import { saveAs } from "file-saver";
import "bootstrap/dist/css/bootstrap.min.css";
import { Accordion, Button } from "react-bootstrap";

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

  // --- total marks computation ---
  const calculateTotalMarks = () => {
    return paper.sections?.reduce((total, section) => {
      const sectionMarks = section.questions?.reduce((secTotal, q) => {
        if (q.type === "comprehension") {
          return (
            secTotal +
            (q.subQuestions?.reduce(
              (sqTotal, sq) => sqTotal + (parseInt(sq.marks) || 0),
              0
            ) || 0)
          );
        }
        return secTotal + (parseInt(q.marks) || 0);
      }, 0);
      return total + (sectionMarks || 0);
    }, 0);
  };

  const totalMarks = calculateTotalMarks();

  useEffect(() => {
    if (paper.header.marks !== totalMarks.toString()) {
      setPaper((prev) => ({
        ...prev,
        header: { ...prev.header, marks: totalMarks.toString() },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMarks]);

  // --- header update & logo ---
  const updateHeader = (e) => {
    if (e.target.name === "marks") return;
    setPaper({
      ...paper,
      header: { ...paper.header, [e.target.name]: e.target.value },
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaper((prev) => ({
        ...prev,
        header: { ...prev.header, logo: reader.result },
      }));
    };
    reader.readAsDataURL(file);
  };

  // --- Sections and questions management ---
  const addSection = () => {
    setPaper((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: "", questions: [] }],
    }));
  };

  const deleteSection = (index) => {
    setPaper((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const updateSection = (index, value) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      newSections[index].title = value;
      return { ...prev, sections: newSections };
    });
  };

  const addQuestion = (sectionIndex, type = "normal") => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      let newQuestion = { type, text: "", marks: "", instruction: "" };
      if (type === "objective") newQuestion.options = ["", ""]; // start with 2 options
      if (type === "image") newQuestion.image = null;
      if (type === "matching") {
        // start with one empty pair
        newQuestion.columnA = [""];
        newQuestion.columnB = [""];
      }
      if (type === "comprehension") {
        newQuestion.passage = "";
        newQuestion.image = null;
        newQuestion.subQuestions = [];
      }
      newSections[sectionIndex].questions.push(newQuestion);
      return { ...prev, sections: newSections };
    });
  };

  const deleteQuestion = (sectionIndex, qIndex) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions =
        newSections[sectionIndex].questions.filter((_, i) => i !== qIndex);
      return { ...prev, sections: newSections };
    });
  };

  const updateQuestion = (sectionIndex, qIndex, field, value) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions[qIndex] = {
        ...newSections[sectionIndex].questions[qIndex],
        [field]: value,
      };
      return { ...prev, sections: newSections };
    });
  };

  // --- Objective options helpers ---
  const addOption = (sectionIndex, qIndex) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      const q = newSections[sectionIndex].questions[qIndex];
      q.options = Array.isArray(q.options) ? q.options.concat("") : [""];
      return { ...prev, sections: newSections };
    });
  };

  const removeOption = (sectionIndex, qIndex, optIndex) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      const q = newSections[sectionIndex].questions[qIndex];
      q.options = (q.options || []).filter((_, i) => i !== optIndex);
      return { ...prev, sections: newSections };
    });
  };

  const updateOption = (sectionIndex, qIndex, optionIndex, value) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      const q = newSections[sectionIndex].questions[qIndex];
      q.options = q.options || [];
      q.options[optionIndex] = value;
      return { ...prev, sections: newSections };
    });
  };

  const handleImageUpload = (sectionIndex, qIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaper((prev) => {
        const newSections = [...prev.sections];
        newSections[sectionIndex].questions[qIndex] = {
          ...newSections[sectionIndex].questions[qIndex],
          image: reader.result,
        };
        return { ...prev, sections: newSections };
      });
    };
    reader.readAsDataURL(file);
  };

  // Sub-questions for comprehension
  const addSubQuestion = (sectionIndex, qIndex) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      const subQs = newSections[sectionIndex].questions[qIndex].subQuestions || [];
      newSections[sectionIndex].questions[qIndex].subQuestions = [
        ...subQs,
        { text: "", marks: "" },
      ];
      return { ...prev, sections: newSections };
    });
  };

  const updateSubQuestion = (sectionIndex, qIndex, subIndex, field, value) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions[qIndex].subQuestions[subIndex][
        field
      ] = value;
      return { ...prev, sections: newSections };
    });
  };

  const deleteSubQuestion = (sectionIndex, qIndex, subIndex) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions[qIndex].subQuestions =
        newSections[sectionIndex].questions[qIndex].subQuestions.filter(
          (_, i) => i !== subIndex
        );
      return { ...prev, sections: newSections };
    });
  };

  // Matching helpers
  const addMatchingPair = (sectionIndex, qIndex) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      const q = newSections[sectionIndex].questions[qIndex];
      q.columnA = Array.isArray(q.columnA) ? q.columnA.concat("") : [""];
      q.columnB = Array.isArray(q.columnB) ? q.columnB.concat("") : [""];
      return { ...prev, sections: newSections };
    });
  };

  const updateMatchingPair = (sectionIndex, qIndex, side, pairIndex, value) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      const q = newSections[sectionIndex].questions[qIndex];
      const arr = side === "A" ? (q.columnA || []) : (q.columnB || []);
      arr[pairIndex] = value;
      if (side === "A") q.columnA = arr;
      else q.columnB = arr;
      return { ...prev, sections: newSections };
    });
  };

  const removeMatchingPair = (sectionIndex, qIndex, pairIndex) => {
    setPaper((prev) => {
      const newSections = [...prev.sections];
      const q = newSections[sectionIndex].questions[qIndex];
      q.columnA = (q.columnA || []).filter((_, i) => i !== pairIndex);
      q.columnB = (q.columnB || []).filter((_, i) => i !== pairIndex);
      return { ...prev, sections: newSections };
    });
  };

  const handlePrint = () => window.print();

  // Export handler
  const handleExportDocx = async () => {
    try {
      const totalQuestions = paper.sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
      if (totalQuestions === 0) {
        alert("Add at least one question before exporting.");
        return;
      }

      const blob = await generateDocx(paper);
      const fname = `${(paper.header.exam || "Question_Paper").replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.docx`;
      saveAs(blob, fname);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed: " + (err.message || err));
    }
  };

  // Helper: default instruction placeholder per type
  const defaultInstructionPlaceholder = (type) => {
    if (!type) return "Instruction / Heading (optional)";
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
      default:
        return "Instruction / Heading (optional)";
    }
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-4">📄 Question Paper Generator</h2>

      <div className="alert alert-info text-center fs-5 fw-bold">🔢 Total Marks: {totalMarks}</div>

      {/* Header */}
      <div className="card shadow-lg border-0 rounded-4 p-4 mb-4">
        <h4 className="fw-bold mb-3 text-white bg-dark p-2 text-center">📝 Paper Header</h4>
        <div className="row g-3">
          <div className="col-md-4 text-center">
            <input type="file" accept="image/*" className="form-control" onChange={handleLogoUpload} />
          </div>
          {Object.keys(paper.header)
            .filter((key) => key !== "logo" && key !== "marks")
            .map((key) => (
              <div key={key} className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder={key.toUpperCase()}
                  name={key}
                  value={paper.header[key]}
                  onChange={updateHeader}
                />
              </div>
            ))}
        </div>
      </div>

      <hr className="my-4 border-2 border-dark" />

      {/* Sections */}
      <Accordion defaultActiveKey="0">
        {paper.sections.map((section, sIndex) => {
          const sectionMarks = section.questions?.reduce((sum, q) => {
            if (q.type === "comprehension") {
              return sum + (q.subQuestions?.reduce((sqSum, sq) => sqSum + (parseInt(sq.marks) || 0), 0) || 0);
            }
            return sum + (parseInt(q.marks) || 0);
          }, 0);

          return (
            <Accordion.Item eventKey={sIndex.toString()} key={sIndex}>
              <Accordion.Header>
                {section.title || `Section ${sIndex + 1}`}{" "}
                <span className="ms-2 text-muted">({sectionMarks} Marks)</span>
              </Accordion.Header>
              <Accordion.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <input type="text" className="form-control fw-bold" placeholder="Section Title" value={section.title} onChange={(e) => updateSection(sIndex, e.target.value)} />
                  <Button variant="outline-danger" size="sm" onClick={() => deleteSection(sIndex)}>❌</Button>
                </div>

                {section.questions.map((q, qIndex) => (
                  <div key={qIndex} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between">
                      <strong>Q{qIndex + 1} {q.marks && <span className="text-primary">[{q.marks} Marks]</span>}</strong>
                      <Button variant="outline-danger" size="sm" onClick={() => deleteQuestion(sIndex, qIndex)}>🗑</Button>
                    </div>

                    {/* Instruction input moved to top */}
                    {["truefalse", "fill", "matching", "objective", "comprehension"].includes(q.type) && (
                      <input
                        type="text"
                        className="form-control my-2"
                        placeholder={defaultInstructionPlaceholder(q.type)}
                        value={q.instruction || ""}
                        onChange={(e) => updateQuestion(sIndex, qIndex, "instruction", e.target.value)}
                      />
                    )}

                    {/* Main question text */}
                    <input type="text" className="form-control my-2" placeholder="Enter Question Text" value={q.text} onChange={(e) => updateQuestion(sIndex, qIndex, "text", e.target.value)} />

                    {q.type !== "comprehension" && (
                      <input type="number" className="form-control my-2" placeholder="Marks" value={q.marks} onChange={(e) => updateQuestion(sIndex, qIndex, "marks", e.target.value)} />
                    )}

                    {/* Objective (MCQ) with dynamic options */}
                    {q.type === "objective" && (
                      <div className="mb-2">
                        {(q.options || []).map((opt, i) => (
                          <div key={i} className="d-flex gap-2 mb-1 align-items-center">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              value={opt}
                              onChange={(e) => updateOption(sIndex, qIndex, i, e.target.value)}
                            />
                            <Button variant="outline-danger" size="sm" onClick={() => removeOption(sIndex, qIndex, i)}>🗑</Button>
                          </div>
                        ))}
                        <div className="d-flex gap-2">
                          <Button variant="outline-success" size="sm" onClick={() => addOption(sIndex, qIndex)}>➕ Add Option</Button>
                        </div>
                      </div>
                    )}

                    {/* Image upload */}
                    {(q.type === "image" || q.type === "comprehension") && (
                      <input type="file" accept="image/*" className="form-control my-2" onChange={(e) => handleImageUpload(sIndex, qIndex, e)} />
                    )}

                    {/* Matching Questions: dynamic pairs */}
                    {q.type === "matching" && (
                      <>
                        <div className="mb-2 fw-semibold">Pairs (Left — Right)</div>
                        {(q.columnA || []).map((left, i) => (
                          <div key={i} className="d-flex gap-2 mb-2 align-items-center">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`Left ${i + 1}`}
                              value={left}
                              onChange={(e) => updateMatchingPair(sIndex, qIndex, "A", i, e.target.value)}
                            />
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`Right ${i + 1}`}
                              value={(q.columnB || [])[i] || ""}
                              onChange={(e) => updateMatchingPair(sIndex, qIndex, "B", i, e.target.value)}
                            />
                            <Button variant="outline-danger" size="sm" onClick={() => removeMatchingPair(sIndex, qIndex, i)}>🗑</Button>
                          </div>
                        ))}
                        <div className="d-flex gap-2">
                          <Button variant="outline-success" size="sm" onClick={() => addMatchingPair(sIndex, qIndex)}>➕ Add Pair</Button>
                        </div>
                      </>
                    )}

                    {/* Comprehension */}
                    {q.type === "comprehension" && (
                      <>
                        <textarea className="form-control my-2" placeholder="Passage" value={q.passage || ""} onChange={(e) => updateQuestion(sIndex, qIndex, "passage", e.target.value)} />
                        {q.subQuestions?.map((subQ, subIndex) => (
                          <div key={subIndex} className="d-flex gap-2 my-1">
                            <input type="text" className="form-control" placeholder={`Sub-question ${subIndex + 1}`} value={subQ.text} onChange={(e) => updateSubQuestion(sIndex, qIndex, subIndex, "text", e.target.value)} />
                            <input type="number" className="form-control" placeholder="Marks" value={subQ.marks} onChange={(e) => updateSubQuestion(sIndex, qIndex, subIndex, "marks", e.target.value)} />
                            <Button variant="outline-danger" size="sm" onClick={() => deleteSubQuestion(sIndex, qIndex, subIndex)}>🗑</Button>
                          </div>
                        ))}
                        <Button variant="outline-success" size="sm" className="my-1" onClick={() => addSubQuestion(sIndex, qIndex)}>➕ Add Sub-question</Button>
                      </>
                    )}
                  </div>
                ))}

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
