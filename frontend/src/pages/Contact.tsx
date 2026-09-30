import "./../styles/pages.css";

function Contact() {
  return (
    <main className="page">

      <section className="page-hero">
        <div className="container page-hero-content">
          <span className="page-label">
            Contact SCI
          </span>

          <h1>
            Get in touch with SciGenesis.
          </h1>

          <p>
            Contact the institute for course information,
            admissions and other enquiries.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="container page-grid page-grid-3">

          <div className="page-card">
            <span className="page-card-label">
              Phone
            </span>

            <h3>
              +91 70856 37173
            </h3>

            <a
              href="tel:+917085637173"
              className="page-button page-button-primary"
            >
              Call SCI
            </a>
          </div>

          <div className="page-card">
            <span className="page-card-label">
              Email
            </span>

            <h3>
              scigenesiscoachinginstitute@gmail.com
            </h3>

            <a
              href="mailto:scigenesiscoachinginstitute@gmail.com"
              className="page-button page-button-primary"
            >
              Send Email
            </a>
          </div>

          <div className="page-card">
            <span className="page-card-label">
              Location
            </span>

            <h3>
              Imphal
            </h3>

            <p>
              Kwakeithel Soibam Leikai, Near Water Reservoir /
              Photon School, Imphal-795001
            </p>
          </div>

        </div>
      </section>

    </main>
  );
}

export default Contact;