import "./../styles/pages.css";

function CoachingInfo() {
  return (
    <main className="page">

      <section className="page-hero">
        <div className="container page-hero-content">
          <span className="page-label">
            Coaching Info
          </span>

          <h1>
            SciGenesis Coaching Institute
          </h1>

          <p>
            Quality Guidance • Better Results • Bright Future
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="container page-grid page-grid-2">

          <article className="page-card">

            <span className="page-card-label">
              Institute
            </span>

            <div className="info-list">

              <div className="info-row">
                <span>Name</span>
                <strong>
                  SciGenesis Coaching Institute
                </strong>
              </div>

              <div className="info-row">
                <span>Short Name</span>
                <strong>SCI</strong>
              </div>

              <div className="info-row">
                <span>Focus</span>
                <strong>
                  Class XI & XII • Science
                </strong>
              </div>

              <div className="info-row">
                <span>Mode</span>
                <strong>
                  In-person classes
                </strong>
              </div>

            </div>

          </article>

          <article className="page-card">

            <span className="page-card-label">
              Location & Contact
            </span>

            <div className="info-list">

              <div className="info-row">
                <span>Address</span>
                <strong>
                  Kwakeithel Soibam Leikai,
                  Near Water Reservoir /
                  Photon School,
                  Imphal-795001
                </strong>
              </div>

              <div className="info-row">
                <span>Phone</span>
                <strong>
                  +91 70856 37173
                </strong>
              </div>

              <div className="info-row">
                <span>Email</span>
                <strong>
                  scigenesiscoachinginstitute@gmail.com
                </strong>
              </div>

            </div>

          </article>

        </div>
      </section>

    </main>
  );
}

export default CoachingInfo;