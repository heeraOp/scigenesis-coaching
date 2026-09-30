import { useEffect, useMemo, useState } from "react";
import "./StudyMaterials.css";

interface StudyMaterial {
  material_id: string;
  created_at?: string;
  title: string;
  class_level: string;
  subject: string;
  description?: string;
  file_id?: string;
  file_url?: string;
  file_name?: string;
  status: string;
  display_order?: number | string;
  updated_at?: string;
}

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

const SUBJECTS = ["Physics", "Chemistry", "Biology"];

function formatDate(value?: string): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StudyMaterials() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMaterials() {
    if (!API_URL) {
      setError("Study materials service is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}?action=getMaterials`
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to load study materials."
        );
      }

      setMaterials(
        Array.isArray(data.materials) ? data.materials : []
      );
    } catch (loadError) {
      console.error("Failed to load study materials:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load study materials."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  const classOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        materials
          .map((material) => material.class_level)
          .filter(Boolean)
      )
    );

    return values.sort();
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesClass =
        selectedClass === "ALL" ||
        material.class_level === selectedClass;

      const matchesSubject =
        selectedSubject === "ALL" ||
        material.subject === selectedSubject;

      return matchesClass && matchesSubject;
    });
  }, [materials, selectedClass, selectedSubject]);

  const groupedMaterials = useMemo(() => {
    return filteredMaterials.reduce<Record<string, StudyMaterial[]>>(
      (groups, material) => {
        const key = material.class_level || "Other";

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(material);
        return groups;
      },
      {}
    );
  }, [filteredMaterials]);

  return (
    <main className="study-materials-page">
      <section className="study-materials-hero">
        <div className="study-materials-container">
          <div className="study-materials-hero-content">
            <span className="study-materials-eyebrow">
              SCI • Study Materials
            </span>

            <h1>
              Learning resources
              <br />
              for SCI students.
            </h1>

            <p>
              Access class-wise and subject-wise study materials,
              notes and academic resources published by SciGenesis
              Coaching Institute.
            </p>
          </div>

          <div className="study-materials-hero-mark" aria-hidden="true">
            <span>SCI</span>
            <small>LEARN</small>
          </div>
        </div>
      </section>

      <section className="study-materials-library">
        <div className="study-materials-container">
          <div className="study-materials-section-header">
            <div>
              <span className="study-materials-section-label">
                Resource Library
              </span>

              <h2>Find what you need.</h2>

              <p>
                Choose a class or subject to quickly find the right
                learning resource.
              </p>
            </div>

            <div className="study-materials-count">
              <strong>{filteredMaterials.length}</strong>
              <span>
                {filteredMaterials.length === 1
                  ? "resource"
                  : "resources"}
              </span>
            </div>
          </div>

          <div className="study-materials-filters">
            <div className="study-materials-filter-group">
              <span>Class</span>

              <div className="study-materials-filter-pills">
                <button
                  type="button"
                  className={
                    selectedClass === "ALL"
                      ? "active"
                      : ""
                  }
                  onClick={() => setSelectedClass("ALL")}
                >
                  All
                </button>

                {classOptions.map((classLevel) => (
                  <button
                    key={classLevel}
                    type="button"
                    className={
                      selectedClass === classLevel
                        ? "active"
                        : ""
                    }
                    onClick={() => setSelectedClass(classLevel)}
                  >
                    Class {classLevel}
                  </button>
                ))}
              </div>
            </div>

            <div className="study-materials-filter-group">
              <span>Subject</span>

              <div className="study-materials-filter-pills">
                <button
                  type="button"
                  className={
                    selectedSubject === "ALL"
                      ? "active"
                      : ""
                  }
                  onClick={() => setSelectedSubject("ALL")}
                >
                  All
                </button>

                {SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    className={
                      selectedSubject === subject
                        ? "active"
                        : ""
                    }
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="study-materials-state">
              <div className="study-materials-spinner" />
              <h3>Loading study materials</h3>
              <p>
                Please wait while we fetch the latest resources.
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="study-materials-state study-materials-state-error">
              <div className="study-materials-state-icon">!</div>
              <h3>Unable to load materials</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={loadMaterials}
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && materials.length === 0 && (
            <div className="study-materials-state">
              <div className="study-materials-state-icon">PDF</div>
              <h3>No study materials published yet</h3>
              <p>
                New resources published by SCI will appear here.
              </p>
            </div>
          )}

          {!isLoading &&
            !error &&
            materials.length > 0 &&
            filteredMaterials.length === 0 && (
              <div className="study-materials-state">
                <div className="study-materials-state-icon">—</div>
                <h3>No matching resources</h3>
                <p>
                  Try a different class or subject filter.
                </p>
              </div>
            )}

          {!isLoading &&
            !error &&
            filteredMaterials.length > 0 && (
              <div className="study-materials-groups">
                {Object.entries(groupedMaterials).map(
                  ([classLevel, classMaterials]) => (
                    <section
                      className="study-materials-class-section"
                      key={classLevel}
                    >
                      <div className="study-materials-class-heading">
                        <div>
                          <span>CLASS</span>
                          <h3>Class {classLevel}</h3>
                        </div>

                        <span>
                          {classMaterials.length}{" "}
                          {classMaterials.length === 1
                            ? "resource"
                            : "resources"}
                        </span>
                      </div>

                      <div className="study-materials-grid">
                        {classMaterials.map((material) => (
                          <article
                            className="study-material-card"
                            key={material.material_id}
                          >
                            <div className="study-material-card-top">
                              <div className="study-material-pdf">
                                PDF
                              </div>

                              <span className="study-material-subject">
                                {material.subject}
                              </span>
                            </div>

                            <div className="study-material-card-body">
                              <h4>{material.title}</h4>

                              {material.description && (
                                <p>{material.description}</p>
                              )}

                              <div className="study-material-meta">
                                <span>
                                  Published{" "}
                                  {formatDate(
                                    material.updated_at ||
                                      material.created_at
                                  )}
                                </span>

                                {material.file_name && (
                                  <span
                                    title={material.file_name}
                                  >
                                    {material.file_name}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="study-material-card-footer">
                              {material.file_url ? (
                                <a
                                  href={material.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open PDF
                                  <span aria-hidden="true">↗</span>
                                </a>
                              ) : (
                                <span className="study-material-unavailable">
                                  File unavailable
                                </span>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )
                )}
              </div>
            )}
        </div>
      </section>
    </main>
  );
}

export default StudyMaterials;
