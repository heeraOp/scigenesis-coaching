import { NavLink } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">

      <div className="container footer-content">

        {/* Brand */}
        <div className="footer-brand">

          <NavLink to="/" className="footer-brand-link">
            <div className="footer-mark">
              SCI
            </div>

            <div>
              <h3>SciGenesis Coaching Institute</h3>

              <p>
                Quality Guidance • Better Results • Bright Future
              </p>
            </div>
          </NavLink>

        </div>

        {/* Navigation */}
        <div className="footer-links">

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

          <NavLink to="/enquiry">
            Submit Enquiry
          </NavLink>

        </div>

      </div>

      {/* Contact Information */}
      <div className="container footer-contact">

        <p>
          📍 Kwakeithel Soibam Leikai, Near Water Reservoir /
          Photon School, Imphal-795001
        </p>

        <a href="tel:+917085637173">
          📞 +91 70856 37173
        </a>

        <a href="mailto:scigenesiscoachinginstitute@gmail.com">
          ✉ scigenesiscoachinginstitute@gmail.com
        </a>

      </div>

      {/* Bottom */}
      <div className="container footer-bottom">

        <p>
          © {new Date().getFullYear()} SciGenesis Coaching Institute.
          All rights reserved.
        </p>

        <p>
          Class XI & XII • Science
        </p>

      </div>

    </footer>
  );
}

export default Footer;