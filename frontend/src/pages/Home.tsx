import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Home.css";


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
  duration: string;
  start_date: string;
  boards: string;
  timing: string;
  image_file_id?: string;
  image_url?: string;
  description?: string;
  status?: string;
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
   STATIC INSTITUTE DATA
   ========================================================= */

const instituteData = {
  name: "SciGenesis Coaching Institute",

  shortName: "SCI",

  tagline:
    "Quality Guidance • Better Results • Bright Future",

  badge:
    "Class XI & XII • Science",

  specialization:
    "Specialises in in-person classes",

  location:
    "Kwakeithel Soibam Leikai, Near Water Reservoir / Photon School, Imphal-795001",

  phone:
    "+91 70856 37173",

  email:
    "scigenesiscoachinginstitute@gmail.com",

  sessionYear:
    "2026",

  features: [
    {
      id: "01",
      title: "Audio-Visual Classes",
      desc:
        "Interactive classroom learning supported by multimedia presentations.",
    },

    {
      id: "02",
      title: "Printed Study Materials",
      desc:
        "Learning and reference materials are provided to support classroom study.",
    },

    {
      id: "03",
      title: "Experienced Faculties",
      desc:
        "Guidance from well-experienced teaching faculty.",
    },

    {
      id: "04",
      title: "Compulsory Study Sessions",
      desc:
        "Structured study sessions designed to support regular academic preparation.",
    },

    {
      id: "05",
      title: "Affordable Fees",
      desc:
        "A coaching option designed with affordability in mind.",
    },

    {
      id: "06",
      title: "Specific Route Van Service",
      desc:
        "Van service is available on specific routes for student convenience.",
    },
  ],
};


/* =========================================================
   DEFAULT COURSE
   Used only while API data is loading or unavailable.
   ========================================================= */

const DEFAULT_COURSE: Course = {
  title:
    "Class XI Foundation Course",

  duration:
    "5 Months",

  start_date:
    "2026-06-04",

  boards:
    "CBSE & COHSEM",

  timing:
    "4:30 PM – 7:15 PM",

  image_url:
    "",

  status:
    "ACTIVE",
};


const DEFAULT_SUBJECTS: CourseSubject[] = [
  {
    subject_id: "01",
    subject_name: "Physics",
    display_order: 1,
    status: "ACTIVE",
  },

  {
    subject_id: "02",
    subject_name: "Chemistry",
    display_order: 2,
    status: "ACTIVE",
  },

  {
    subject_id: "03",
    subject_name: "Biology",
    display_order: 3,
    status: "ACTIVE",
  },
];


/* =========================================================
   DATE FORMATTER
   ========================================================= */

function formatCourseDate(
  dateValue: string
) {

  if (
    !dateValue ||
    String(dateValue).trim() === ""
  ) {
    return "";
  }


  const normalizedDate =
    String(dateValue).slice(0, 10);


  const date =
    new Date(
      `${normalizedDate}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(dateValue);
  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

}


/* =========================================================
   TIMESTAMP HELPER
   ========================================================= */

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


  /*
   * Handle numeric timestamps.
   */

  if (
    typeof value === "number"
  ) {

    return Number.isFinite(value)
      ? value
      : 0;

  }


  /*
   * Handle date strings.
   */

  const parsed =
    new Date(
      String(value)
    ).getTime();


  if (
    !Number.isNaN(parsed)
  ) {

    return parsed;

  }


  return 0;

}


/* =========================================================
   SELECT LATEST COURSE
   ========================================================= */

function selectLatestCourse(
  courses: Course[]
): Course | null {

  if (
    !courses ||
    courses.length === 0
  ) {

    return null;

  }


  /*
   * Make a copy so that the original
   * API array is not modified.
   */

  const sortedCourses =
    [...courses].sort(
      (
        a,
        b
      ) => {

        /*
         * First priority:
         * updated_at
         */

        const updatedA =
          getCourseTimestamp(
            a.updated_at
          );

        const updatedB =
          getCourseTimestamp(
            b.updated_at
          );


        if (
          updatedA !== updatedB
        ) {

          return (
            updatedB -
            updatedA
          );

        }


        /*
         * Second priority:
         * created_at
         */

        const createdA =
          getCourseTimestamp(
            a.created_at
          );

        const createdB =
          getCourseTimestamp(
            b.created_at
          );


        if (
          createdA !== createdB
        ) {

          return (
            createdB -
            createdA
          );

        }


        /*
         * Final fallback:
         * physical row number.
         *
         * Higher row number =
         * later row in Google Sheets.
         */

        return (
          Number(
            b._rowNumber || 0
          ) -
          Number(
            a._rowNumber || 0
          )
        );

      }
    );


  return (
    sortedCourses[0] ||
    null
  );

}


/* =========================================================
   HOME COMPONENT
   ========================================================= */

function Home() {

  /* -------------------------------------------------------
     COURSE STATE
     ------------------------------------------------------- */

  const [
    activeCourse,
    setActiveCourse
  ] =
    useState<Course>(
      DEFAULT_COURSE
    );


  const [
    subjects,
    setSubjects
  ] =
    useState<CourseSubject[]>(
      DEFAULT_SUBJECTS
    );


  const [
    isLoadingCourse,
    setIsLoadingCourse
  ] =
    useState(true);


  const [
    courseError,
    setCourseError
  ] =
    useState("");


  /* -------------------------------------------------------
     STATIC DATA
     ------------------------------------------------------- */

  const {
    name,
    shortName,
    tagline,
    badge,
    specialization,
    location,
    phone,
    email,
    features,
  } = instituteData;


  const phoneNumber =
    phone.replace(
      /\s/g,
      ""
    );


  /* =======================================================
     LOAD LATEST COURSE FROM APPS SCRIPT
     ======================================================= */

  useEffect(() => {

    const loadCourse =
      async () => {

        /*
         * API URL is required.
         */

        if (!API_URL) {

          console.error(
            "VITE_APPS_SCRIPT_URL is not configured."
          );

          setCourseError(
            "Course data is currently unavailable."
          );

          setIsLoadingCourse(
            false
          );

          return;

        }


        try {

          setIsLoadingCourse(
            true
          );

          setCourseError("");


          /* ------------------------------------------------
             GET ALL COURSES
             ------------------------------------------------ */

          const coursesResponse =
            await fetch(
              `${API_URL}?action=getCourses`
            );


          if (
            !coursesResponse.ok
          ) {

            throw new Error(
              `Course request failed with status ${coursesResponse.status}`
            );

          }


          const coursesData =
            await coursesResponse.json();


          if (
            !coursesData.success ||
            !Array.isArray(
              coursesData.courses
            )
          ) {

            throw new Error(
              coursesData.error ||
              "Unable to load courses."
            );

          }


          /* ------------------------------------------------
             CONVERT API COURSES
             ------------------------------------------------ */

          const allCourses:
            Course[] =
            coursesData.courses.map(
              (
                item: Course
              ) => ({
                ...item,
              })
            );


          /* ------------------------------------------------
             FILTER ACTIVE COURSES
             ------------------------------------------------ */

          const availableCourses =
            allCourses.filter(
              (
                item
              ) => {

                const status =
                  String(
                    item.status ??
                    ""
                  )
                    .trim()
                    .toUpperCase();


                return (
                  status === "" ||
                  status === "ACTIVE"
                );

              }
            );


          if (
            availableCourses.length ===
            0
          ) {

            throw new Error(
              "No active course is currently available."
            );

          }


          /* ------------------------------------------------
             IMPORTANT:
             SELECT THE LATEST COURSE
             ------------------------------------------------ */

          const selectedCourse =
            selectLatestCourse(
              availableCourses
            );


          if (
            !selectedCourse
          ) {

            throw new Error(
              "Unable to determine the latest course."
            );

          }


          console.log(
            "All courses received:",
            availableCourses
          );


          console.log(
            "Latest course selected:",
            selectedCourse
          );


          const courseId =
            String(
              selectedCourse.course_id ??
              ""
            ).trim();


          /* ------------------------------------------------
             GET SELECTED COURSE DETAILS
             INCLUDING SUBJECTS
             ------------------------------------------------ */

          let courseDetails:
            Course =
            selectedCourse;


          let courseSubjects:
            CourseSubject[] =
            [];


          if (
            courseId
          ) {

            const courseResponse =
              await fetch(
                `${API_URL}?action=getCourse&course_id=${encodeURIComponent(
                  courseId
                )}`
              );


            if (
              !courseResponse.ok
            ) {

              throw new Error(
                `Course details request failed with status ${courseResponse.status}`
              );

            }


            const courseData =
              await courseResponse.json();


            console.log(
              "Selected course details:",
              courseData
            );


            if (
              courseData.success &&
              courseData.course
            ) {

              courseDetails =
                courseData.course;

            }


            /* ------------------------------------------------
               LOAD SUBJECTS
               ------------------------------------------------ */

            if (
              Array.isArray(
                courseData.subjects
              )
            ) {

              courseSubjects =
                courseData.subjects
                  .map(
                    (
                      subject:
                        Record<
                          string,
                          unknown
                        >
                    ) => {

                      return {

                        subject_id:
                          String(
                            subject.subject_id ??
                            ""
                          ),

                        course_id:
                          String(
                            subject.course_id ??
                            courseId
                          ),

                        subject_name:
                          String(
                            subject.subject_name ??
                            subject.subject ??
                            subject.name ??
                            ""
                          ).trim(),

                        subject_code:
                          String(
                            subject.subject_code ??
                            ""
                          ),

                        display_order:
                          Number(
                            subject.display_order ??
                            0
                          ),

                        status:
                          String(
                            subject.status ??
                            "ACTIVE"
                          ),

                      };

                    }
                  )
                  .filter(
                    (
                      subject:CourseSubject
                    ) =>
                      subject.subject_name !==
                      ""
                  )
                  .filter(
                    (subject: CourseSubject) => {

                      const status =
                        String(
                          subject.status ??
                          ""
                        )
                          .trim()
                          .toUpperCase();


                      return (
                        status === "" ||
                        status === "ACTIVE"
                      );

                    }
                  )
                  .sort(
                    (
                      a: CourseSubject,

                      b: CourseSubject
                    ) =>
                      Number(
                        a.display_order ??
                        0
                      ) -
                      Number(
                        b.display_order ??
                        0
                      )
                  );

            }

          }


          /* ------------------------------------------------
             UPDATE COURSE STATE
             ------------------------------------------------ */

          setActiveCourse({

            ...DEFAULT_COURSE,

            ...courseDetails,

            title:
              String(
                courseDetails.title ??
                DEFAULT_COURSE.title
              ),

            duration:
              String(
                courseDetails.duration ??
                DEFAULT_COURSE.duration
              ),

            start_date:
              String(
                courseDetails.start_date ??
                courseDetails.start_date ??
                DEFAULT_COURSE.start_date
              ),

            boards:
              String(
                courseDetails.boards ??
                DEFAULT_COURSE.boards
              ),

            timing:
              String(
                courseDetails.timing ??
                DEFAULT_COURSE.timing
              ),

            image_url:
              String(
                courseDetails.image_url ??
                courseDetails.image_url ??
                ""
              ),

          });


          /* ------------------------------------------------
             UPDATE SUBJECT STATE
             ------------------------------------------------ */

          if (
            courseSubjects.length > 0
          ) {

            setSubjects(
              courseSubjects
            );

          } else {

            /*
             * If the selected course has
             * no subjects, show an empty
             * list instead of incorrectly
             * displaying the default subjects.
             */

            setSubjects([]);

          }


        } catch (
          error
        ) {

          console.error(
            "Failed to load public course:",
            error
          );


          /*
           * Keep default course data
           * so the website does not
           * completely break.
           */

          setCourseError(
            error instanceof Error
              ? error.message
              : "Unable to load course information."
          );

        } finally {

          setIsLoadingCourse(
            false
          );

        }

      };


    loadCourse();

  }, []);


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div className="home-page">


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">

        <div className="container hero-content">


          {/* Hero Content */}

          <div className="hero-text">

            <span className="hero-badge">
              {badge}
            </span>


            <p className="hero-kicker">
              {tagline}
            </p>


            <h1>
              Strong foundations.

              <span>
                Better preparation.
              </span>
            </h1>


            <p className="hero-description">

              {name}{" "}

              {specialization.toLowerCase()},

              with structured academic
              support, study materials and
              dedicated learning sessions.

            </p>


            <div className="hero-actions">

              <Link
                to="/courses"
                className="primary-btn"
              >
                View Course
              </Link>


              <Link
                to="/enquiry"
                className="secondary-btn"
              >
                Submit Enquiry
              </Link>

            </div>


            <div className="hero-contact">

              <a
                href={`tel:${phoneNumber}`}
              >
                {phone}
              </a>

              <span>
                •
              </span>

              <span>
                Imphal, Manipur
              </span>

            </div>

          </div>


          {/* =================================================
              COURSE CARD
          ================================================= */}

          <div className="hero-card">


            <div className="hero-card-top">

              <span>
                {shortName} • COURSE
              </span>

              <span>
                {isLoadingCourse
                  ? "Loading..."
                  : activeCourse.duration}
              </span>

            </div>


            <div className="hero-card-content">

              <p className="course-label">
                FOUNDATION COURSE
              </p>


              <h2>
                {activeCourse.title}
              </h2>


              <p className="course-boards">
                {activeCourse.boards}
              </p>

            </div>


            {/* Course Image */}

            {activeCourse.image_url && (

              <div
                style={{
                  width: "100%",
                  marginBottom: "20px",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >

                <img
                  src={
                    activeCourse.image_url
                  }
                  alt={
                    activeCourse.title
                  }
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

              </div>

            )}


            <div className="course-details">

              <div>

                <span>
                  Start Date
                </span>

                <strong>
                  {formatCourseDate(
                    activeCourse.start_date
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Class Timing
                </span>

                <strong>
                  {activeCourse.timing}
                </strong>

              </div>

            </div>


            <div className="subject-heading">
              Subjects
            </div>


            <div className="hero-stat-grid">

              {subjects.map(
                (
                  subject,
                  index
                ) => (

                  <div
                    className="subject-card"
                    key={
                      subject.subject_id ||
                      `${subject.subject_name}-${index}`
                    }
                  >

                    <strong>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </strong>

                    <span>
                      {subject.subject_name}
                    </span>

                  </div>

                )
              )}

            </div>


          </div>

        </div>

      </section>


      {/* =====================================================
          CURRENT COURSE
      ===================================================== */}

      <section className="course-highlight">

        <div className="container">


          <div className="section-heading">

            <span>
              Current Course
            </span>


            <h2>
              {activeCourse.title}
            </h2>


            <p>
              A{" "}
              {activeCourse.duration.toLowerCase()}{" "}
              foundation programme for
              students studying under{" "}
              {activeCourse.boards}.
            </p>

          </div>


          <div className="course-info-grid">


            <div className="course-info-card">

              <span>
                Duration
              </span>

              <strong>
                {activeCourse.duration}
              </strong>

            </div>


            <div className="course-info-card">

              <span>
                Boards
              </span>

              <strong>
                {activeCourse.boards}
              </strong>

            </div>


            <div className="course-info-card">

              <span>
                Timing
              </span>

              <strong>
                {activeCourse.timing}
              </strong>

            </div>


            <div className="course-info-card">

              <span>
                Subjects
              </span>

              <strong>

                {subjects.length > 0
                  ? subjects
                      .map(
                        (
                          subject
                        ) =>
                          subject.subject_name
                      )
                      .join(" • ")
                  : "—"}

              </strong>

            </div>


          </div>

        </div>

      </section>


      {/* =====================================================
          WHY SCI
      ===================================================== */}

      <section className="quick-section">

        <div className="container">


          <div className="section-heading">

            <span>
              Why SCI
            </span>


            <h2>
              Learning designed around
              students
            </h2>


            <p>
              SCI combines classroom
              instruction with structured
              academic support and learning
              resources.
            </p>

          </div>


          <div className="quick-grid">

            {features.map(
              (feature) => (

                <article
                  className="quick-card"
                  key={feature.id}
                >

                  <div className="quick-icon">
                    {feature.id}
                  </div>


                  <h3>
                    {feature.title}
                  </h3>


                  <p>
                    {feature.desc}
                  </p>

                </article>

              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          SCIENCE SUBJECTS
      ===================================================== */}

      <section className="subjects-section">

        <div className="container subjects-layout">


          <div className="subjects-text">

            <span className="section-label">
              Science Stream
            </span>


            <h2>
              Focused learning for

              <span>
                science students.
              </span>
            </h2>


            <p>

              The foundation course covers
              the core science subjects of{" "}

              {subjects.length > 0
                ? subjects
                    .map(
                      (
                        subject
                      ) =>
                        subject.subject_name
                    )
                    .join(", ")
                : "science"}.

            </p>


            <Link
              to="/courses"
              className="primary-btn"
            >
              Explore Course Details
            </Link>

          </div>


          <div className="subjects-list">

            {subjects.map(
              (
                subject,
                index
              ) => (

                <div
                  className="subject-row"
                  key={
                    subject.subject_id ||
                    `${subject.subject_name}-${index}`
                  }
                >

                  <span>
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>


                  <strong>
                    {subject.subject_name}
                  </strong>

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          CONTACT / ENQUIRY
      ===================================================== */}

      <section className="enquiry-section">

        <div className="container enquiry-box">


          <div className="enquiry-content">

            <span>
              Visit SCI
            </span>


            <h2>
              Have questions about the
              course?
            </h2>


            <p>
              Contact the institute for
              course information, fees and
              admission-related enquiries.
            </p>


            <div className="contact-details">

              <a
                href={`tel:${phoneNumber}`}
              >
                {phone}
              </a>


              <a
                href={`mailto:${email}`}
              >
                {email}
              </a>


              <span>
                {location}
              </span>

            </div>

          </div>


          <div className="enquiry-actions">

            <Link
              to="/enquiry"
              className="light-btn"
            >
              Submit Enquiry
            </Link>


            <a
              href={`tel:${phoneNumber}`}
              className="outline-light-btn"
            >
              Call Now
            </a>

          </div>

        </div>

      </section>


      {/* =====================================================
          OPTIONAL API ERROR
      ===================================================== */}

      {courseError && (

        <div
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            maxWidth: "360px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            fontSize: "12px",
            zIndex: 9999,
            boxShadow:
              "0 4px 14px rgba(0,0,0,0.08)",
          }}
        >
          Course data could not be
          refreshed from the server.
        </div>

      )}

    </div>

  );

}


export default Home;