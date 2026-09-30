import { useEffect, useMemo, useState } from "react";
import "./../styles/pages.css";
import { getSessionToken } from "../services/auth";

const API_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL;

interface Enquiry {
  enquiry_id: string;
  submitted_at: string;
  respondent_type: string;
  student_name: string;
  parent_name: string;
  phone: string;
  email: string;
  class_level: string;
  board: string;
  course_interest: string;
  message: string;
  status: string;
  notes: string;
  updated_at: string;
}

function StudentEnquiries() {

  const [enquiries, setEnquiries] =
    useState<Enquiry[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [selectedEnquiry, setSelectedEnquiry] =
    useState<Enquiry | null>(null);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);


  /* =====================================================
     LOAD ENQUIRIES
     ===================================================== */

  async function loadEnquiries() {

    try {

      setLoading(true);
      setError("");

      if (!API_URL) {
        throw new Error(
          "VITE_APPS_SCRIPT_URL is not configured."
        );
      }

      const sessionToken = getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

const response = await fetch(
  `${API_URL}?action=getEnquiries&session_token=${encodeURIComponent(
    sessionToken
  )}`
);;

      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
          "Failed to load enquiries."
        );
      }

      setEnquiries(
        Array.isArray(data.enquiries)
          ? data.enquiries
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load enquiries:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load enquiries."
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {
    loadEnquiries();
  }, []);


  /* =====================================================
     UPDATE STATUS
     ===================================================== */

  async function updateStatus(
    enquiry: Enquiry,
    newStatus: "NEW" | "CONTACTED" | "CLOSED"
  ) {

    try {

      setUpdatingId(
        enquiry.enquiry_id
      );

      setError("");

      const response = await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body: JSON.stringify({
            action:
              "updateEnquiryStatus",

            enquiry_id:
              enquiry.enquiry_id,

            status:
              newStatus
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status}`
        );
      }

      const data =
        await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
          "Failed to update enquiry status."
        );
      }

      setEnquiries(current =>
        current.map(item =>
          item.enquiry_id ===
          enquiry.enquiry_id
            ? {
                ...item,
                status: newStatus,
                updated_at:
                  new Date().toISOString()
              }
            : item
        )
      );

      setSelectedEnquiry(current => {

        if (
          !current ||
          current.enquiry_id !==
            enquiry.enquiry_id
        ) {
          return current;
        }

        return {
          ...current,
          status: newStatus,
          updated_at:
            new Date().toISOString()
        };

      });

    } catch (err) {

      console.error(
        "Status update failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update status."
      );

    } finally {

      setUpdatingId(null);

    }

  }


  /* =====================================================
     SEARCH + FILTER
     ===================================================== */

  const filteredEnquiries =
    useMemo(() => {

      const query =
        search.trim().toLowerCase();

      return enquiries.filter(
        enquiry => {

          const searchableText = [
            enquiry.student_name,
            enquiry.parent_name,
            enquiry.phone,
            enquiry.email,
            enquiry.class_level,
            enquiry.board,
            enquiry.course_interest,
            enquiry.message,
            enquiry.enquiry_id
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            searchableText.includes(query);

          const matchesStatus =
            statusFilter === "ALL" ||
            enquiry.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    }, [
      enquiries,
      search,
      statusFilter
    ]);


  /* =====================================================
     STATISTICS
     ===================================================== */

  const total =
    enquiries.length;

  const newCount =
    enquiries.filter(
      item =>
        item.status === "NEW"
    ).length;

  const contactedCount =
    enquiries.filter(
      item =>
        item.status === "CONTACTED"
    ).length;

  const closedCount =
    enquiries.filter(
      item =>
        item.status === "CLOSED"
    ).length;


  /* =====================================================
     FORMAT DATE
     ===================================================== */

  function formatDate(
    value: string
  ) {

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
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  }


  /* =====================================================
     STATUS STYLE
     ===================================================== */

  function getStatusStyle(
    status: string
  ) {

    if (status === "NEW") {
      return {
        background: "#eff6ff",
        color: "#1d4ed8"
      };
    }

    if (status === "CONTACTED") {
      return {
        background: "#ecfdf3",
        color: "#15803d"
      };
    }

    return {
      background: "#f2f4f7",
      color: "#475467"
    };

  }


  return (

    <main className="teacher-page">

      <div className="container">

        <header className="teacher-header">

          <span className="page-label">
            Teacher Dashboard
          </span>

          <h1>
            Student Enquiries
          </h1>

          <p>
            View enquiries, contact students
            and update their enquiry status.
          </p>

        </header>


        {/* =================================================
            STATISTICS
            ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "24px"
          }}
        >

          <StatCard
            label="TOTAL ENQUIRIES"
            value={total}
          />

          <StatCard
            label="NEW"
            value={newCount}
          />

          <StatCard
            label="CONTACTED"
            value={contactedCount}
          />

          <StatCard
            label="CLOSED"
            value={closedCount}
          />

        </div>


        {/* =================================================
            ENQUIRY LIST
            ================================================= */}

        <div className="page-card">

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap"
            }}
          >

            <input
              type="text"
              value={search}
              onChange={event =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                "Search student, phone, email, course or message..."
              }
              style={{
                flex: 1,
                minWidth: "260px",
                padding:
                  "12px 14px",
                border:
                  "1px solid #d0d5dd",
                borderRadius:
                  "8px",
                fontSize: "14px"
              }}
            />

            <select
              value={statusFilter}
              onChange={event =>
                setStatusFilter(
                  event.target.value
                )
              }
              style={{
                padding:
                  "12px 14px",
                border:
                  "1px solid #d0d5dd",
                borderRadius:
                  "8px",
                background: "#fff"
              }}
            >

              <option value="ALL">
                All Status
              </option>

              <option value="NEW">
                New
              </option>

              <option value="CONTACTED">
                Contacted
              </option>

              <option value="CLOSED">
                Closed
              </option>

            </select>

            <button
              type="button"
              onClick={loadEnquiries}
              disabled={loading}
              style={{
                padding:
                  "12px 18px",
                border:
                  "1px solid #d0d5dd",
                borderRadius:
                  "8px",
                background: "#fff",
                cursor:
                  loading
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600
              }}
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>

          </div>


          {error && (

            <div
              style={{
                marginBottom:
                  "20px",
                padding: "14px",
                borderRadius:
                  "8px",
                background:
                  "#fff1f2",
                border:
                  "1px solid #fecdd3",
                color: "#be123c"
              }}
            >
              {error}
            </div>

          )}


          {loading ? (

            <div
              style={{
                padding: "50px",
                textAlign:
                  "center",
                color: "#667085"
              }}
            >
              Loading enquiries...
            </div>

          ) : (

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>
                    <th>Student</th>
                    <th>Phone</th>
                    <th>Class</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredEnquiries.length ===
                  0 ? (

                    <tr>
                      <td colSpan={6}>
                        {enquiries.length === 0
                          ? "No enquiries found."
                          : "No enquiries match your search."
                        }
                      </td>
                    </tr>

                  ) : (

                    filteredEnquiries.map(
                      enquiry => (

                        <tr
                          key={
                            enquiry.enquiry_id
                          }
                        >

                          <td>

                            <strong>
                              {
                                enquiry.student_name
                              }
                            </strong>

                            {enquiry.parent_name && (
                              <div
                                style={{
                                  fontSize:
                                    "12px",
                                  color:
                                    "#667085",
                                  marginTop:
                                    "4px"
                                }}
                              >
                                Parent:{" "}
                                {
                                  enquiry.parent_name
                                }
                              </div>
                            )}

                          </td>

                          <td>
                            <a
                              href={
                                `tel:${enquiry.phone}`
                              }
                            >
                              {
                                enquiry.phone
                              }
                            </a>
                          </td>

                          <td>

                            {enquiry.class_level}

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#667085",
                                marginTop:
                                  "4px"
                              }}
                            >
                              {
                                enquiry.board
                              }
                            </div>

                          </td>

                          <td>
                            {
                              enquiry.course_interest
                            }
                          </td>

                          <td>

                            <span
                              style={{
                                display:
                                  "inline-block",
                                padding:
                                  "6px 10px",
                                borderRadius:
                                  "999px",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  700,
                                ...getStatusStyle(
                                  enquiry.status
                                )
                              }}
                            >
                              {
                                enquiry.status ||
                                "NEW"
                              }
                            </span>

                          </td>

                          <td>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedEnquiry(
                                  enquiry
                                )
                              }
                              style={{
                                padding:
                                  "8px 12px",
                                border:
                                  "1px solid #d0d5dd",
                                borderRadius:
                                  "7px",
                                background:
                                  "#fff",
                                cursor:
                                  "pointer",
                                fontWeight:
                                  600
                              }}
                            >
                              View
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>


      {/* ===================================================
          DETAILS MODAL
          =================================================== */}

      {selectedEnquiry && (

        <div
          onClick={() =>
            setSelectedEnquiry(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: "24px",
            zIndex: 1000
          }}
        >

          <div
            onClick={event =>
              event.stopPropagation()
            }
            style={{
              width:
                "min(760px, 100%)",
              maxHeight:
                "90vh",
              overflowY:
                "auto",
              background:
                "#fff",
              borderRadius:
                "16px",
              padding:
                "28px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,.2)"
            }}
          >

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                gap: "20px",
                alignItems:
                  "flex-start",
                marginBottom:
                  "24px"
              }}
            >

              <div>

                <div
                  style={{
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                    color:
                      "#667085",
                    textTransform:
                      "uppercase"
                  }}
                >
                  Enquiry Details
                </div>

                <h2
                  style={{
                    margin:
                      "6px 0 0",
                    fontSize:
                      "28px"
                  }}
                >
                  {
                    selectedEnquiry.student_name
                  }
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEnquiry(
                    null
                  )
                }
                style={{
                  border:
                    "none",
                  background:
                    "#f2f4f7",
                  borderRadius:
                    "50%",
                  width:
                    "38px",
                  height:
                    "38px",
                  cursor:
                    "pointer",
                  fontSize:
                    "20px"
                }}
              >
                ×
              </button>

            </div>


            {/* STATUS */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                padding:
                  "14px",
                borderRadius:
                  "10px",
                background:
                  "#f8fafc",
                marginBottom:
                  "22px"
              }}
            >

              <strong>
                Current Status
              </strong>

              <span
                style={{
                  padding:
                    "6px 12px",
                  borderRadius:
                    "999px",
                  fontWeight:
                    700,
                  ...getStatusStyle(
                    selectedEnquiry.status
                  )
                }}
              >
                {
                  selectedEnquiry.status
                }
              </span>

            </div>


            {/* COMPLETE DETAILS */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap:
                  "18px",
                marginBottom:
                  "22px"
              }}
            >

              <Detail
                label="Respondent"
                value={
                  selectedEnquiry.respondent_type
                }
              />

              <Detail
                label="Student Name"
                value={
                  selectedEnquiry.student_name
                }
              />

              <Detail
                label="Parent / Guardian"
                value={
                  selectedEnquiry.parent_name
                }
              />

              <Detail
                label="Phone"
                value={
                  selectedEnquiry.phone
                }
              />

              <Detail
                label="Email"
                value={
                  selectedEnquiry.email
                }
              />

              <Detail
                label="Class"
                value={
                  selectedEnquiry.class_level
                }
              />

              <Detail
                label="Board"
                value={
                  selectedEnquiry.board
                }
              />

              <Detail
                label="Course"
                value={
                  selectedEnquiry.course_interest
                }
              />

              <Detail
                label="Submitted"
                value={
                  formatDate(
                    selectedEnquiry.submitted_at
                  )
                }
              />

              <Detail
                label="Last Updated"
                value={
                  formatDate(
                    selectedEnquiry.updated_at
                  )
                }
              />

              <Detail
                label="Enquiry ID"
                value={
                  selectedEnquiry.enquiry_id
                }
              />

            </div>


            {/* MESSAGE */}

            <div
              style={{
                marginBottom:
                  "24px"
              }}
            >

              <div
                style={{
                  fontSize:
                    "13px",
                  fontWeight:
                    700,
                  color:
                    "#667085",
                  marginBottom:
                    "7px"
                }}
              >
                STUDENT / PARENT ENQUIRY
              </div>

              <div
                style={{
                  padding:
                    "16px",
                  background:
                    "#f8fafc",
                  borderRadius:
                    "10px",
                  lineHeight:
                    1.6,
                  whiteSpace:
                    "pre-wrap"
                }}
              >
                {
                  selectedEnquiry.message ||
                  "No message provided."
                }
              </div>

            </div>


            {/* ACTIONS */}

            <div
              style={{
                display:
                  "flex",
                gap:
                  "10px",
                flexWrap:
                  "wrap"
              }}
            >

              <a
                href={
                  `tel:${selectedEnquiry.phone}`
                }
                style={{
                  padding:
                    "11px 16px",
                  borderRadius:
                    "8px",
                  background:
                    "#111827",
                  color:
                    "#fff",
                  textDecoration:
                    "none",
                  fontWeight:
                    700
                }}
              >
                📞 Call Student
              </a>


              {selectedEnquiry.email && (

                <a
                  href={
                    `mailto:${selectedEnquiry.email}`
                  }
                  style={{
                    padding:
                      "11px 16px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #d0d5dd",
                    color:
                      "#111827",
                    textDecoration:
                      "none",
                    fontWeight:
                      700
                  }}
                >
                  ✉️ Email
                </a>

              )}


              {selectedEnquiry.status !==
                "CONTACTED" && (

                <button
                  type="button"
                  disabled={
                    updatingId ===
                    selectedEnquiry.enquiry_id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedEnquiry,
                      "CONTACTED"
                    )
                  }
                  style={{
                    padding:
                      "11px 16px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #16a34a",
                    background:
                      "#16a34a",
                    color:
                      "#fff",
                    cursor:
                      "pointer",
                    fontWeight:
                      700
                  }}
                >
                  {updatingId ===
                  selectedEnquiry.enquiry_id
                    ? "Updating..."
                    : "✓ Mark as Contacted"
                  }
                </button>

              )}


              {selectedEnquiry.status ===
                "CONTACTED" && (

                <button
                  type="button"
                  disabled={
                    updatingId ===
                    selectedEnquiry.enquiry_id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedEnquiry,
                      "NEW"
                    )
                  }
                  style={{
                    padding:
                      "11px 16px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #2563eb",
                    background:
                      "#fff",
                    color:
                      "#2563eb",
                    cursor:
                      "pointer",
                    fontWeight:
                      700
                  }}
                >
                  {updatingId ===
                  selectedEnquiry.enquiry_id
                    ? "Updating..."
                    : "↩ Mark as Not Contacted"
                  }
                </button>

              )}


              {selectedEnquiry.status !==
                "CLOSED" && (

                <button
                  type="button"
                  disabled={
                    updatingId ===
                    selectedEnquiry.enquiry_id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedEnquiry,
                      "CLOSED"
                    )
                  }
                  style={{
                    padding:
                      "11px 16px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #d0d5dd",
                    background:
                      "#fff",
                    color:
                      "#344054",
                    cursor:
                      "pointer",
                    fontWeight:
                      700
                  }}
                >
                  Close Enquiry
                </button>

              )}


              {selectedEnquiry.status ===
                "CLOSED" && (

                <button
                  type="button"
                  disabled={
                    updatingId ===
                    selectedEnquiry.enquiry_id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedEnquiry,
                      "NEW"
                    )
                  }
                  style={{
                    padding:
                      "11px 16px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #2563eb",
                    background:
                      "#fff",
                    color:
                      "#2563eb",
                    cursor:
                      "pointer",
                    fontWeight:
                      700
                  }}
                >
                  Reopen Enquiry
                </button>

              )}

            </div>

          </div>

        </div>

      )}

    </main>

  );

}


/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value
}: {
  label: string;
  value: number;
}) {

  return (

    <div className="page-card">

      <div
        style={{
          color:
            "#667085",
          fontWeight:
            700,
          fontSize:
            "14px"
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize:
            "34px",
          fontWeight:
            700,
          marginTop:
            "8px"
        }}
      >
        {value}
      </div>

    </div>

  );

}


/* =========================================================
   DETAIL
   ========================================================= */

function Detail({
  label,
  value
}: {
  label: string;
  value: string;
}) {

  return (

    <div>

      <div
        style={{
          fontSize:
            "12px",
          fontWeight:
            700,
          color:
            "#667085",
          marginBottom:
            "5px",
          textTransform:
            "uppercase"
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize:
            "15px",
          color:
            "#101828",
          wordBreak:
            "break-word"
        }}
      >
        {value || "—"}
      </div>

    </div>

  );

}


export default StudentEnquiries;
