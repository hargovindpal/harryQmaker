import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="container text-center py-5">
      {/* Title */}
      <h1 className="fw-bold display-4 mb-3">📚 Question Paper Generator</h1>

      {/* Subtitle */}
      <p className="lead text-muted mb-4">
        Create, customize, and export dynamic question papers with ease.
      </p>

      {/* CTA Button */}
      <Link to="/editor" className="btn btn-primary btn-lg px-4 fw-bold shadow">
        ✏️ Start Creating
      </Link>

      {/* Info section */}
      <div className="mt-5">
        <h5 className="fw-bold">✨ Features:</h5>
        <ul className="list-unstyled text-muted">
          <li>➕ Add unlimited sections and questions</li>
          <li>📝 Customize headers with school, subject, exam info</li>
          <li>⬇ Export directly as a DOCX file</li>
          <li>🖨 Print papers instantly</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
