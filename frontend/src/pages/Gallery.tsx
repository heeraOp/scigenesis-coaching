import { useEffect, useMemo, useState } from "react";
import "./../styles/pages.css";
import "./Gallery.css";

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

interface GalleryItem {
  gallery_id: string;
  created_at?: string;
  title: string;
  description?: string;
  category: string;
  image_file_id?: string;
  image_url?: string;
  image_name?: string;
  status: string;
  display_order?: number | string;
  updated_at?: string;
}

function getDriveFallbackUrl(fileId?: string): string {
  if (!fileId) {
    return "";
  }

  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
    fileId
  )}`;
}

function handleGalleryImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  item: GalleryItem
) {
  const image = event.currentTarget;

  const fallbackUrl = getDriveFallbackUrl(item.image_file_id);

  /*
   * Try the Google Drive direct-view URL once.
   * This prevents an infinite onError loop.
   */
  if (
    fallbackUrl &&
    image.dataset.fallbackApplied !== "true"
  ) {
    image.dataset.fallbackApplied = "true";
    image.src = fallbackUrl;
    return;
  }

  /*
   * If both URLs fail, hide the broken image
   * and allow the surrounding card to remain usable.
   */
  image.style.display = "none";
}

function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(
    null
  );

  async function loadGallery() {
    try {
      setLoading(true);
      setError("");

      if (!API_URL) {
        throw new Error("VITE_APPS_SCRIPT_URL is not configured.");
      }

      const response = await fetch(`${API_URL}?action=getGallery`);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load gallery.");
      }

      setItems(Array.isArray(data.gallery) ? data.gallery : []);
    } catch (err) {
      console.error("Failed to load gallery:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load gallery."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGallery();
  }, []);

  const categories = useMemo(() => {
    const values = items
      .map((item) => item.category?.trim())
      .filter(Boolean);

    return ["ALL", ...Array.from(new Set(values))];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "ALL") {
      return items;
    }

    return items.filter(
      (item) => item.category?.trim() === activeCategory
    );
  }, [items, activeCategory]);

  return (
    <main className="page">
      <section className="page-hero gallery-hero">
        <div className="container page-hero-content">
          <span className="page-label">Gallery</span>

          <h1>Life at SciGenesis.</h1>

          <p>
            Explore photographs and moments from SCI classes, activities,
            achievements and events.
          </p>
        </div>
      </section>

      <section className="page-section gallery-section">
        <div className="container">
          {loading && (
            <div className="gallery-status-card">
              <div className="gallery-spinner" aria-hidden="true" />
              <p>Loading gallery...</p>
            </div>
          )}

          {!loading && error && (
            <div className="gallery-status-card gallery-error">
              <h3>Unable to load gallery</h3>

              <p>{error}</p>

              <button
                type="button"
                className="page-button page-button-primary"
                onClick={loadGallery}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="empty-state">
              <h3>Gallery is being prepared</h3>

              <p>
                Photos published by SciGenesis Coaching Institute will appear
                here.
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <div className="gallery-toolbar">
                <div>
                  <span className="page-card-label">
                    SCI Moments
                  </span>

                  <h2>
                    Memories from our learning journey.
                  </h2>
                </div>

                <div
                  className="gallery-filters"
                  aria-label="Gallery categories"
                >
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={
                        activeCategory === category
                          ? "gallery-filter active"
                          : "gallery-filter"
                      }
                      onClick={() => setActiveCategory(category)}
                    >
                      {category === "ALL"
                        ? "All"
                        : category}
                    </button>
                  ))}
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <h3>No photos in this category</h3>

                  <p>
                    Choose another category to explore the gallery.
                  </p>
                </div>
              ) : (
                <div className="gallery-grid">
                  {filteredItems.map((item) => (
                    <article
                      className="gallery-card"
                      key={item.gallery_id}
                    >
                      <button
                        type="button"
                        className="gallery-image-button"
                        onClick={() => setSelectedImage(item)}
                        aria-label={`Open ${item.title}`}
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={
                              item.title ||
                              "SCI gallery photo"
                            }
                            loading="lazy"
                            onError={(event) =>
                              handleGalleryImageError(
                                event,
                                item
                              )
                            }
                          />
                        ) : (
                          <div className="gallery-image-placeholder">
                            No image
                          </div>
                        )}

                        <span className="gallery-view-badge">
                          View
                        </span>
                      </button>

                      <div className="gallery-card-body">
                        <span className="gallery-category">
                          {item.category}
                        </span>

                        <h3>{item.title}</h3>

                        {item.description && (
                          <p>{item.description}</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {selectedImage && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.title}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="gallery-lightbox-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="gallery-lightbox-close"
              onClick={() => setSelectedImage(null)}
              aria-label="Close image"
            >
              ×
            </button>

            {selectedImage.image_url && (
              <img
                src={selectedImage.image_url}
                alt={
                  selectedImage.title ||
                  "SCI gallery photo"
                }
                onError={(event) =>
                  handleGalleryImageError(
                    event,
                    selectedImage
                  )
                }
              />
            )}

            <div className="gallery-lightbox-caption">
              <span>{selectedImage.category}</span>

              <h2>{selectedImage.title}</h2>

              {selectedImage.description && (
                <p>{selectedImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Gallery;