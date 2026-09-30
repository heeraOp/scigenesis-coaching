import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./../styles/pages.css";

/* =========================================================
   APPS SCRIPT API
   ========================================================= */

const API_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL;


/* =========================================================
   TYPES
   ========================================================= */

interface Course {
  course_id?: string;
  title: string;
  duration?: string | number;
  start_date?: string;
  boards?: string;
  timing?: string;
  description?: string;
  status?: string;
  image_file_id?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  _rowNumber?: number;
}


interface CourseSubject {
  subject_id?: string;
  course_id?: string;
  subject_name: string;
  subject_code?: string;
  display_order?: number;
  status?: string;
}


/* =========================================================
   HELPERS
   ========================================================= */

function formatCourseDate(
  value?: string
): string {
  if (!value || String(value).trim() === "") {
    return "—";
  }

  const normalized = String(value).slice(0, 10);
  const date = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


function getCourseTimestamp(
  value: unknown
): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}


function selectLatestCourse(
  courses: Course[]
): Course | null {
  if (courses.length === 0) {
    return null;
  }

  return [...courses].sort((a, b) => {
    const updatedDifference =
      getCourseTimestamp(b.updated_at) -
      getCourseTimestamp(a.updated_at);

    if (updatedDifference !== 0) {
      return updatedDifference;
    }

    const createdDifference =
      getCourseTimestamp(b.created_at) -
      getCourseTimestamp(a.created_at);

    if (createdDifference !== 0) {
      return createdDifference;
    }

    return (
      Number(b._rowNumber ?? 0) -
      Number(a._rowNumber ?? 0)
    );
  })[0];
}


function isActiveCourse(
  course: Course
): boolean {
  const status = String(course.status ?? "")
    .trim()
    .toUpperCase();

  return status === "" || status === "ACTIVE";
}


/* =========================================================
   COMPONENT
   ========================================================= */

function Courses() {
  const [course, setCourse] =
    useState<Course | null>(null);

  const [subjects, setSubjects] =
    useState<CourseSubject[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =======================================================
     LOAD CURRENT COURSE
     ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadCourse = async () => {
      if (!API_URL) {
        if (isMounted) {
          setError(
            "Course service is not configured."
          );
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        /* --------------------------------------------------
           GET ALL COURSES
           -------------------------------------------------- */

        const coursesResponse = await fetch(
          `${API_URL}?action=getCourses`
        );

        if (!coursesResponse.ok) {
          throw new Error(
            `Course request failed with status ${coursesResponse.status}.`
          );
        }

        const coursesData =
          await coursesResponse.json();

        if (
          !coursesData.success ||
          !Array.isArray(coursesData.courses)
        ) {
          throw new Error(
            coursesData.error ||
              "Unable to load courses."
          );
        }

        /* --------------------------------------------------
           KEEP ONLY ACTIVE COURSES
           -------------------------------------------------- */

        const activeCourses =
          coursesData.courses.filter(
            (item: Course) =>
              isActiveCourse(item)
          );

        if (activeCourses.length === 0) {
          if (isMounted) {
            setCourse(null);
            setSubjects([]);
            setError(
              "No active course is currently available."
            );
          }
          return;
        }

        /* --------------------------------------------------
           SELECT LATEST / CURRENT COURSE
           -------------------------------------------------- */

        const selectedCourse =
          selectLatestCourse(activeCourses);

        if (!selectedCourse) {
          throw new Error(
            "Unable to determine the current course."
          );
        }

        const courseId = String(
          selectedCourse.course_id ?? ""
        ).trim();

        let courseDetails = selectedCourse;
        let courseSubjects: CourseSubject[] = [];

        /* --------------------------------------------------
           GET COURSE DETAILS + SUBJECTS
           -------------------------------------------------- */

        if (courseId) {
          const courseResponse = await fetch(
            `${API_URL}?action=getCourse&course_id=${encodeURIComponent(
              courseId
            )}`
          );

          if (!courseResponse.ok) {
            throw new Error(
              `Course details request failed with status ${courseResponse.status}.`
            );
          }

          const courseData =
            await courseResponse.json();

          if (
            !courseData.success ||
            !courseData.course
          ) {
            throw new Error(
              courseData.error ||
                "Unable to load course details."
            );
          }

          courseDetails = courseData.course;

          if (
            Array.isArray(courseData.subjects)
          ) {
            courseSubjects =
              courseData.subjects
                .map(
                  (
                    item: Record<
                      string,
                      unknown
                    >
                  ) => ({
                    subject_id: String(
                      item.subject_id ?? ""
                    ),
                    course_id: String(
                      item.course_id ??
                        courseId
                    ),
                    subject_name: String(
                      item.subject_name ??
                        item.subject ??
                        item.name ??
                        ""
                    ).trim(),
                    subject_code: String(
                      item.subject_code ?? ""
                    ),
                    display_order: Number(
                      item.display_order ?? 0
                    ),
                    status: String(
                      item.status ?? "ACTIVE"
                    ),
                  })
                )
                .filter(
                  (item: CourseSubject) =>
                    item.subject_name !== "" &&
                    String(
                      item.status ?? "ACTIVE"
                    )
                      .trim()
                      .toUpperCase() ===
                      "ACTIVE"
                )
                .sort(
                  (
                    a: CourseSubject,
                    b: CourseSubject
                  ) =>
                    Number(
                      a.display_order ?? 0
                    ) -
                    Number(
                      b.display_order ?? 0
                    )
                );
          }
        }

        if (isMounted) {
          setCourse(courseDetails);
          setSubjects(courseSubjects);
        }
      } catch (loadError) {
        console.error(
          "Failed to load public course:",
          loadError
        );

        if (isMounted) {
          setCourse(null);
          setSubjects([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load course information."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, []);


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main className="page">

      <section className="page-hero">
        <div className="container page-hero-content">
          <span className="page-label">
            Courses
          </span>

          <h1>
            Science coaching built around strong foundations.
          </h1>

          <p>
            Explore the current foundation programme offered by
            SciGenesis Coaching Institute.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="container">

          {isLoading && (
            <div className="empty-state">
              <h3>Loading current course...</h3>
              <p>
                Fetching the latest course information.
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="empty-state">
              <h3>Course information unavailable</h3>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && course && (
            <article className="page-card">

              <span className="page-card-label">
                Current Course
                {course.start_date
                  ? ` • ${String(course.start_date).slice(0, 4)}`
                  : ""}
              </span>

              <h2>
                {course.title || "Untitled Course"}
              </h2>

              <p>
                {course.description ||
                  "A structured science programme designed to build strong academic foundations."}
              </p>

              <div className="info-list">

                <div className="info-row">
                  <span>Duration</span>
                  <strong>
                    {course.duration || "—"}
                  </strong>
                </div>

                <div className="info-row">
                  <span>Start Date</span>
                  <strong>
                    {formatCourseDate(
                      course.start_date
                    )}
                  </strong>
                </div>

                <div className="info-row">
                  <span>Boards</span>
                  <strong>
                    {course.boards || "—"}
                  </strong>
                </div>

                <div className="info-row">
                  <span>Timing</span>
                  <strong>
                    {course.timing || "—"}
                  </strong>
                </div>

                <div className="info-row">
                  <span>Subjects</span>
                  <strong>
                    {subjects.length > 0
                      ? subjects
                          .map(
                            (subject) =>
                              subject.subject_name
                          )
                          .join(" • ")
                      : "—"}
                  </strong>
                </div>

              </div>

              <div className="admin-actions">
                <Link
                  to="/enquiry"
                  className="page-button page-button-primary"
                >
                  Submit Enquiry
                </Link>
              </div>

            </article>
          )}

        </div>
      </section>

    </main>
  );
}

export default Courses;
