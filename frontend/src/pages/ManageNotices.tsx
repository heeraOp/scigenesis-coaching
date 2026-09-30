import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  useEffect,
  useState,
} from "react";

import "./../styles/pages.css";
import { getSessionToken } from "../services/auth";


/* =========================================================
   TYPES
   ========================================================= */

interface Notice {
  notice_id: string;
  created_at?: string;
  title: string;
  description: string;
  attachment_file_id?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED";
  updated_at?: string;
}


interface NoticeForm {
  notice_id: string;
  title: string;
  description: string;
  status:
    | "DRAFT"
    | "PUBLISHED";
}


/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL;


/* =========================================================
   INITIAL FORM
   ========================================================= */

const INITIAL_FORM: NoticeForm = {
  notice_id: "",
  title: "",
  description: "",
  status: "PUBLISHED",
};


/* =========================================================
   DATE FORMATTER
   ========================================================= */

function formatDate(
  value?: string
): string {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

}


/* =========================================================
   STATUS LABEL CLASS
   ========================================================= */

function getStatusClass(
  status: Notice["status"]
): string {

  if (
    status === "PUBLISHED"
  ) {

    return "page-button-primary";

  }


  return "page-button-secondary";

}


/* =========================================================
   COMPONENT
   ========================================================= */

function ManageNotices() {

  /* -------------------------------------------------------
     DATA
     ------------------------------------------------------- */

  const [
    notices,
    setNotices,
  ] = useState<Notice[]>([]);


  /* -------------------------------------------------------
     FORM
     ------------------------------------------------------- */

  const [
    form,
    setForm,
  ] = useState<NoticeForm>(
    INITIAL_FORM
  );


  /* -------------------------------------------------------
     FILE
     ------------------------------------------------------- */

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null
  );


  /* -------------------------------------------------------
     EDITING
     ------------------------------------------------------- */

  const [
    editingNoticeId,
    setEditingNoticeId,
  ] = useState("");


  /* -------------------------------------------------------
     SEARCH
     ------------------------------------------------------- */

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  /* -------------------------------------------------------
     STATUS FILTER
     ------------------------------------------------------- */

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    | "ALL"
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED"
  >("ALL");


  /* -------------------------------------------------------
     LOADING
     ------------------------------------------------------- */

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  /* -------------------------------------------------------
     SAVING
     ------------------------------------------------------- */

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);


  /* -------------------------------------------------------
     STATUS ACTION
     ------------------------------------------------------- */

  const [
    updatingNoticeId,
    setUpdatingNoticeId,
  ] = useState("");


  /* -------------------------------------------------------
     MESSAGES
     ------------------------------------------------------- */

  const [
    message,
    setMessage,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  /* =======================================================
     LOAD NOTICES
     ======================================================= */

  async function loadNotices() {

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

      /*
       * include_all=true is used by the teacher dashboard
       * so the teacher can see:
       *
       * DRAFT
       * PUBLISHED
       * ARCHIVED
       */

      const sessionToken = getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

      const response =
        await fetch(
          `${API_URL}?action=getNotices&include_all=true&session_token=${encodeURIComponent(
            sessionToken
          )}`
        );


      if (!response.ok) {

        throw new Error(
          `Request failed with status ${response.status}.`
        );

      }


      const data =
        await response.json();


      if (!data.success) {

        throw new Error(
          data.error ||
          data.message ||
          "Unable to load notices."
        );

      }


      const noticeList =
        Array.isArray(
          data.notices
        )
          ? data.notices
          : [];


      setNotices(
        noticeList as Notice[]
      );

    } catch (
      loadError
    ) {

      console.error(
        "Failed to load notices:",
        loadError
      );


      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notices."
      );

    } finally {

      setIsLoading(false);

    }

  }


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(
    () => {

      loadNotices();

    },
    []
  );


  /* =======================================================
     FORM CHANGE
     ======================================================= */

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) {

    const {
      name,
      value,
    } = event.target;


    setForm(
      previous => ({
        ...previous,
        [name]: value,
      })
    );


    setMessage("");

    setError("");

  }


  /* =======================================================
     FILE CHANGE
     ======================================================= */

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {

    const file =
      event.target.files?.[0] ||
      null;


    setSelectedFile(
      file
    );


    setMessage("");

    setError("");

  }


  /* =======================================================
     RESET FORM
     ======================================================= */

  function resetForm() {

    setForm(
      INITIAL_FORM
    );


    setSelectedFile(
      null
    );


    setEditingNoticeId("");


    setMessage("");

    setError("");


    /*
     * Clear file input.
     */

    const fileInput =
      document.getElementById(
        "notice-attachment"
      ) as
        | HTMLInputElement
        | null;


    if (fileInput) {

      fileInput.value = "";

    }

  }


  /* =======================================================
     FILE → BASE64
     ======================================================= */

  function fileToBase64(
    file: File
  ): Promise<string> {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        const reader =
          new FileReader();


        reader.onload =
          () => {

            resolve(
              String(
                reader.result ||
                ""
              )
            );

          };


        reader.onerror =
          () => {

            reject(
              new Error(
                "Unable to read the selected file."
              )
            );

          };


        reader.readAsDataURL(
          file
        );

      }
    );

  }


  /* =======================================================
     UPLOAD ATTACHMENT
     ======================================================= */

  async function uploadAttachment(
    file: File
  ) {

    const base64 =
      await fileToBase64(
        file
      );


    const sessionToken = getSessionToken();

    if (!sessionToken) {
      throw new Error(
        "Authentication required. Please log in again."
      );
    }

    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8",
          },

          body:
            JSON.stringify(
              {
                action:
                  "uploadNoticeAttachment",

                session_token:
                  sessionToken,

                file_name:
                  file.name,

                mime_type:
                  file.type,

                file_data:
                  base64,
              }
            ),
        }
      );


    if (!response.ok) {

      throw new Error(
        `Attachment upload failed with status ${response.status}.`
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.error ||
        data.message ||
        "Unable to upload attachment."
      );

    }


    return data;

  }


  /* =======================================================
     SAVE NOTICE
     ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    if (!API_URL) {

      setError(
        "Apps Script URL is not configured. Check VITE_APPS_SCRIPT_URL."
      );

      return;

    }


    /* -----------------------------------------------------
       VALIDATE TITLE
       ----------------------------------------------------- */

    if (
      !form.title.trim()
    ) {

      setError(
        "Please enter a notice title."
      );

      return;

    }


    /* -----------------------------------------------------
       VALIDATE DESCRIPTION
       ----------------------------------------------------- */

    if (
      !form.description.trim()
    ) {

      setError(
        "Please enter the notice description."
      );

      return;

    }


    /* -----------------------------------------------------
       VALIDATE FILE
       ----------------------------------------------------- */

    if (selectedFile) {

      const isImage =
        selectedFile.type.startsWith(
          "image/"
        );


      const isPdf =
        selectedFile.type ===
        "application/pdf";


      if (
        !isImage &&
        !isPdf
      ) {

        setError(
          "Only PDF and image attachments are allowed."
        );

        return;

      }

    }


    setIsSaving(true);

    setMessage("");

    setError("");


    try {

      let attachmentData:
        Record<string, string> = {};


      /* ---------------------------------------------------
         UPLOAD ATTACHMENT FIRST
         --------------------------------------------------- */

      if (selectedFile) {

        setMessage(
          "Uploading attachment..."
        );


        const uploadResult =
          await uploadAttachment(
            selectedFile
          );


        attachmentData = {

          attachment_file_id:
            uploadResult.file_id,

          attachment_url:
            uploadResult.attachment_url ||
            uploadResult.file_url ||
            "",

          attachment_name:
            uploadResult.file_name ||
            selectedFile.name,

          attachment_type:
            uploadResult.file_type ||
            selectedFile.type,

        };

      }


      /* ---------------------------------------------------
         SAVE NOTICE
         --------------------------------------------------- */

      setMessage(
        editingNoticeId
          ? "Updating notice..."
          : "Saving notice..."
      );

      const sessionToken = getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

      const response =
        await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain;charset=utf-8",
            },

            body:
              JSON.stringify(
                {

                  action:
                    "saveNotice",

                  session_token:
                    sessionToken,

                  notice: {

                    notice_id:
                      editingNoticeId ||
                      form.notice_id ||
                      "",

                    title:
                      form.title.trim(),

                    description:
                      form.description.trim(),

                    status:
                      form.status,

                    ...attachmentData,

                  },

                }
              ),
          }
        );


      if (!response.ok) {

        throw new Error(
          `Save request failed with status ${response.status}.`
        );

      }


      const data =
        await response.json();


      if (!data.success) {

        throw new Error(
          data.error ||
          data.message ||
          "Unable to save notice."
        );

      }


      setMessage(
        editingNoticeId
          ? "Notice updated successfully."
          : "Notice created successfully."
      );


      resetForm();


      await loadNotices();

    } catch (
      saveError
    ) {

      console.error(
        "Notice save error:",
        saveError
      );


      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save notice."
      );

    } finally {

      setIsSaving(false);

    }

  }


  /* =======================================================
     EDIT NOTICE
     ======================================================= */

  function handleEdit(
    notice: Notice
  ) {

    setEditingNoticeId(
      notice.notice_id
    );


    setForm(
      {
        notice_id:
          notice.notice_id,

        title:
          notice.title,

        description:
          notice.description,

        status:
          notice.status ===
          "DRAFT"
            ? "DRAFT"
            : "PUBLISHED",
      }
    );


    /*
     * A new attachment is optional.
     *
     * If no new attachment is selected,
     * Apps Script preserves the old attachment.
     */

    setSelectedFile(
      null
    );


    setMessage(
      "Editing notice."
    );

    setError("");


    window.scrollTo(
      {
        top: 0,
        behavior: "smooth",
      }
    );

  }


  /* =======================================================
     UPDATE NOTICE STATUS
     ======================================================= */

  async function updateStatus(
    noticeId: string,
    status: Notice["status"]
  ) {

    if (!API_URL) {

      setError(
        "Apps Script URL is not configured."
      );

      return;

    }


    setUpdatingNoticeId(
      noticeId
    );


    setMessage("");

    setError("");


    try {

      const sessionToken = getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

      const response =
        await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain;charset=utf-8",
            },

            body:
              JSON.stringify(
                {

                  action:
                    "updateNoticeStatus",

                  session_token:
                    sessionToken,

                  notice_id:
                    noticeId,

                  status,

                }
              ),
          }
        );


      if (!response.ok) {

        throw new Error(
          `Status update failed with status ${response.status}.`
        );

      }


      const data =
        await response.json();


      if (!data.success) {

        throw new Error(
          data.error ||
          data.message ||
          "Unable to update notice status."
        );

      }


      setMessage(
        `Notice marked as ${status.toLowerCase()}.`
      );


      await loadNotices();

    } catch (
      statusError
    ) {

      console.error(
        "Notice status update error:",
        statusError
      );


      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update notice status."
      );

    } finally {

      setUpdatingNoticeId(
        ""
      );

    }

  }


  /* =======================================================
     FILTER NOTICES
     ======================================================= */

  const normalizedSearch =
    searchTerm
      .trim()
      .toLowerCase();


  const filteredNotices =
    notices.filter(
      notice => {

        const matchesSearch =
          !normalizedSearch ||
          notice.title
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          notice.description
            .toLowerCase()
            .includes(
              normalizedSearch
            );


        const matchesStatus =
          statusFilter ===
            "ALL" ||
          notice.status ===
            statusFilter;


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


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
            Manage Notices
          </h1>

          <p>
            Create, publish and manage
            institute notices.
          </p>

        </header>


        {/* =================================================
            NOTICE FORM
            ================================================= */}

        <form
          className="page-card form-grid"
          onSubmit={
            handleSubmit
          }
        >

          {/* TITLE */}

          <div className="form-field">

            <label htmlFor="notice-title">
              Notice Title
            </label>

            <input
              id="notice-title"
              type="text"
              name="title"
              value={
                form.title
              }
              onChange={
                handleChange
              }
              required
              placeholder="Enter notice title"
            />

          </div>


          {/* DESCRIPTION */}

          <div className="form-field">

            <label htmlFor="notice-description">
              Notice Description
            </label>

            <textarea
              id="notice-description"
              name="description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              required
              rows={6}
              placeholder="Write notice details..."
            />

          </div>


          {/* STATUS */}

          <div className="form-field">

            <label htmlFor="notice-status">
              Status
            </label>

            <select
              id="notice-status"
              name="status"
              value={
                form.status
              }
              onChange={
                handleChange
              }
            >

              <option value="PUBLISHED">
                Publish immediately
              </option>

              <option value="DRAFT">
                Save as draft
              </option>

            </select>

          </div>


          {/* ATTACHMENT */}

          <div className="form-field">

            <label htmlFor="notice-attachment">
              Attachment
            </label>

            <input
              id="notice-attachment"
              type="file"
              accept=".pdf,image/*"
              onChange={
                handleFileChange
              }
            />

            <small>

              PDF or image.
              {" "}

              Maximum file size depends
              on the Apps Script request limit.

            </small>


            {selectedFile && (

              <small>

                Selected:
                {" "}

                <strong>
                  {selectedFile.name}
                </strong>

              </small>

            )}

          </div>


          {/* MESSAGE */}

          {message && (

            <div
              className="page-card"
              style={{
                padding:
                  "14px 18px",
              }}
            >

              {message}

            </div>

          )}


          {/* ERROR */}

          {error && (

            <div
              className="page-card"
              style={{
                padding:
                  "14px 18px",

                border:
                  "1px solid #c62828",
              }}
            >

              {error}

            </div>

          )}


          {/* BUTTONS */}

          <div
            className="admin-actions"
          >

            <button
              type="submit"
              className="page-button page-button-primary"
              disabled={
                isSaving
              }
            >

              {isSaving

                ? "Saving..."

                : editingNoticeId

                  ? "Update Notice"

                  : form.status ===
                    "DRAFT"

                    ? "Save Draft"

                    : "Publish Notice"

              }

            </button>


            {editingNoticeId && (

              <button
                type="button"
                className="page-button page-button-secondary"
                onClick={
                  resetForm
                }
                disabled={
                  isSaving
                }
              >

                Cancel Edit

              </button>

            )}

          </div>

        </form>


        {/* =================================================
            EXISTING NOTICES
            ================================================= */}

        <section
          className="page-section"
        >

          <div
            className="page-card"
          >

            {/* HEADER */}

            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap:
                  "12px",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                marginBottom:
                  "24px",
              }}
            >

              <div>

                <h2>
                  Existing Notices
                </h2>

                <p>
                  Notices stored in
                  Google Sheets.
                </p>

              </div>


              <button
                type="button"
                className="page-button page-button-secondary"
                onClick={
                  loadNotices
                }
                disabled={
                  isLoading
                }
              >

                {isLoading
                  ? "Loading..."
                  : "Refresh"}

              </button>

            </div>


            {/* =================================================
                SEARCH + FILTER
                ================================================= */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "minmax(0, 1fr) 220px",

                gap:
                  "12px",

                marginBottom:
                  "24px",
              }}
            >

              <input
                type="search"
                value={
                  searchTerm
                }
                onChange={
                  event =>
                    setSearchTerm(
                      event.target.value
                    )
                }
                placeholder="Search notices..."
                style={{
                  width:
                    "100%",

                  boxSizing:
                    "border-box",

                  padding:
                    "13px 14px",

                  border:
                    "1px solid rgba(0,0,0,0.15)",

                  borderRadius:
                    "10px",

                  font:
                    "inherit",
                }}
              />


              <select
                value={
                  statusFilter
                }
                onChange={
                  event =>
                    setStatusFilter(
                      event.target.value as
                        | "ALL"
                        | "DRAFT"
                        | "PUBLISHED"
                        | "ARCHIVED"
                    )
                }
                style={{
                  width:
                    "100%",

                  padding:
                    "13px 14px",

                  border:
                    "1px solid rgba(0,0,0,0.15)",

                  borderRadius:
                    "10px",

                  background:
                    "#fff",

                  font:
                    "inherit",
                }}
              >

                <option value="ALL">
                  All statuses
                </option>

                <option value="PUBLISHED">
                  Published
                </option>

                <option value="DRAFT">
                  Drafts
                </option>

                <option value="ARCHIVED">
                  Archived
                </option>

              </select>

            </div>


            {/* =================================================
                LOADING
                ================================================= */}

            {isLoading && (

              <div
                className="empty-state"
              >

                <h3>
                  Loading notices...
                </h3>

                <p>
                  Reading notices from
                  Google Sheets.
                </p>

              </div>

            )}


            {/* =================================================
                ERROR
                ================================================= */}

            {!isLoading &&
              error &&
              notices.length === 0 && (

                <div
                  className="empty-state"
                >

                  <h3>
                    Unable to load notices
                  </h3>

                  <p>
                    {error}
                  </p>

                </div>

              )}


            {/* =================================================
                EMPTY
                ================================================= */}

            {!isLoading &&
              !error &&
              filteredNotices.length === 0 && (

                <div
                  className="empty-state"
                >

                  <h3>
                    No notices found
                  </h3>

                  <p>
                    Create a notice above
                    to get started.
                  </p>

                </div>

              )}


            {/* =================================================
                NOTICE TABLE
                ================================================= */}

            {!isLoading &&
              filteredNotices.length > 0 && (

                <div
                  className="table-wrapper"
                >

                  <table
                    className="data-table"
                  >

                    <thead>

                      <tr>

                        <th>
                          Notice
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Attachment
                        </th>

                        <th>
                          Actions
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredNotices.map(
                        notice => {

                          const isUpdating =
                            updatingNoticeId ===
                            notice.notice_id;


                          return (

                            <tr
                              key={
                                notice.notice_id
                              }
                            >

                              {/* NOTICE */}

                              <td>

                                <strong>
                                  {notice.title}
                                </strong>


                                <div
                                  style={{
                                    marginTop:
                                      "6px",

                                    opacity:
                                      0.65,

                                    maxWidth:
                                      "420px",
                                  }}
                                >

                                  {notice.description}

                                </div>

                              </td>


                              {/* STATUS */}

                              <td>

                                <span
                                  className={
                                    `page-button ${getStatusClass(
                                      notice.status
                                    )}`
                                  }
                                  style={{
                                    padding:
                                      "6px 10px",

                                    fontSize:
                                      "0.75rem",

                                    cursor:
                                      "default",
                                  }}
                                >

                                  {notice.status}

                                </span>

                              </td>


                              {/* DATE */}

                              <td>

                                {formatDate(
                                  notice.created_at
                                )}

                              </td>


                              {/* ATTACHMENT */}

                              <td>

                                {notice.attachment_url ? (

                                  <a
                                    href={
                                      notice.attachment_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >

                                    {
                                      notice.attachment_name ||
                                      "View attachment"
                                    }

                                  </a>

                                ) : (

                                  "—"

                                )}

                              </td>


                              {/* ACTIONS */}

                              <td>

                                <div
                                  className="admin-actions"
                                  style={{
                                    marginTop:
                                      0,
                                  }}
                                >

                                  {/* EDIT */}

                                  <button
                                    type="button"
                                    className="page-button page-button-secondary"
                                    onClick={() =>
                                      handleEdit(
                                        notice
                                      )
                                    }
                                    disabled={
                                      isUpdating
                                    }
                                  >

                                    Edit

                                  </button>


                                  {/* PUBLISH */}

                                  {notice.status !==
                                    "PUBLISHED" && (

                                    <button
                                      type="button"
                                      className="page-button page-button-primary"
                                      onClick={() =>
                                        updateStatus(
                                          notice.notice_id,
                                          "PUBLISHED"
                                        )
                                      }
                                      disabled={
                                        isUpdating
                                      }
                                    >

                                      {isUpdating
                                        ? "Updating..."
                                        : "Publish"}

                                    </button>

                                  )}


                                  {/* ARCHIVE */}

                                  {notice.status ===
                                    "PUBLISHED" && (

                                    <button
                                      type="button"
                                      className="page-button page-button-secondary"
                                      onClick={() =>
                                        updateStatus(
                                          notice.notice_id,
                                          "ARCHIVED"
                                        )
                                      }
                                      disabled={
                                        isUpdating
                                      }
                                    >

                                      {isUpdating
                                        ? "Updating..."
                                        : "Archive"}

                                    </button>

                                  )}


                                  {/* RESTORE */}

                                  {notice.status ===
                                    "ARCHIVED" && (

                                    <button
                                      type="button"
                                      className="page-button page-button-secondary"
                                      onClick={() =>
                                        updateStatus(
                                          notice.notice_id,
                                          "DRAFT"
                                        )
                                      }
                                      disabled={
                                        isUpdating
                                      }
                                    >

                                      {isUpdating
                                        ? "Updating..."
                                        : "Restore"}

                                    </button>

                                  )}

                                </div>

                              </td>

                            </tr>

                          );

                        }
                      )}

                    </tbody>

                  </table>

                </div>

              )}

          </div>

        </section>

      </div>

    </main>

  );
}


export default ManageNotices;