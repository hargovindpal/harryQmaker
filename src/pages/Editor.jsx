import { useState } from "react";
import { generateDocx } from "../utils/docxGenerator";
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
      logo: null, // school logo
    },
    sections: [],
  });

  // Calculate Total Marks
  const calculateTotalMarks = () => {
    return paper.sections.reduce((total, section) => {
      return (
        total +
        section.questions.reduce(
          (secTotal, q) => secTotal + (parseInt(q.marks) || 0),
          0
        )
      );
    }, 0);
  };

  // Calculate Section Marks
  const calculateSectionMarks = (section) => {
    return section.questions.reduce(
      (sum, q) => sum + (parseInt(q.marks) || 0),
      0
    );
  };

  // Update header (except marks & logo, handled separately)
  const updateHeader = (e) => {
    if (e.target.name === "marks") return;
    setPaper({
      ...paper,
      header: { ...paper.header, [e.target.name]: e.target.value },
    });
  };

  // Handle Logo Upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaper({
          ...paper,
          header: { ...paper.header, logo: reader.result },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Section
  const addSection = () => {
    setPaper({
      ...paper,
      sections: [...paper.sections, { title: "", questions: [] }],
    });
  };

  // Delete Section
  const deleteSection = (index) => {
    const newSections = paper.sections.filter((_, i) => i !== index);
    setPaper({ ...paper, sections: newSections });
  };

  // Update Section Title
  const updateSection = (index, value) => {
    const newSections = [...paper.sections];
    newSections[index].title = value;
    setPaper({ ...paper, sections: newSections });
  };

  // Add Question (Normal or Objective)
  const addQuestion = (sectionIndex, type = "normal") => {
    const newSections = [...paper.sections];
    if (type === "objective") {
      newSections[sectionIndex].questions.push({
        type: "objective",
        text: "",
        options: ["", "", "", ""],
        marks: "",
      });
    } else {
      newSections[sectionIndex].questions.push({
        type: "normal",
        text: "",
        marks: "",
      });
    }
    setPaper({ ...paper, sections: newSections });
  };

  // Delete Question
  const deleteQuestion = (sectionIndex, qIndex) => {
    const newSections = [...paper.sections];
    newSections[sectionIndex].questions = newSections[sectionIndex].questions.filter(
      (_, i) => i !== qIndex
    );
    setPaper({ ...paper, sections: newSections });
  };

  // Update Question
  const updateQuestion = (sectionIndex, qIndex, field, value) => {
    const newSections = [...paper.sections];
    newSections[sectionIndex].questions[qIndex][field] = value;
    setPaper({ ...paper, sections: newSections });
  };

  // Update Objective Options
  const updateOption = (sectionIndex, qIndex, optionIndex, value) => {
    const newSections = [...paper.sections];
    newSections[sectionIndex].questions[qIndex].options[optionIndex] = value;
    setPaper({ ...paper, sections: newSections });
  };

  // 🖨 Print Function
  const handlePrint = () => {
    window.print();
  };

  // Auto-update marks
  const totalMarks = calculateTotalMarks();
  if (paper.header.marks !== totalMarks.toString()) {
    setPaper({
      ...paper,
      header: { ...paper.header, marks: totalMarks.toString() },
    });
  }

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-4">📄 Question Paper Generator</h2>

      {/* Total Marks */}
      <div className="alert alert-info text-center fs-5 fw-bold">
        🔢 Total Marks: {totalMarks}
      </div>

      {/* Header Form */}
      <div className="card shadow-lg border-0 rounded-4 p-4 mb-4">
        <h4 className="fw-bold mb-3 text-white bg-dark p-2 text-center">📝 Paper Header</h4>
        <div className="row g-3">
          {/* Logo Upload */}
          <div className="col-md-4 text-center">
            {paper.header.logo ? (
              <img
                src={paper.header.logo}
                alt="School Logo"
                className="img-fluid mb-2"
                style={{ maxHeight: "100px" }}
              />
            ) : (
              <div className="text-muted mb-2">No Logo Uploaded</div>
            )}
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleLogoUpload}
            />
          </div>

          {/* Other Header Fields */}
          {Object.keys(paper.header)
  .filter((key) => key !== "logo" && key !== "marks")  // ✅ exclude marks
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

      {/* Divider */}
      <hr className="my-4 border-2 border-dark" />

      {/* Sections with Accordion */}
      <Accordion defaultActiveKey="0">
        {paper.sections.map((section, sIndex) => {
          const sectionMarks = calculateSectionMarks(section);
          return (
            <Accordion.Item eventKey={sIndex.toString()} key={sIndex}>
              <Accordion.Header>
                {section.title || `Section ${sIndex + 1}`}{" "}
                <span className="ms-2 text-muted">
                  ({sectionMarks} Marks)
                </span>
              </Accordion.Header>
              <Accordion.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <input
                    type="text"
                    className="form-control fw-bold"
                    placeholder="Section Title (e.g., SECTION A)"
                    value={section.title}
                    onChange={(e) => updateSection(sIndex, e.target.value)}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => deleteSection(sIndex)}
                  >
                    ❌
                  </Button>
                </div>

                {/* Questions */}
                {section.questions.map((q, qIndex) => (
                  <div key={qIndex} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between">
                      <strong>
                        Q{qIndex + 1}{" "}
                        {q.marks && (
                          <span className="text-primary">[{q.marks} Marks]</span>
                        )}
                      </strong>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => deleteQuestion(sIndex, qIndex)}
                      >
                        🗑
                      </Button>
                    </div>

                    {q.type === "normal" ? (
                      <div className="row g-2 mt-2">
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Question"
                            value={q.text}
                            onChange={(e) =>
                              updateQuestion(sIndex, qIndex, "text", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-4">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Marks"
                            value={q.marks}
                            onChange={(e) =>
                              updateQuestion(sIndex, qIndex, "marks", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Objective Question */}
                        <input
                          type="text"
                          className="form-control mb-2 mt-2"
                          placeholder="Enter Objective Question"
                          value={q.text}
                          onChange={(e) =>
                            updateQuestion(sIndex, qIndex, "text", e.target.value)
                          }
                        />

                        {q.options.map((opt, optIndex) => (
                          <input
                            key={optIndex}
                            type="text"
                            className="form-control mb-2"
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt}
                            onChange={(e) =>
                              updateOption(sIndex, qIndex, optIndex, e.target.value)
                            }
                          />
                        ))}

                        <input
                          type="number"
                          className="form-control"
                          placeholder="Marks"
                          value={q.marks}
                          onChange={(e) =>
                            updateQuestion(sIndex, qIndex, "marks", e.target.value)
                          }
                        />
                      </>
                    )}
                  </div>
                ))}

                <div className="d-flex gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => addQuestion(sIndex, "normal")}
                  >
                    ➕ Add Normal Question
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => addQuestion(sIndex, "objective")}
                  >
                    ➕ Add Objective Question
                  </Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
      </Accordion>

      {/* Add Section Button */}
      <div className="text-center my-4">
        <Button variant="primary" onClick={addSection}>
          ➕ Add Section
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="text-center d-flex justify-content-center gap-3">
        <Button
          variant="success"
          size="lg"
          className="fw-bold px-5"
          onClick={() => generateDocx(paper)}
        >
          ⬇ Export as DOCX
        </Button>

        <Button
          variant="warning"
          size="lg"
          className="fw-bold px-5"
          onClick={handlePrint}
        >
          🖨 Print Paper
        </Button>
      </div>
    </div>
  );
}

export default Editor;
