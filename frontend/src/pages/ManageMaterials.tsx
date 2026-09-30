import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./ManageMaterials.css";
import { getSessionToken } from "../services/auth";

type MaterialStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

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
  status: MaterialStatus;
  display_order?: number | string;
  updated_at?: string;
}

interface MaterialForm {
  title: string;
  class_level: string;
  subject: string;
  description: string;
  status: MaterialStatus;
}

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

const INITIAL_FORM: MaterialForm = {
  title: "",
  class_level: "",
  subject: "",
  description: "",
  status: "PUBLISHED",
};

const CLASS_OPTIONS = ["XI", "XII"];
const SUBJECT_OPTIONS = ["Physics", "Chemistry", "Biology"];

function formatDate(value?: string): string {
  if (!value) return "—";

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

function statusLabel(status: MaterialStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function ManageMaterials() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [form, setForm] = useState<MaterialForm>(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | MaterialStatus
  >("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingMaterialId, setUpdatingMaterialId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadMaterials() {
    if (!API_URL) {
      setError(
        "Apps Script URL is not configured. Check VITE_APPS_SCRIPT_URL."
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const sessionToken = getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}?action=getMaterials&include_all=true&session_token=${encodeURIComponent(
        sessionToken
      )}`
    );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || data.message || "Unable to load study materials."
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

  function resetForm() {
    setForm(INITIAL_FORM);
    setSelectedFile(null);
    setEditingMaterialId("");

    const fileInput = document.getElementById(
      "study-material-file"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The PDF must be 5 MB or smaller.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.includes(",") ? result.split(",")[1] : result);
      };

      reader.onerror = () => {
        reject(new Error("Unable to read the selected PDF."));
      };

      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!API_URL) {
      setError("Apps Script URL is not configured.");
      return;
    }

    if (!form.title.trim() || !form.class_level || !form.subject) {
      setError("Title, class and subject are required.");
      return;
    }

    if (!editingMaterialId && !selectedFile) {
      setError("Please select a PDF for the new material.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      let uploadedFile: {
        file_id?: string;
        file_url?: string;
        file_name?: string;
      } = {};

      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);

        const uploadResponse = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            action: "uploadMaterial",
            fileName: selectedFile.name,
            mimeType: selectedFile.type || "application/pdf",
            base64,
            class_level: form.class_level,
            subject: form.subject,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `PDF upload failed with status ${uploadResponse.status}.`
          );
        }

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          throw new Error(
            uploadData.error ||
              uploadData.message ||
              "Unable to upload the PDF."
          );
        }

        uploadedFile = uploadData;
      }

      const material: StudyMaterial = {
        material_id: editingMaterialId,
        title: form.title.trim(),
        class_level: form.class_level,
        subject: form.subject,
        description: form.description.trim(),
        status: form.status,
        file_id: uploadedFile.file_id,
        file_url: uploadedFile.file_url,
        file_name: uploadedFile.file_name,
      };

      const saveResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "saveMaterial",
          material,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error(
          `Save request failed with status ${saveResponse.status}.`
        );
      }

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(
          saveData.error ||
            saveData.message ||
            "Unable to save the study material."
        );
      }

      setMessage(
        editingMaterialId
          ? "Study material updated successfully."
          : "Study material uploaded successfully."
      );

      resetForm();
      await loadMaterials();
    } catch (saveError) {
      console.error("Failed to save study material:", saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save study material."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(material: StudyMaterial) {
    setEditingMaterialId(material.material_id);

    setForm({
      title: material.title || "",
      class_level: material.class_level || "",
      subject: material.subject || "",
      description: material.description || "",
      status: material.status || "DRAFT",
    });

    setSelectedFile(null);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function updateStatus(
    materialId: string,
    status: MaterialStatus
  ) {
    if (!API_URL) {
      setError("Apps Script URL is not configured.");
      return;
    }

    setUpdatingMaterialId(materialId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "updateMaterialStatus",
          material_id: materialId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Status update failed with status ${response.status}.`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to update material status."
        );
      }

      setMessage(
        `Material ${statusLabel(status).toLowerCase()} successfully.`
      );

      await loadMaterials();
    } catch (statusError) {
      console.error("Failed to update material status:", statusError);

      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update material status."
      );
    } finally {
      setUpdatingMaterialId("");
    }
  }

  const filteredMaterials = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return materials.filter((material) => {
      const matchesSearch =
        !query ||
        material.title.toLowerCase().includes(query) ||
        material.subject.toLowerCase().includes(query) ||
        material.class_level.toLowerCase().includes(query) ||
        (material.description || "").toLowerCase().includes(query);

      const matchesClass =
        classFilter === "ALL" || material.class_level === classFilter;

      const matchesSubject =
        subjectFilter === "ALL" || material.subject === subjectFilter;

      const matchesStatus =
        statusFilter === "ALL" || material.status === statusFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesSubject &&
        matchesStatus
      );
    });
  }, [
    materials,
    searchTerm,
    classFilter,
    subjectFilter,
    statusFilter,
  ]);

  const counts = useMemo(
    () => ({
      all: materials.length,
      published: materials.filter(
        (material) => material.status === "PUBLISHED"
      ).length,
      drafts: materials.filter(
        (material) => material.status === "DRAFT"
      ).length,
      archived: materials.filter(
        (material) => material.status === "ARCHIVED"
      ).length,
    }),
    [materials]
  );

  return (
    <main className="materials-admin">
      <div className="materials-admin-container">
        <header className="materials-admin-hero">
          <div>
            <span className="materials-admin-kicker">
              Teacher Dashboard
            </span>

            <h1>Manage Study Materials</h1>

            <p>
              Upload, organise and publish PDF learning resources for SCI
              students.
            </p>
          </div>

          <div className="materials-admin-summary">
            <div>
              <strong>{counts.all}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{counts.published}</strong>
              <span>Published</span>
            </div>
            <div>
              <strong>{counts.drafts}</strong>
              <span>Drafts</span>
            </div>
          </div>
        </header>

        {message && (
          <div className="materials-alert materials-alert-success">
            <span>✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className="materials-alert materials-alert-error">
            <span>!</span>
            <div>
              <strong>Action could not be completed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <section className="materials-admin-card materials-form-card">
          <div className="materials-card-heading">
            <div>
              <span className="materials-section-label">
                {editingMaterialId ? "Edit material" : "New material"}
              </span>
              <h2>
                {editingMaterialId
                  ? "Update study material"
                  : "Add a study material"}
              </h2>
            </div>

            {editingMaterialId && (
              <button
                type="button"
                className="materials-secondary-button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="materials-form-grid">
              <label className="materials-field materials-field-wide">
                <span>Material title *</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Cell Biology — Chapter 1 Notes"
                  required
                />
              </label>

              <label className="materials-field">
                <span>Class *</span>
                <select
                  name="class_level"
                  value={form.class_level}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select class</option>
                  {CLASS_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      Class {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="materials-field">
                <span>Subject *</span>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select subject</option>
                  {SUBJECT_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="materials-field materials-field-wide">
                <span>Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Briefly describe what students will find in this material."
                  rows={4}
                />
              </label>

              <label className="materials-file-field">
                <span>PDF file {editingMaterialId ? "(optional)" : "*"}</span>

                <input
                  id="study-material-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  required={!editingMaterialId}
                />

                <small>
                  PDF only • Maximum 5 MB
                  {selectedFile ? ` • ${selectedFile.name}` : ""}
                </small>
              </label>

              <label className="materials-field">
                <span>Publication status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </label>
            </div>

            <div className="materials-form-footer">
              <span>
                {editingMaterialId
                  ? "Leave the PDF empty to keep the existing file."
                  : "The PDF will be stored securely in the SCI Study Materials Drive folder."}
              </span>

              <button
                type="submit"
                className="materials-primary-button"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : editingMaterialId
                    ? "Save Changes"
                    : "Upload Material"}
              </button>
            </div>
          </form>
        </section>

        <section className="materials-admin-card">
          <div className="materials-library-heading">
            <div>
              <span className="materials-section-label">
                Material library
              </span>
              <h2>All study materials</h2>
            </div>

            <button
              type="button"
              className="materials-refresh-button"
              onClick={loadMaterials}
              disabled={isLoading}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="materials-filters">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search materials..."
              aria-label="Search study materials"
            />

            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              aria-label="Filter by class"
            >
              <option value="ALL">All classes</option>
              {CLASS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  Class {item}
                </option>
              ))}
            </select>

            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              aria-label="Filter by subject"
            >
              <option value="ALL">All subjects</option>
              {SUBJECT_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "ALL" | MaterialStatus
                )
              }
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {isLoading ? (
            <div className="materials-empty-state">
              <div className="materials-spinner" />
              <h3>Loading materials</h3>
              <p>Fetching the latest resources from SCI.</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="materials-empty-state">
              <div className="materials-empty-icon">PDF</div>
              <h3>No materials found</h3>
              <p>
                {materials.length === 0
                  ? "Upload your first study material using the form above."
                  : "Try changing your search or filters."}
              </p>
            </div>
          ) : (
            <div className="materials-table-wrap">
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMaterials.map((material) => {
                    const isUpdating =
                      updatingMaterialId === material.material_id;

                    return (
                      <tr key={material.material_id}>
                        <td>
                          <div className="materials-table-title">
                            <div className="materials-pdf-icon">PDF</div>
                            <div>
                              <strong>{material.title}</strong>
                              <span>
                                {material.file_name || "No PDF attached"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>Class {material.class_level}</td>

                        <td>
                          <span className="materials-subject-pill">
                            {material.subject}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`materials-status materials-status-${material.status.toLowerCase()}`}
                          >
                            {statusLabel(material.status)}
                          </span>
                        </td>

                        <td>{formatDate(material.updated_at || material.created_at)}</td>

                        <td>
                          <div className="materials-actions">
                            {material.file_url && (
                              <a
                                href={material.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="materials-action-link"
                              >
                                Open
                              </a>
                            )}

                            <button
                              type="button"
                              className="materials-action-button"
                              onClick={() => handleEdit(material)}
                            >
                              Edit
                            </button>

                            {material.status !== "PUBLISHED" && (
                              <button
                                type="button"
                                className="materials-action-button materials-action-publish"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(
                                    material.material_id,
                                    "PUBLISHED"
                                  )
                                }
                              >
                                Publish
                              </button>
                            )}

                            {material.status !== "ARCHIVED" && (
                              <button
                                type="button"
                                className="materials-action-button materials-action-archive"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(
                                    material.material_id,
                                    "ARCHIVED"
                                  )
                                }
                              >
                                Archive
                              </button>
                            )}

                            {material.status === "ARCHIVED" && (
                              <button
                                type="button"
                                className="materials-action-button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(
                                    material.material_id,
                                    "PUBLISHED"
                                  )
                                }
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ManageMaterials;
