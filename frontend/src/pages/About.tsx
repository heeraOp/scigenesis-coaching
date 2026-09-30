import "./../styles/pages.css";

function About() {
  return (
    <main className="page">

      <section className="page-hero">
        <div className="container page-hero-content">
          <span className="page-label">About SCI</span>

          <h1>
            Building strong foundations for science students.
          </h1>

          <p>
            SciGenesis Coaching Institute is a science-focused
            coaching institute specialising in in-person classes
            for students of Class XI and XII.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="container page-grid page-grid-2">

          <article className="page-card">
            <span className="page-card-label">
              Our Focus
            </span>

            <h2>
              Quality Guidance • Better Results • Bright Future
            </h2>

            <p>
              SCI provides focused classroom learning together
              with structured academic support, study materials
              and dedicated study sessions.
            </p>
          </article>

          <article className="page-card">
            <span className="page-card-label">
              Science Stream
            </span>

            <h2>
              Physics • Chemistry • Biology
            </h2>

            <p>
              The current academic offering focuses on science
              subjects for students studying under CBSE and COHSEM.
            </p>
          </article>

        </div>
      </section>

      <section className="page-section">
        <div className="container">

          <div className="page-card">
            <span className="page-card-label">
              What SCI Provides
            </span>

            <div className="page-grid page-grid-3">

              <div>
                <h3>Audio-Visual Classes</h3>
                <p>
                  Interactive classroom learning supported by
                  multimedia presentations.
                </p>
              </div>

              <div>
                <h3>Printed Study Materials</h3>
                <p>
                  Learning and reference materials to support
                  classroom study.
                </p>
              </div>

              <div>
                <h3>Experienced Faculties</h3>
                <p>
                  Guidance from experienced teaching faculty.
                </p>
              </div>

              <div>
                <h3>Compulsory Study Sessions</h3>
                <p>
                  Structured sessions supporting regular
                  academic preparation.
                </p>
              </div>

              <div>
                <h3>Affordable Fees</h3>
                <p>
                  A coaching option designed with affordability
                  in mind.
                </p>
              </div>

              <div>
                <h3>Specific Route Van Service</h3>
                <p>
                  Van service is available on specific routes
                  for student convenience.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

    </main>
  );
}

export default About;