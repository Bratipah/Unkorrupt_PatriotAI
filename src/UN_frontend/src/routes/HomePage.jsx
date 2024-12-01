import React, { useState, useEffect } from "react";
import {
  FaSun,
  FaMoon,
  FaChevronDown,
  FaChevronUp,
  FaBars,
  FaTimes,
} from "react-icons/fa"; // Import necessary icons
import { Link, useNavigate } from "react-router-dom";
import "./home.css";
import { IoSunnyOutline } from "react-icons/io5";

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to manage mobile menu toggle
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLoginClick = () => {
    navigate("/auth"); // Redirect to the authentication page
  };

  const [faqOpen, setFaqOpen] = useState([false, false, false, false]);

  const toggleFaq = (index) => {
    const newFaqOpen = faqOpen.map((item, i) => (i === index ? !item : false));
    setFaqOpen(newFaqOpen);
  };

  // Scroll to a section smoothly
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="hbody">
      <div className={`container ${darkMode ? "dark-mode" : ""}`}>
        <header className="header">
          <div className="logo">
            <img src="/patriot.png" alt="PatriotAi Logo" />
            <span className="patriot-ai">PatriotAi</span>
          </div>
          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? (
              <FaTimes size={24} color="#A020F0" />
            ) : (
              <FaBars size={24} color="#A020F0" />
            )}{" "}
            {/* Toggle between hamburger and close icon */}
          </button>
          <nav className={`nav ${isMenuOpen ? "active" : ""}`}>
            <a href="#" onClick={() => scrollToSection("hero")}>
              Home
            </a>
            <a href="#" onClick={() => scrollToSection("benefits")}>
              Benefits
            </a>
            <a href="https://forms.monday.com/forms/6848b3758ce5c92ec58acbc26ea8a0df?r=euc1"
            target="_blank" /* Open in a new tab */
            rel="noopener noreferrer" /* Security measure */
            >
              Contact Us
            </a>
          </nav>
          <button className="btn-primary" onClick={handleLoginClick}>
            Login
          </button>
          <div className="theme-toggle" onClick={toggleDarkMode}>
            {darkMode ? (
              <IoSunnyOutline size={24} color="#FFD700" />
            ) : (
              <FaMoon size={24} color="#4B0082" />
            )}
          </div>
        </header>

        <section id="hero" className="hero">
          <div className="hero-content">
            <h1>AI-driven learning and corruption fighting</h1>
            <p>
              PatriotAi is a decentralized platform leveraging on UN resources
              on corruption, ICP blockchain and AI to educate on corruption and
              collect data on corruption.
            </p>
            <div className="hero-actions">
              <Link to={"/coursePage"} className="btn-secondary">See Courses</Link>
              <a
                href="https://github.com/UNKORRUPT/UNKORRUPT"
                className="btn-link"
              >
                View on Github
              </a>
            </div>
          </div>
          <img src="/vr.png" alt="Hero" className="hero-image" />
        </section>

        <div className="partners">
          <img src="/un.png" alt="" />
          <img src="/ic.png" alt="" />
        </div>

        <section id="benefits" className="section-title">
          <div className="benefits1">
            <h2>PATRIOT AI BENEFITS</h2>
            <h3>Why PatriotAi?</h3>
            <p>
              PatriotAi is a free learning platform where you get to learn about
              corruption. We offer a variety of courses where you can interact
              with AI and ask any questions. You also get to report cases and
              earn rewards from quizzes.
            </p>
          </div>
          <div className="benefits">
            <img src="/roboto.png" alt="Hero" className="hero-image" />
            <div>
              <h3>We help you make a difference</h3>
              <ul>
                <li className="listing">
                  <img src="./coin.png" alt="" />
                  <div>
                    <strong>Understand corruption</strong>
                    <p>
                      We offer different courses to help you understand
                      corruption.
                    </p>
                  </div>
                </li>
                <li className="listing">
                  <img src="./coin.png" alt="" />
                  <div>
                    <strong>Fight corruption</strong>
                    <p>
                      Once you get it, you can make reports on the platform.
                      People learn from /respond to your data
                    </p>
                  </div>
                </li>
                <li className="listing">
                  <img src="./coin.png" alt="" />
                  <div>
                    <strong>Earn rewards</strong>
                    <p>For every successifully completed quize, you earn 10 patriot tokens!</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="testimonials">
          <h2>Testimonials</h2>
          <div className="testimonials-container">
            <div className="testimonial">
              <img src="/user1.jpg" alt="user" />
              <p>
                "I got to <p className="highlight">share</p>my story and I got a
                response asking if I want to share more details."
              </p>
              <strong>Sarah</strong>
              <span>UAE</span>
            </div>
            <div className="testimonial">
              <img src="/user1.jpg" alt="user" />
              <p>
                "PatriotAi has come in handy in my{" "}
                <p className="highlight">understanding</p> of corruption and how
                to identify it."
              </p>
              <strong>Daniel</strong>
              <span>Kenya</span>
            </div>
            <div className="testimonial">
              <img src="/user1.jpg" alt="user" />
              <p>
                "I can't wait to collect more{" "}
                <p className="highlight">tokens</p> in my next course. This is
                so much fun."
              </p>
              <strong>Khamla</strong>
              <span>South Africa</span>
            </div>
          </div>
        </section>

        <section className="faq">
          <h2>FAQ</h2>
          <p>
            Answer your customers possible questions here, it will increase the
            conversion rate as well as support or chat requests.
          </p>

          {[
            "Is PatriotAi completely free to use?",
            "Do I need to share my personal details?",
            "Can I commercialize the data from the reports?",
            "Do you offer technical support?",
          ].map((question, index) => (
            <div
              key={index}
              className={`faq-item ${faqOpen[index] ? "active" : ""}`}
            >
              <div className="faq-question" onClick={() => toggleFaq(index)}>
                {question}
                {faqOpen[index] ? <FaChevronUp /> : <FaChevronDown />}{" "}
                {/* Toggle arrow */}
              </div>
              {faqOpen[index] && (
                <div className="faq-answer">
                  <p>{getFaqAnswer(index)}</p>
                </div>
              )}
            </div>
          ))}
        </section>

        <section id="cta" className="cta">
          <h2>Ready for your first course?</h2>
          <p>Get started on your patriot journey.</p>
          <Link to={"/coursePage"} className="btn-primary">See Courses</Link>
        </section>

        <footer className="footer">
          <p>&copy; 2024 PatriotAi. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Product</a>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function getFaqAnswer(index) {
  const answers = [
    "Yes, PatriotAi is completely free to use.",
    "No, all you need is Internet Identity!",
    "Our data is open to policy makers, educators and patriots. Commercialization plans are not established yet.",
    "Yes, we offer technical support.",
  ];
  return answers[index];
}
