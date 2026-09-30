import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <header className="site-header">
      <div className="container navbar">

        {/* Brand */}
        <NavLink to="/" className="brand">
          <div className="brand-mark">
            SCI
          </div>

          <div className="brand-text">
            <strong>SciGenesis Coaching Institute</strong>

            <span>
              Quality Guidance • Better Results • Bright Future
            </span>
          </div>
        </NavLink>

        {/* Main Navigation */}
        <nav className="nav-links">

          <NavLink
            to="/"
            end
          >
            Home
          </NavLink>

          <NavLink to="/about">
            About
          </NavLink>

          <NavLink to="/courses">
            Courses
          </NavLink>

          <NavLink to="/notices">
            Notices
          </NavLink>

          <NavLink to="/materials">
            Study Materials
          </NavLink>

          <NavLink to="/gallery">
            Gallery
          </NavLink>

          <NavLink to="/contact">
            Contact
          </NavLink>

        </nav>

        {/* Enquiry CTA */}
        <NavLink
          to="/enquiry"
          className="nav-cta"
        >
          Submit Enquiry
        </NavLink>

      </div>
    </header>
  );
}

export default Navbar;