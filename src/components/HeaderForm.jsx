import { useState } from "react";

function HeaderForm() {
  const [header, setHeader] = useState({
    examName: "",
    subject: "",
    date: "",
  });

  return (
    <div className="card">
      <h3>📌 Paper Header</h3>
      <input
        type="text"
        placeholder="Exam Name"
        value={header.examName}
        onChange={(e) => setHeader({ ...header, examName: e.target.value })}
      />
      <input
        type="text"
        placeholder="Subject"
        value={header.subject}
        onChange={(e) => setHeader({ ...header, subject: e.target.value })}
      />
      <input
        type="date"
        value={header.date}
        onChange={(e) => setHeader({ ...header, date: e.target.value })}
      />
    </div>
  );
}

export default HeaderForm;
