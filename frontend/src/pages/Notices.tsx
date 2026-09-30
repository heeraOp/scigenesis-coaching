import { useEffect, useState } from "react";
import "./Notices.css";

interface Notice {
  notice_id: string;
  created_at?: string;
  title: string;
  description: string;
  attachment_file_id?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  status: string;
}

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

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

function formatTime(value?: string): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isImageAttachment(notice: Notice): boolean {
  return Boolean(notice.attachment_type?.startsWith("image/"));
}

function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotices() {
    if (!API_URL) {
      setError("Notice service is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Public endpoint intentionally requests published notices only.
      const response = await fetch(`${API_URL}?action=getNotices`);

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}.`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to load notices."
        );
      }

      const publishedNotices = Array.isArray(data.notices)
        ? data.notices
        : [];

      setNotices(publishedNotices);
    } catch (requestError) {
      console.error(
        "Failed to load public notices:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load notices."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  return (
    <main className="notices-page">
      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="notices-hero">
        <div className="container notices-hero-content">
          <div className="notices-hero-copy">
            <span className="notices-eyebrow">
              <span className="notices-eyebrow-dot" />
              SCI • Official Updates
            </span>

            <h1>
              Stay informed.
              <span> Stay connected.</span>
            </h1>

            <p>
              Important announcements, academic updates and
              institute information from SciGenesis Coaching
              Institute.
            </p>
          </div>

          <div className="notices-hero-mark" aria-hidden="true">
            <div className="notices-hero-mark-ring">
              <span className="notices-bell-icon">⌁</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
          ===================================================== */}
      <section className="notices-section">
        <div className="container">
          <div className="notices-section-heading">
            <div>
              <span className="notices-section-label">
                Latest Updates
              </span>

              <h2>Announcements from SCI</h2>

              <p>
                Check here regularly for the latest notices
                published by the institute.
              </p>
            </div>

            {!isLoading && !error && notices.length > 0 && (
              <div className="notices-count">
                <strong>{notices.length}</strong>
                <span>
                  {notices.length === 1
                    ? "Published Notice"
                    : "Published Notices"}
                </span>
              </div>
            )}
          </div>

          {/* =================================================
              LOADING
              ================================================= */}
          {isLoading && (
            <div className="notices-state">
              <div className="notices-loading-icon">
                <span />
                <span />
                <span />
              </div>

              <h3>Loading latest notices</h3>

              <p>
                Please wait while we retrieve the latest
                announcements.
              </p>
            </div>
          )}

          {/* =================================================
              ERROR
              ================================================= */}
          {!isLoading && error && (
            <div className="notices-state notices-state-error">
              <div className="notices-state-icon">!</div>

              <h3>Unable to load notices</h3>

              <p>{error}</p>

              <button
                type="button"
                className="notices-button notices-button-primary"
                onClick={loadNotices}
              >
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              EMPTY
              ================================================= */}
          {!isLoading && !error && notices.length === 0 && (
            <div className="notices-state notices-state-empty">
              <div className="notices-state-icon">⌁</div>

              <h3>No published notices yet</h3>

              <p>
                New announcements published by the institute
                will appear here.
              </p>
            </div>
          )}

          {/* =================================================
              NOTICE LIST
              ================================================= */}
          {!isLoading && !error && notices.length > 0 && (
            <div className="notices-list">
              {notices.map((notice, index) => {
                const hasImage = isImageAttachment(notice);

                return (
                  <article
                    key={notice.notice_id}
                    className="notice-card"
                  >
                    {/* Timeline marker */}
                    <div className="notice-timeline" aria-hidden="true">
                      <span className="notice-timeline-dot" />
                      {index < notices.length - 1 && (
                        <span className="notice-timeline-line" />
                      )}
                    </div>

                    <div className="notice-card-inner">
                      {/* Header */}
                      <header className="notice-card-header">
                        <div className="notice-card-heading">
                          <span className="notice-badge">
                            <span className="notice-badge-icon">
                              •
                            </span>
                            Official Notice
                          </span>

                          <h2>{notice.title}</h2>
                        </div>

                        {notice.created_at && (
                          <time
                            className="notice-date"
                            dateTime={notice.created_at}
                          >
                            <span className="notice-date-day">
                              {new Date(
                                notice.created_at
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                              })}
                            </span>

                            <span className="notice-date-info">
                              <strong>
                                {new Date(
                                  notice.created_at
                                ).toLocaleDateString("en-IN", {
                                  month: "short",
                                })}
                              </strong>

                              <small>
                                {new Date(
                                  notice.created_at
                                ).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                })}
                              </small>
                            </span>
                          </time>
                        )}
                      </header>

                      {/* Description */}
                      <div className="notice-description">
                        <p>{notice.description}</p>
                      </div>

                      {/* Attachment */}
                      {notice.attachment_url && (
                        <div className="notice-attachment">
                          {hasImage ? (
                            <>
                              <a
                                href={notice.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="notice-image-link"
                                aria-label={`Open attachment for ${notice.title}`}
                              >
                                <img
                                  src={notice.attachment_url}
                                  alt={
                                    notice.attachment_name ||
                                    notice.title
                                  }
                                  className="notice-image"
                                  loading="lazy"
                                />

                                <span className="notice-image-overlay">
                                  <span>Open image</span>
                                  <span className="notice-open-arrow">
                                    ↗
                                  </span>
                                </span>
                              </a>

                              <div className="notice-attachment-footer">
                                <div className="notice-file-info">
                                  <span className="notice-file-icon">
                                    IMG
                                  </span>

                                  <div>
                                    <strong>
                                      {notice.attachment_name ||
                                        "Image attachment"}
                                    </strong>

                                    <span>
                                      Institute attachment
                                    </span>
                                  </div>
                                </div>

                                <a
                                  href={notice.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="notices-button notices-button-secondary"
                                >
                                  View Attachment
                                  <span>↗</span>
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="notice-file-card">
                              <div className="notice-file-info">
                                <span className="notice-file-icon notice-pdf-icon">
                                  PDF
                                </span>

                                <div>
                                  <strong>
                                    {notice.attachment_name ||
                                      "Notice attachment"}
                                  </strong>

                                  <span>
                                    Official document • Tap to view
                                  </span>
                                </div>
                              </div>

                              <a
                                href={notice.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="notices-button notices-button-primary"
                              >
                                View Document
                                <span>↗</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <footer className="notice-card-footer">
                        <span>
                          Published by SciGenesis Coaching Institute
                        </span>

                        {notice.created_at && (
                          <span className="notice-published-time">
                            {formatDate(notice.created_at)}
                            {formatTime(notice.created_at)
                              ? ` • ${formatTime(
                                  notice.created_at
                                )}`
                              : ""}
                          </span>
                        )}
                      </footer>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Notices;
