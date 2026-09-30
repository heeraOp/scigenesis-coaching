import type { ChangeEvent, CSSProperties, FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface CourseOption {
  course_id: string;
  title: string;
}

interface EnquiryFormData {
  respondentType: "Student" | "Parent / Guardian" | "";
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  classLevel: string;
  board: string;
  courseInterest: string;
  message: string;
  website: string;
}

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

const INITIAL_FORM: EnquiryFormData = {
  respondentType: "",
  studentName: "",
  parentName: "",
  phone: "",
  email: "",
  classLevel: "",
  board: "",
  courseInterest: "",
  message: "",
  website: "",
};

const institute = {
  name: "SciGenesis Coaching Institute",
  shortName: "SCI",
  phone: "+91 70856 37173",
  email: "scigenesiscoachinginstitute@gmail.com",
  location:
    "Kwakeithel Soibam Leikai, Near Water Reservoir / Photon School, Imphal-795001",
};

function Enquiry() {
  const [form, setForm] = useState<EnquiryFormData>(INITIAL_FORM);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submittedId, setSubmittedId] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      if (!API_URL) {
        setIsLoadingCourses(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}?action=getCourses`
        );

        if (!response.ok) {
          throw new Error("Unable to load courses.");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.courses)) {
          throw new Error(
            data.error || "Unable to load courses."
          );
        }

        const activeCourses: CourseOption[] = data.courses
          .map((item: Record<string, unknown>) => ({
            course_id: String(item.course_id ?? "").trim(),
            title:
              String(item.title ?? "").trim() ||
              "Untitled Course",
          }))
          .filter(
            (item: CourseOption) => item.course_id !== ""
          );

        setCourses(activeCourses);

        if (activeCourses.length === 1) {
          setForm((previous) => ({
            ...previous,
            courseInterest: activeCourses[0].title,
          }));
        }
      } catch (error) {
        console.error("Failed to load enquiry courses:", error);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setSubmittedId("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!API_URL) {
      setMessage(
        "The enquiry service is not configured. Please call the institute directly."
      );
      return;
    }

    if (!form.respondentType) {
      setMessage("Please select whether you are a student or parent/guardian.");
      return;
    }

    if (!form.studentName.trim()) {
      setMessage("Please enter the student's name.");
      return;
    }

    if (!form.phone.trim()) {
      setMessage("Please enter a phone number.");
      return;
    }

    if (!form.classLevel) {
      setMessage("Please select the student's current class.");
      return;
    }

    if (!form.board) {
      setMessage("Please select the board.");
      return;
    }

    if (!form.courseInterest) {
      setMessage("Please select the course you are interested in.");
      return;
    }

    if (!form.message.trim()) {
      setMessage("Please enter your enquiry.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Submitting your enquiry...");
    setSubmittedId("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "submitEnquiry",
          enquiry: {
            respondent_type: form.respondentType,
            student_name: form.studentName.trim(),
            parent_name: form.parentName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            class_level: form.classLevel,
            board: form.board,
            course_interest: form.courseInterest,
            message: form.message.trim(),
            website: form.website,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to submit your enquiry."
        );
      }

      setSubmittedId(String(data.enquiry_id ?? ""));
      setMessage(
        "Your enquiry has been submitted successfully. The institute will contact you soon."
      );

      setForm(INITIAL_FORM);
    } catch (error) {
      console.error("Failed to submit enquiry:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit your enquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const phoneNumber = institute.phone.replace(/\s/g, "");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f8fa",
        padding: "48px 20px 70px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "#eef2ff",
              color: "#3730a3",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {institute.shortName} • Enquiry
          </div>

          <h1
            style={{
              margin: "14px 0 10px",
              fontSize: "clamp(30px, 5vw, 46px)",
              lineHeight: 1.1,
              color: "#111827",
            }}
          >
            Have a question? Talk to SCI.
          </h1>

          <p
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              color: "#6b7280",
              lineHeight: 1.7,
              fontSize: "15px",
            }}
          >
            Submit your details and your enquiry. Our team can then contact
            you regarding courses, admission, fees and class information.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.75fr)",
            gap: "22px",
            alignItems: "start",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 8px 30px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              <Field label="I am a" required>
                <select
                  name="respondentType"
                  value={form.respondentType}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="Student">Student</option>
                  <option value="Parent / Guardian">
                    Parent / Guardian
                  </option>
                </select>
              </Field>

              <Field label="Student Name" required>
                <input
                  name="studentName"
                  value={form.studentName}
                  onChange={handleChange}
                  placeholder="Enter student's full name"
                  style={inputStyle}
                  autoComplete="name"
                />
              </Field>

              <Field label="Parent / Guardian Name">
                <input
                  name="parentName"
                  value={form.parentName}
                  onChange={handleChange}
                  placeholder="Parent or guardian name"
                  style={inputStyle}
                />
              </Field>

              <Field label="Phone Number" required>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  type="tel"
                  inputMode="tel"
                  style={inputStyle}
                  autoComplete="tel"
                />
              </Field>

              <Field label="Email Address">
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  type="email"
                  style={inputStyle}
                  autoComplete="email"
                />
              </Field>

              <Field label="Current Class" required>
                <select
                  name="classLevel"
                  value={form.classLevel}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select class</option>
                  <option value="Class XI">Class XI</option>
                  <option value="Class XII">Class XII</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Board" required>
                <select
                  name="board"
                  value={form.board}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select board</option>
                  <option value="CBSE">CBSE</option>
                  <option value="COHSEM">COHSEM</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Course of Interest" required>
                <select
                  name="courseInterest"
                  value={form.courseInterest}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={isLoadingCourses}
                >
                  <option value="">
                    {isLoadingCourses
                      ? "Loading courses..."
                      : "Select course"}
                  </option>

                  {courses.map((course) => (
                    <option
                      key={course.course_id}
                      value={course.title}
                    >
                      {course.title}
                    </option>
                  ))}

                  {!isLoadingCourses && courses.length === 0 && (
                    <option value="Other / General Enquiry">
                      Other / General Enquiry
                    </option>
                  )}
                </select>
              </Field>
            </div>

            <div style={{ marginTop: "18px" }}>
              <Field label="Your Enquiry" required>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what you would like to know..."
                  rows={6}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "140px",
                  }}
                />
              </Field>
            </div>

            {/* Honeypot field for simple bot protection. */}
            <div
              style={{
                position: "absolute",
                left: "-10000px",
                width: "1px",
                height: "1px",
                overflow: "hidden",
              }}
              aria-hidden="true"
            >
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                value={form.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {message && (
              <div
                role="status"
                style={{
                  marginTop: "18px",
                  padding: "12px 14px",
                  borderRadius: "9px",
                  background: submittedId ? "#ecfdf5" : "#fff7ed",
                  border: submittedId
                    ? "1px solid #a7f3d0"
                    : "1px solid #fed7aa",
                  color: submittedId ? "#047857" : "#9a3412",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {message}
                {submittedId && (
                  <strong style={{ display: "block", marginTop: "5px" }}>
                    Enquiry ID: {submittedId}
                  </strong>
                )}
              </div>
            )}

            <div
              style={{
                marginTop: "22px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setForm(INITIAL_FORM);
                  setMessage("");
                  setSubmittedId("");
                }}
                disabled={isSubmitting}
                style={secondaryButtonStyle}
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...primaryButtonStyle,
                  opacity: isSubmitting ? 0.65 : 1,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Enquiry"}
              </button>
            </div>
          </form>

          <aside
            style={{
              background: "#111827",
              color: "#ffffff",
              borderRadius: "18px",
              padding: "26px",
              position: "sticky",
              top: "24px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Contact SCI
            </span>

            <h2
              style={{
                margin: "10px 0 12px",
                fontSize: "25px",
                lineHeight: 1.2,
              }}
            >
              We are here to help.
            </h2>

            <p
              style={{
                margin: "0 0 24px",
                color: "#d1d5db",
                lineHeight: 1.7,
                fontSize: "14px",
              }}
            >
              You can also contact the institute directly if your enquiry is
              urgent.
            </p>

            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              <a
                href={`tel:${phoneNumber}`}
                style={darkLinkStyle}
              >
                📞 {institute.phone}
              </a>

              <a
                href={`mailto:${institute.email}`}
                style={darkLinkStyle}
              >
                ✉️ {institute.email}
              </a>

              <div
                style={{
                  color: "#d1d5db",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                📍 {institute.location}
              </div>
            </div>

            <div
              style={{
                marginTop: "26px",
                paddingTop: "20px",
                borderTop: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Link
                to="/"
                style={{
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                ← Back to website
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      style={{
        display: "block",
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: "8px",
          color: "#374151",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#dc2626" }}> *</span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "15px",
  outline: "none",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "12px 20px",
  border: "1px solid #d1d5db",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
};

const primaryButtonStyle: CSSProperties = {
  padding: "12px 22px",
  border: "none",
  borderRadius: "9px",
  background: "#111827",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
};

const darkLinkStyle: CSSProperties = {
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "14px",
  lineHeight: 1.5,
};

export default Enquiry;
