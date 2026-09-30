import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
  SyntheticEvent,
} from "react";

import "./../styles/pages.css";
import "./ManageGallery.css";
import { getSessionToken } from "../services/auth";

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

const CATEGORIES = [
  "Classes",
  "Events",
  "Achievements",
  "Activities",
  "Campus",
  "Other",
];

type GalleryStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface GalleryItem {
  gallery_id: string;
  created_at?: string;
  title: string;
  description?: string;
  category: string;
  image_file_id?: string;
  image_url?: string;
  image_name?: string;
  status: GalleryStatus | string;
  display_order?: number | string;
  updated_at?: string;
}

interface GalleryForm {
  gallery_id: string;
  title: string;
  description: string;
  category: string;
  image_file_id: string;
  image_url: string;
  image_name: string;
  status: GalleryStatus;
  display_order: string;
}

const EMPTY_FORM: GalleryForm = {
  gallery_id: "",
  title: "",
  description: "",
  category: "",
  image_file_id: "",
  image_url: "",
  image_name: "",
  status: "DRAFT",
  display_order: "",
};

/* =========================================================
   GOOGLE DRIVE IMAGE HELPERS
   ========================================================= */

/**
 * Build a fallback Google Drive URL from the stored file ID.
 *
 * Primary URL:
 *   https://drive.google.com/thumbnail?id=FILE_ID&sz=w1600
 *
 * Fallback URL:
 *   https://drive.google.com/uc?export=view&id=FILE_ID
 */
function getDriveFallbackUrl(fileId?: string): string {
  if (!fileId) {
    return "";
  }

  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
    fileId
  )}`;
}

/**
 * Handle a failed gallery image.
 *
 * First failure:
 *   Try Google Drive direct-view URL.
 *
 * Second failure:
 *   Hide the broken image.
 *
 * The data-fallback-applied attribute prevents
 * an infinite onError loop.
 */
function handleGalleryImageError(
  event: SyntheticEvent<HTMLImageElement>,
  item: GalleryItem
): void {
  const image = event.currentTarget;

  const fallbackUrl = getDriveFallbackUrl(
    item.image_file_id
  );

  if (
    fallbackUrl &&
    image.dataset.fallbackApplied !== "true"
  ) {
    image.dataset.fallbackApplied = "true";
    image.src = fallbackUrl;
    return;
  }

  image.style.display = "none";
}

/**
 * Handle a failed image when editing an item.
 */
function handlePreviewImageError(
  event: SyntheticEvent<HTMLImageElement>,
  fileId?: string
): void {
  const image = event.currentTarget;

  const fallbackUrl = getDriveFallbackUrl(fileId);

  if (
    fallbackUrl &&
    image.dataset.fallbackApplied !== "true"
  ) {
    image.dataset.fallbackApplied = "true";
    image.src = fallbackUrl;
    return;
  }

  image.style.display = "none";
}

/* =========================================================
   COMPONENT
   ========================================================= */

function ManageGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [form, setForm] = useState<GalleryForm>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  /* =======================================================
     LOAD GALLERY
     ======================================================= */

  async function loadGallery() {
    try {
      setLoading(true);
      setError("");

      if (!API_URL) {
        throw new Error(
          "VITE_APPS_SCRIPT_URL is not configured."
        );
      }

      const sessionToken =
        getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}?action=getGallery&include_all=true&session_token=${encodeURIComponent(
          sessionToken
        )}`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Failed to load gallery."
        );
      }

      setItems(
        Array.isArray(data.gallery)
          ? data.gallery
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load teacher gallery:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load gallery."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGallery();
  }, []);

  /* =======================================================
     CLEANUP PREVIEW URL
     ======================================================= */

  useEffect(() => {
    return () => {
      if (
        previewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);

  /* =======================================================
     RESET FORM
     ======================================================= */

  function resetForm() {
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setMessage("");
  }

  /* =======================================================
     EDIT ITEM
     ======================================================= */

  function editItem(item: GalleryItem) {
    setForm({
      gallery_id:
        item.gallery_id || "",

      title:
        item.title || "",

      description:
        item.description || "",

      category:
        item.category || "",

      image_file_id:
        item.image_file_id || "",

      image_url:
        item.image_url || "",

      image_name:
        item.image_name || "",

      status:
        item.status === "PUBLISHED" ||
        item.status === "ARCHIVED"
          ? item.status
          : "DRAFT",

      display_order:
        item.display_order ===
          undefined ||
        item.display_order === null
          ? ""
          : String(
              item.display_order
            ),
    });

    setSelectedFile(null);

    setPreviewUrl(
      item.image_url || ""
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =======================================================
     FILE SELECTION
     ======================================================= */

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setSelectedFile(null);

      setError(
        "Only image files are allowed."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setSelectedFile(null);

      setError(
        "Image is too large. Maximum allowed size is 5 MB."
      );

      return;
    }

    setError("");

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(file)
    );
  }

  /* =======================================================
     UPDATE FORM
     ======================================================= */

  function updateForm<
    K extends keyof GalleryForm
  >(
    field: K,
    value: GalleryForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =======================================================
     FILE → BASE64
     ======================================================= */

  function fileToBase64(
    file: File
  ): Promise<string> {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          if (
            typeof reader.result !==
            "string"
          ) {
            reject(
              new Error(
                "Unable to read image file."
              )
            );

            return;
          }

          resolve(
            reader.result
          );
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Unable to read image file."
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  }

  /* =======================================================
     UPLOAD IMAGE
     ======================================================= */

  async function uploadImage(
    file: File
  ) {
    const base64 =
      await fileToBase64(file);

    const sessionToken =
      getSessionToken();

    if (!sessionToken) {
      throw new Error(
        "Authentication required. Please log in again."
      );
    }

    const response =
      await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8",
        },

        body: JSON.stringify({
          action:
            "uploadGalleryImage",

          session_token:
            sessionToken,

          fileName:
            file.name,

          mimeType:
            file.type,

          base64,
        }),
      });

    if (!response.ok) {
      throw new Error(
        `Image upload failed: HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        data.error ||
          "Image upload failed."
      );
    }

    return {
      fileId: String(
        data.file_id || ""
      ),

      imageUrl: String(
        data.image_url ||
          data.file_url ||
          ""
      ),

      fileName: String(
        data.file_name ||
          file.name
      ),
    };
  }

  /* =======================================================
     SAVE GALLERY ITEM
     ======================================================= */

  async function saveGalleryItem(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!API_URL) {
      setError(
        "VITE_APPS_SCRIPT_URL is not configured."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      let imageFileId =
        form.image_file_id;

      let imageUrl =
        form.image_url;

      let imageName =
        form.image_name;

      /* ---------------------------------------------------
         UPLOAD NEW IMAGE
         --------------------------------------------------- */

      if (selectedFile) {
        setMessage(
          "Uploading image to Google Drive..."
        );

        const uploaded =
          await uploadImage(
            selectedFile
          );

        imageFileId =
          uploaded.fileId;

        imageUrl =
          uploaded.imageUrl;

        imageName =
          uploaded.fileName;
      }

      setMessage(
        "Saving gallery item..."
      );

      const sessionToken =
        getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

      /* ---------------------------------------------------
         SAVE TO GOOGLE SHEETS
         --------------------------------------------------- */

      const response =
        await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8",
          },

          body: JSON.stringify({
            action:
              "saveGallery",

            session_token:
              sessionToken,

            gallery: {
              ...form,

              image_file_id:
                imageFileId,

              image_url:
                imageUrl,

              image_name:
                imageName,

              display_order:
                form.display_order.trim() ===
                ""
                  ? ""
                  : Number(
                      form.display_order
                    ),
            },
          }),
        });

      if (!response.ok) {
        throw new Error(
          `Save failed: HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Failed to save gallery item."
        );
      }

      setMessage(
        form.gallery_id
          ? "Gallery item updated successfully."
          : "Gallery item created successfully."
      );

      resetForm();

      await loadGallery();
    } catch (err) {
      console.error(
        "Failed to save gallery item:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save gallery item."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     UPDATE STATUS
     ======================================================= */

  async function updateStatus(
    item: GalleryItem,
    status: GalleryStatus
  ) {
    if (!API_URL) {
      setError(
        "VITE_APPS_SCRIPT_URL is not configured."
      );

      return;
    }

    try {
      setActionId(
        item.gallery_id
      );

      setError("");
      setMessage("");

      const sessionToken =
        getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

      const response =
        await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8",
          },

          body: JSON.stringify({
            action:
              "updateGalleryStatus",

            session_token:
              sessionToken,

            gallery_id:
              item.gallery_id,

            status,
          }),
        });

      if (!response.ok) {
        throw new Error(
          `Status update failed: HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Failed to update gallery status."
        );
      }

      setMessage(
        `Gallery item marked ${status.toLowerCase()}.`
      );

      await loadGallery();
    } catch (err) {
      console.error(
        "Failed to update gallery status:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update gallery status."
      );
    } finally {
      setActionId(null);
    }
  }

  /* =======================================================
     FILTER
     ======================================================= */

  const filteredItems =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return items.filter(
        (item) => {
          const matchesStatus =
            statusFilter === "ALL" ||
            item.status ===
              statusFilter;

          const matchesSearch =
            !query ||
            [
              item.title,
              item.category,
              item.description,
              item.image_name,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(query)
              );

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      items,
      search,
      statusFilter,
    ]);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main className="teacher-page">
      <div className="container">

        {/* =================================================
            HEADER
            ================================================= */}

        <header className="teacher-header">
          <span className="page-label">
            Teacher Dashboard
          </span>

          <h1>
            Manage Gallery
          </h1>

          <p>
            Upload photographs,
            organise memories and
            control what appears
            on the public gallery.
          </p>
        </header>

        {/* =================================================
            ALERT
            ================================================= */}

        {(message || error) && (
          <div
            className={
              error
                ? "manage-alert error"
                : "manage-alert success"
            }
          >
            <span>
              {error || message}
            </span>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
              }}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            EDITOR + INFO
            ================================================= */}

        <section className="gallery-manager-grid">

          {/* =================================================
              EDITOR
              ================================================= */}

          <form
            className="page-card gallery-editor"
            onSubmit={
              saveGalleryItem
            }
          >
            <div className="gallery-editor-heading">

              <div>
                <span className="page-card-label">
                  {form.gallery_id
                    ? "Edit Photo"
                    : "Add Photo"}
                </span>

                <h2>
                  {form.gallery_id
                    ? "Update gallery item"
                    : "New gallery item"}
                </h2>
              </div>

              {form.gallery_id && (
                <button
                  type="button"
                  className="page-button page-button-secondary"
                  onClick={
                    resetForm
                  }
                >
                  New Photo
                </button>
              )}

            </div>

            <div className="form-grid">

              {/* =================================================
                  TITLE
                  ================================================= */}

              <div className="form-field">
                <label htmlFor="gallery-title">
                  Photo Title
                </label>

                <input
                  id="gallery-title"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Biology Practical Class"
                  required
                />
              </div>

              {/* =================================================
                  CATEGORY
                  ================================================= */}

              <div className="form-field">
                <label htmlFor="gallery-category">
                  Category
                </label>

                <select
                  id="gallery-category"
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      "category",
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* =================================================
                  DESCRIPTION
                  ================================================= */}

              <div className="form-field">
                <label htmlFor="gallery-description">
                  Description
                </label>

                <textarea
                  id="gallery-description"
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Optional description for this photograph..."
                />
              </div>

              {/* =================================================
                  STATUS + ORDER
                  ================================================= */}

              <div className="gallery-form-row">

                <div className="form-field">
                  <label htmlFor="gallery-status">
                    Status
                  </label>

                  <select
                    id="gallery-status"
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target
                          .value as GalleryStatus
                      )
                    }
                  >
                    <option value="DRAFT">
                      Draft
                    </option>

                    <option value="PUBLISHED">
                      Published
                    </option>

                    <option value="ARCHIVED">
                      Archived
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="gallery-order">
                    Display Order
                  </label>

                  <input
                    id="gallery-order"
                    type="number"
                    min="1"
                    value={
                      form.display_order
                    }
                    onChange={(event) =>
                      updateForm(
                        "display_order",
                        event.target.value
                      )
                    }
                    placeholder="Auto"
                  />
                </div>

              </div>

              {/* =================================================
                  FILE
                  ================================================= */}

              <div className="form-field">
                <label htmlFor="gallery-image">
                  Photo
                </label>

                <input
                  id="gallery-image"
                  type="file"
                  accept="image/*"
                  onChange={
                    handleFileChange
                  }
                  required={
                    !form.image_url
                  }
                />

                <small>
                  Images only.
                  Maximum 5 MB.
                </small>
              </div>

              {/* =================================================
                  IMAGE PREVIEW
                  ================================================= */}

              {previewUrl && (
                <div className="gallery-upload-preview">

                  <img
                    src={previewUrl}
                    alt="Selected gallery preview"
                    onError={(event) =>
                      handlePreviewImageError(
                        event,
                        form.image_file_id
                      )
                    }
                  />

                </div>
              )}

              {/* =================================================
                  SAVE
                  ================================================= */}

              <button
                type="submit"
                className="page-button page-button-primary gallery-submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : form.gallery_id
                    ? "Update Photo"
                    : "Save Photo"}
              </button>

            </div>
          </form>

          {/* =================================================
              INFO PANEL
              ================================================= */}

          <aside className="page-card gallery-manager-info">

            <span className="page-card-label">
              Gallery workflow
            </span>

            <h2>
              Keep the public gallery organised.
            </h2>

            <ul>
              <li>
                Upload images directly
                to the SCI Gallery
                Drive folder.
              </li>

              <li>
                Save photos as drafts
                before publishing
                them.
              </li>

              <li>
                Archive old photos
                without deleting
                their records.
              </li>

              <li>
                Use display order
                to control the public
                sequence.
              </li>
            </ul>

          </aside>

        </section>

        {/* =================================================
            GALLERY LIBRARY
            ================================================= */}

        <section className="page-section gallery-manager-list-section">

          <div className="gallery-manager-list-header">

            <div>
              <span className="page-card-label">
                Gallery Library
              </span>

              <h2>
                All gallery items
              </h2>
            </div>

            <span className="gallery-count">
              {filteredItems.length} shown
            </span>

          </div>

          {/* =================================================
              CONTROLS
              ================================================= */}

          <div className="gallery-manager-controls">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search title, category or description..."
              aria-label="Search gallery"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              aria-label="Filter gallery status"
            >
              <option value="ALL">
                All statuses
              </option>

              <option value="DRAFT">
                Draft
              </option>

              <option value="PUBLISHED">
                Published
              </option>

              <option value="ARCHIVED">
                Archived
              </option>
            </select>

            <button
              type="button"
              className="page-button page-button-secondary"
              onClick={
                loadGallery
              }
              disabled={loading}
            >
              Refresh
            </button>

          </div>

          {/* =================================================
              LOADING
              ================================================= */}

          {loading ? (
            <div className="empty-state">

              <h3>
                Loading gallery...
              </h3>

              <p>
                Fetching gallery
                items from Google
                Sheets.
              </p>

            </div>

          ) : filteredItems.length ===
            0 ? (

            /* =================================================
               EMPTY
               ================================================= */

            <div className="empty-state">

              <h3>
                No gallery items found
              </h3>

              <p>
                Create a photo above
                or adjust your
                search/filter.
              </p>

            </div>

          ) : (

            /* =================================================
               GALLERY GRID
               ================================================= */

            <div className="gallery-admin-grid">

              {filteredItems.map(
                (item) => (
                  <article
                    className="gallery-admin-card"
                    key={
                      item.gallery_id
                    }
                  >

                    {/* =================================================
                        IMAGE
                        ================================================= */}

                    <div className="gallery-admin-image">

                      {item.image_url ? (
                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.title
                          }
                          loading="lazy"
                          onError={(
                            event
                          ) =>
                            handleGalleryImageError(
                              event,
                              item
                            )
                          }
                        />
                      ) : (
                        <span>
                          No image
                        </span>
                      )}

                    </div>

                    {/* =================================================
                        BODY
                        ================================================= */}

                    <div className="gallery-admin-body">

                      <div className="gallery-admin-meta">

                        <span className="gallery-category">
                          {
                            item.category
                          }
                        </span>

                        <span
                          className={`gallery-status status-${String(
                            item.status
                          ).toLowerCase()}`}
                        >
                          {
                            item.status
                          }
                        </span>

                      </div>

                      <h3>
                        {item.title}
                      </h3>

                      {item.description && (
                        <p>
                          {
                            item.description
                          }
                        </p>
                      )}

                      {/* =================================================
                          ACTIONS
                          ================================================= */}

                      <div className="gallery-admin-actions">

                        {/* EDIT */}

                        <button
                          type="button"
                          className="page-button page-button-secondary"
                          onClick={() =>
                            editItem(
                              item
                            )
                          }
                        >
                          Edit
                        </button>

                        {/* PUBLISH */}

                        {item.status !==
                          "PUBLISHED" && (
                          <button
                            type="button"
                            className="page-button page-button-primary"
                            disabled={
                              actionId ===
                              item.gallery_id
                            }
                            onClick={() =>
                              updateStatus(
                                item,
                                "PUBLISHED"
                              )
                            }
                          >
                            Publish
                          </button>
                        )}

                        {/* UNPUBLISH */}

                        {item.status ===
                          "PUBLISHED" && (
                          <button
                            type="button"
                            className="page-button page-button-secondary"
                            disabled={
                              actionId ===
                              item.gallery_id
                            }
                            onClick={() =>
                              updateStatus(
                                item,
                                "DRAFT"
                              )
                            }
                          >
                            Unpublish
                          </button>
                        )}

                        {/* ARCHIVE */}

                        {item.status !==
                          "ARCHIVED" && (
                          <button
                            type="button"
                            className="page-button gallery-danger-button"
                            disabled={
                              actionId ===
                              item.gallery_id
                            }
                            onClick={() =>
                              updateStatus(
                                item,
                                "ARCHIVED"
                              )
                            }
                          >
                            Archive
                          </button>
                        )}

                        {/* RESTORE */}

                        {item.status ===
                          "ARCHIVED" && (
                          <button
                            type="button"
                            className="page-button page-button-secondary"
                            disabled={
                              actionId ===
                              item.gallery_id
                            }
                            onClick={() =>
                              updateStatus(
                                item,
                                "DRAFT"
                              )
                            }
                          >
                            Restore
                          </button>
                        )}

                      </div>
                    </div>
                  </article>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

export default ManageGallery;