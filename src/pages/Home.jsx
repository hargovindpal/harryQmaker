import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaInstagram } from "react-icons/fa";

function Home() {
  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        background:
          "linear-gradient(135deg, #6D28D9 0%, #9333EA 40%, #EC4899 100%)",
        color: "#fff",
      }}
    >
      {/* ===== HEADER ===== */}
      <header className="py-3 bg-transparent text-center border-bottom border-white border-opacity-25">
        <h3 className="fw-bold m-0 text-uppercase letter-spacing-1">
          🌐 Harry Digital Dose
        </h3>
        <p className="text-white-50 small m-0">
          Smart Tools for Smart Educators
        </p>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div
          className="bg-white bg-opacity-10 backdrop-blur-lg p-5 rounded-4 shadow-lg text-center"
          style={{
            maxWidth: "700px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          }}
        >
          <h1 className="fw-bold display-5 mb-3 text-uppercase text-white">
            📚 Question Paper Generator
          </h1>

          <p className="lead text-light mb-4">
            Create, customize, and export dynamic question papers effortlessly.
          </p>

          <Link
            to="/editor"
            className="btn btn-lg btn-light px-5 py-2 fw-semibold shadow-sm border-0 mb-3"
            style={{
              borderRadius: "50px",
              color: "#4B0082",
              background:
                "linear-gradient(90deg, #f9fafb 0%, #e5e7eb 100%)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.target.style.background =
                "linear-gradient(90deg, #C084FC 0%, #E879F9 100%)")
            }
            onMouseLeave={(e) =>
              (e.target.style.background =
                "linear-gradient(90deg, #f9fafb 0%, #e5e7eb 100%)")
            }
          >
            ✏️ Start Creating
          </Link>

          <hr className="border-light opacity-50 my-4" />

          <div className="text-start px-3">
            <h5 className="fw-bold text-light mb-3 text-center">
              ✨ Features
            </h5>
            <ul className="list-unstyled text-light small">
              <li className="mb-2">➕ Add unlimited sections and questions</li>
              <li className="mb-2">
                🏫 Customize headers with school, subject & exam details
              </li>
              <li className="mb-2">⬇ Export directly as a DOCX file</li>
              <li className="mb-2">🖨 Print question papers instantly</li>
            </ul>
          </div>

          {/* Instagram Follow Button */}
          <a
            href="https://www.instagram.com/digitaldose_official"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-light d-inline-flex align-items-center gap-2 mt-3"
            style={{
              borderRadius: "50px",
              borderWidth: "2px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#fff";
              e.target.style.color = "#E1306C";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = "#fff";
            }}
          >
            <FaInstagram size={18} />
            Follow on Instagram
          </a>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="py-3 text-center border-top border-white border-opacity-25 mt-auto">
        <p className="text-white-50 small m-0">
          © {new Date().getFullYear()} Digital Dose | Designed by Harry
        </p>
      </footer>
    </div>
  );
}

export default Home;
