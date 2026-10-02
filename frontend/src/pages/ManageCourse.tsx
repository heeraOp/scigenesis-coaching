import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useEffect, useState } from "react";
import { getSessionToken } from "../services/auth";

interface CourseData {
  course_id?: string;
  title: string;
  duration: string | number;
  startDate: string;
  boards: string;
  timing: string;
  subjects: string[];
  image: string;
  image_file_id?: string;
  image_url?: string;
}

interface CourseOption {
  course_id: string;
  title: string;
}

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

const EMPTY_COURSE: CourseData = {
  title: "",
  duration: "",
  startDate: "",
  boards: "",
  timing: "",
  subjects: [],
  image: "",
  image_file_id: "",
  image_url: "",
};

function ManageCourse() {
  const [course, setCourse] = useState<CourseData>({
    ...EMPTY_COURSE,
  });

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [imageName, setImageName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /*
   * ---------------------------------------------------------
   * COMMON HELPERS
   * ---------------------------------------------------------
   */

  const requireSessionToken = () => {
    const token = getSessionToken();

    if (!token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    return token;
  };

  const resetToEmptyCourse = () => {
    setCourse({
      ...EMPTY_COURSE,
      subjects: [],
    });
    setNewSubject("");
    setImageName("");
  };

  const normalizeCourse = (
    rawCourse: Record<string, unknown>,
    fallbackCourseId = ""
  ): CourseData => {
    const subjectsFromCourse = Array.isArray(rawCourse.subjects)
      ? rawCourse.subjects
          .map((subject) => String(subject ?? "").trim())
          .filter(Boolean)
      : [];

    return {
      course_id: String(
        rawCourse.course_id ?? fallbackCourseId
      ).trim(),

      title: String(rawCourse.title ?? "").trim(),

      duration: String(
        rawCourse.duration ?? ""
      ).trim(),

      startDate: String(
        rawCourse.startDate ??
          rawCourse.start_date ??
          ""
      ).slice(0, 10),

      boards: String(
        rawCourse.boards ?? ""
      ).trim(),

      timing: String(
        rawCourse.timing ?? ""
      ).trim(),

      subjects: subjectsFromCourse,

      image: String(
        rawCourse.image ??
          rawCourse.image_url ??
          ""
      ).trim(),

      image_file_id: String(
        rawCourse.image_file_id ?? ""
      ).trim(),

      image_url: String(
        rawCourse.image_url ??
          rawCourse.image ??
          ""
      ).trim(),
    };
  };

  const normalizeSubjects = (subjects: unknown[]) => {
    return subjects
      .map((subject) => {
        if (typeof subject === "string") {
          return subject.trim();
        }

        if (
          subject &&
          typeof subject === "object"
        ) {
          const item =
            subject as Record<string, unknown>;

          return String(
            item.subject_name ??
              item.subject ??
              item.name ??
              ""
          ).trim();
        }

        return "";
      })
      .filter(Boolean);
  };

  /*
   * ---------------------------------------------------------
   * LOAD ALL COURSES
   * ---------------------------------------------------------
   */

  const loadCourses = async (
    showMessage = true
  ) => {
    if (!API_URL) {
      setSaveMessage(
        "Apps Script URL is not configured."
      );
      setIsLoading(false);
      return;
    }

    try {
      if (showMessage) {
        setSaveMessage("Loading courses...");
      }

      const response = await fetch(
        `${API_URL}?action=getCourses`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}.`
        );
      }

      const data = await response.json();

      console.log(
        "getCourses response:",
        data
      );

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to load courses."
        );
      }

      const courseList: CourseOption[] =
        Array.isArray(data.courses)
          ? data.courses
              .map(
                (
                  item: Record<string, unknown>
                ) => ({
                  course_id: String(
                    item.course_id ?? ""
                  ).trim(),

                  title:
                    String(
                      item.title ?? ""
                    ).trim() ||
                    "Untitled Course",
                })
              )
              .filter(
                (item: CourseOption) =>
                  item.course_id !== ""
              )
          : [];

      setCourses(courseList);

      if (courseList.length === 0) {
        setIsNewCourse(true);
        setSelectedCourseId("");
        resetToEmptyCourse();

        if (showMessage) {
          setSaveMessage(
            "No courses found. Create your first course."
          );
        }
      } else {
        setIsNewCourse(false);

        setSelectedCourseId(
          (currentId) =>
            currentId &&
            courseList.some(
              (item) =>
                item.course_id === currentId
            )
              ? currentId
              : courseList[0].course_id
        );
      }
    } catch (error) {
      console.error(
        "Failed to load courses:",
        error
      );

      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Unable to load courses from the server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  /*
   * ---------------------------------------------------------
   * LOAD SELECTED COURSE
   * ---------------------------------------------------------
   *
   * getCourse is intentionally public in the current
   * Apps Script backend, so no session token is required here.
   */

  useEffect(() => {
    const loadSelectedCourse = async () => {
      if (!API_URL) {
        return;
      }

      if (isNewCourse) {
        resetToEmptyCourse();
        setSaveMessage("");
        return;
      }

      if (!selectedCourseId) {
        return;
      }

      try {
        setSaveMessage(
          "Loading selected course..."
        );

        const response = await fetch(
          `${API_URL}?action=getCourse&course_id=${encodeURIComponent(
            selectedCourseId
          )}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Request failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        console.log(
          "getCourse response:",
          data
        );

        if (!data.success || !data.course) {
          throw new Error(
            data.error ||
              data.message ||
              "Course not found."
          );
        }

        const normalizedCourse =
          normalizeCourse(
            data.course as Record<
              string,
              unknown
            >,
            selectedCourseId
          );

        if (
          Array.isArray(data.subjects)
        ) {
          const backendSubjects =
            normalizeSubjects(
              data.subjects
            );

          if (backendSubjects.length > 0) {
            normalizedCourse.subjects =
              backendSubjects;
          }
        }

        setCourse(normalizedCourse);
        setNewSubject("");
        setImageName("");

        setSaveMessage("");
      } catch (error) {
        console.error(
          "Failed to load selected course:",
          error
        );

        setSaveMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the selected course."
        );
      }
    };

    loadSelectedCourse();
  }, [
    selectedCourseId,
    isNewCourse,
  ]);

  /*
   * ---------------------------------------------------------
   * COURSE SELECTION
   * ---------------------------------------------------------
   */

  const handleCourseSelection = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;

    if (value === "__NEW__") {
      setIsNewCourse(true);
      setSelectedCourseId("");
      resetToEmptyCourse();
      setSaveMessage(
        "New course form is ready."
      );
      return;
    }

    setIsNewCourse(false);
    setSelectedCourseId(value);
    setNewSubject("");
    setImageName("");
    setSaveMessage("");
  };

  const handleNewCourse = () => {
    setIsNewCourse(true);
    setSelectedCourseId("");
    resetToEmptyCourse();
    setSaveMessage(
      "New course form is ready."
    );
  };

  /*
   * ---------------------------------------------------------
   * INPUT HANDLING
   * ---------------------------------------------------------
   */

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setCourse((previousCourse) => ({
      ...previousCourse,
      [name]: value,
    }));

    setSaveMessage("");
  };

  /*
   * ---------------------------------------------------------
   * SUBJECT HANDLING
   * ---------------------------------------------------------
   */

  const handleAddSubject = () => {
    const subject = newSubject.trim();

    if (!subject) {
      return;
    }

    const alreadyExists =
      course.subjects.some(
        (existingSubject) =>
          existingSubject.toLowerCase() ===
          subject.toLowerCase()
      );

    if (alreadyExists) {
      setSaveMessage(
        "This subject has already been added."
      );
      return;
    }

    setCourse((previousCourse) => ({
      ...previousCourse,
      subjects: [
        ...previousCourse.subjects,
        subject,
      ],
    }));

    setNewSubject("");
    setSaveMessage("");
  };

  const handleSubjectKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddSubject();
    }
  };

  const handleRemoveSubject = (
    indexToRemove: number
  ) => {
    setCourse((previousCourse) => ({
      ...previousCourse,
      subjects:
        previousCourse.subjects.filter(
          (_, index) =>
            index !== indexToRemove
        ),
    }));

    setSaveMessage("");
  };

  const handleSubjectChange = (
    index: number,
    value: string
  ) => {
    setCourse((previousCourse) => {
      const subjects = [
        ...previousCourse.subjects,
      ];

      subjects[index] = value;

      return {
        ...previousCourse,
        subjects,
      };
    });

    setSaveMessage("");
  };

  /*
   * ---------------------------------------------------------
   * IMAGE UPLOAD
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   * uploadCourseImage is a protected POST action.
   * session_token MUST be included.
   */

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/")
    ) {
      setSaveMessage(
        "Please select a valid image file."
      );
      event.target.value = "";
      return;
    }

    if (
      file.size > 5 * 1024 * 1024
    ) {
      setSaveMessage(
        "Please select an image smaller than 5 MB."
      );
      event.target.value = "";
      return;
    }

    if (!API_URL) {
      setSaveMessage(
        "Apps Script URL is not configured."
      );
      return;
    }

    setIsUploading(true);
    setSaveMessage(
      "Uploading image..."
    );

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const result =
          reader.result;

        if (
          typeof result !== "string"
        ) {
          throw new Error(
            "Unable to read image."
          );
        }

        const parts =
          result.split(",");

        if (parts.length < 2) {
          throw new Error(
            "Invalid image data."
          );
        }

        const base64 = parts[1];

        const sessionToken =
          requireSessionToken();

        const response =
          await fetch(API_URL, {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain;charset=utf-8",
            },

            body: JSON.stringify({
              action:
                "uploadCourseImage",

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
            `Upload failed with status ${response.status}.`
          );
        }

        const data =
          await response.json();

        console.log(
          "uploadCourseImage response:",
          data
        );

        if (!data.success) {
          throw new Error(
            data.error ||
              data.message ||
              "Image upload failed."
          );
        }

        const uploadedImageUrl =
          String(
            data.image_url ||
              data.file_url ||
              ""
          ).trim();

        const uploadedFileId =
          String(
            data.file_id || ""
          ).trim();

        if (!uploadedImageUrl) {
          throw new Error(
            "Image uploaded but no image URL was returned."
          );
        }

        setCourse(
          (previousCourse) => ({
            ...previousCourse,

            image:
              uploadedImageUrl,

            image_url:
              uploadedImageUrl,

            image_file_id:
              uploadedFileId,
          })
        );

        setImageName(
          file.name
        );

        setSaveMessage(
          "Image uploaded successfully."
        );
      } catch (error) {
        console.error(
          "Failed to upload course image:",
          error
        );

        setSaveMessage(
          error instanceof Error
            ? error.message
            : "Unable to upload the course image."
        );
      } finally {
        setIsUploading(false);
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      setIsUploading(false);

      setSaveMessage(
        "Unable to read the selected image."
      );

      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCourse(
      (previousCourse) => ({
        ...previousCourse,

        image: "",
        image_url: "",
        image_file_id: "",
      })
    );

    setImageName("");
    setSaveMessage("");
  };

  /*
   * ---------------------------------------------------------
   * SAVE COURSE
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   * saveCourse is a protected POST action.
   * session_token MUST be included.
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      String(
        course.title ?? ""
      ).trim() === ""
    ) {
      setSaveMessage(
        "Please enter a course title."
      );
      return;
    }

    if (
      String(
        course.duration ?? ""
      ).trim() === ""
    ) {
      setSaveMessage(
        "Please enter the course duration."
      );
      return;
    }

    if (
      String(
        course.startDate ?? ""
      ).trim() === ""
    ) {
      setSaveMessage(
        "Please select the course start date."
      );
      return;
    }

    if (
      String(
        course.boards ?? ""
      ).trim() === ""
    ) {
      setSaveMessage(
        "Please enter the applicable boards."
      );
      return;
    }

    if (
      String(
        course.timing ?? ""
      ).trim() === ""
    ) {
      setSaveMessage(
        "Please enter the class timing."
      );
      return;
    }

    const cleanedSubjects =
      course.subjects
        .map((subject) =>
          String(subject).trim()
        )
        .filter(Boolean);

    if (
      cleanedSubjects.length === 0
    ) {
      setSaveMessage(
        "Please add at least one subject."
      );
      return;
    }

    if (!API_URL) {
      setSaveMessage(
        "Apps Script URL is not configured."
      );
      return;
    }

    setIsSaving(true);

    try {
      setSaveMessage(
        isNewCourse
          ? "Creating course..."
          : "Saving course information..."
      );

      /*
       * Get the CURRENT authentication token
       * immediately before the protected request.
       */
      const sessionToken =
        requireSessionToken();

      const courseToSave: CourseData = {
        ...course,

        title: String(
          course.title ?? ""
        ).trim(),

        duration: String(
          course.duration ?? ""
        ).trim(),

        startDate: String(
          course.startDate ?? ""
        ).slice(0, 10),

        boards: String(
          course.boards ?? ""
        ).trim(),

        timing: String(
          course.timing ?? ""
        ).trim(),

        subjects:
          cleanedSubjects,

        image: String(
          course.image ?? ""
        ).trim(),

        image_url: String(
          course.image_url ??
            course.image ??
            ""
        ).trim(),

        image_file_id: String(
          course.image_file_id ?? ""
        ).trim(),
      };

      /*
       * NEW COURSE
       *
       * Do not send the old course ID.
       * Apps Script will generate one.
       */
      if (isNewCourse) {
        delete courseToSave.course_id;
      }

      /*
       * EXISTING COURSE
       *
       * Force the currently selected ID.
       */
      else if (selectedCourseId) {
        courseToSave.course_id =
          selectedCourseId;
      }

      console.log(
        "Saving course:",
        courseToSave
      );

      const response =
        await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8",
          },

          body: JSON.stringify({
            action:
              "saveCourse",

            session_token:
              sessionToken,

            course:
              courseToSave,
          }),
        });

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}.`
        );
      }

      const data =
        await response.json();

      console.log(
        "saveCourse response:",
        data
      );

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save course."
        );
      }

      const savedCourseId =
        String(
          data.course_id ?? ""
        ).trim();

      if (!savedCourseId) {
        throw new Error(
          "Server saved the course but did not return a course ID."
        );
      }

      const wasCreated =
        data.action === "created" ||
        isNewCourse;

      /*
       * Keep the returned ID in local state.
       */
      setCourse(
        (previousCourse) => ({
          ...previousCourse,
          course_id:
            savedCourseId,
        })
      );

      /*
       * If this was a new course,
       * refresh the selector and select
       * the newly created course.
       */
      if (wasCreated) {
        await loadCourses(false);

        setIsNewCourse(false);
        setSelectedCourseId(
          savedCourseId
        );
      }

      setSaveMessage(
        wasCreated
          ? `Course created successfully. Course ID: ${savedCourseId}`
          : "Course information saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save course information:",
        error
      );

      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Unable to save course information."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * RESET
   * ---------------------------------------------------------
   */

  const handleReset = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to reset the course information?"
      );

    if (!confirmed) {
      return;
    }

    if (isNewCourse) {
      resetToEmptyCourse();

      setSaveMessage(
        "New course form has been reset."
      );

      return;
    }

    if (
      !API_URL ||
      !selectedCourseId
    ) {
      return;
    }

    try {
      setSaveMessage(
        "Reloading course..."
      );

      const response =
        await fetch(
          `${API_URL}?action=getCourse&course_id=${encodeURIComponent(
            selectedCourseId
          )}`
        );

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}.`
        );
      }

      const data =
        await response.json();

      if (
        !data.success ||
        !data.course
      ) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to reload course."
        );
      }

      const normalizedCourse =
        normalizeCourse(
          data.course as Record<
            string,
            unknown
          >,
          selectedCourseId
        );

      if (
        Array.isArray(data.subjects)
      ) {
        const subjects =
          normalizeSubjects(
            data.subjects
          );

        if (subjects.length > 0) {
          normalizedCourse.subjects =
            subjects;
        }
      }

      setCourse(
        normalizedCourse
      );

      setNewSubject("");
      setImageName("");

      setSaveMessage(
        "Course information has been reset."
      );
    } catch (error) {
      console.error(
        "Failed to reset course:",
        error
      );

      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset course."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * DATE FORMATTER
   * ---------------------------------------------------------
   */

  const formatDate = (
    dateString: string | number
  ) => {
    if (
      dateString === null ||
      dateString === undefined ||
      String(dateString).trim() === ""
    ) {
      return "";
    }

    const normalizedDate =
      String(dateString).slice(
        0,
        10
      );

    const date =
      new Date(
        `${normalizedDate}T00:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(
        dateString
      );
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "32px",
        background: "#f7f8fa",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "28px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Course Information
          </h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#6b7280",
              fontSize: "15px",
            }}
          >
            Enter and manage the course
            information displayed on the
            coaching institute website.
          </p>
        </div>

        {/* Course Selector */}
        <div
          style={{
            background: "#ffffff",
            border:
              "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px 22px",
            marginBottom: "20px",
            boxShadow:
              "0 4px 16px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-end",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: "1 1 320px",
              }}
            >
              <label
                htmlFor="course-selector"
                style={labelStyle}
              >
                Select Course
              </label>

              <select
                id="course-selector"
                value={
                  isNewCourse
                    ? "__NEW__"
                    : selectedCourseId
                }
                onChange={
                  handleCourseSelection
                }
                style={inputStyle}
                disabled={isLoading}
              >
                {courses.length === 0 && (
                  <option value="">
                    No existing courses
                  </option>
                )}

                {courses.map((item) => (
                  <option
                    key={item.course_id}
                    value={
                      item.course_id
                    }
                  >
                    {item.title} —{" "}
                    {item.course_id}
                  </option>
                ))}

                <option value="__NEW__">
                  + Create New Course
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={
                handleNewCourse
              }
              style={
                secondaryButtonStyle
              }
              disabled={
                isSaving ||
                isUploading
              }
            >
              + New Course
            </button>
          </div>

          <div
            style={{
              marginTop: "10px",
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            {isNewCourse
              ? "Creating a new course. Saving will append a new row."
              : `Editing ${
                  selectedCourseId ||
                  "selected course"
                }. Saving will update only that course.`}
          </div>
        </div>

        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
        >
          <div
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "28px",
              boxShadow:
                "0 4px 16px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Course ID */}
            <div
              style={{
                marginBottom: "22px",
                padding: "12px 14px",
                borderRadius: "9px",
                background: isNewCourse
                  ? "#fffbeb"
                  : "#f9fafb",
                border: isNewCourse
                  ? "1px solid #fde68a"
                  : "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Course ID
              </div>

              <strong
                style={{
                  color: "#111827",
                  fontSize: "14px",
                }}
              >
                {course.course_id ||
                  "Will be generated when saved"}
              </strong>
            </div>

            {/* Course Title */}
            <div
              style={{
                marginBottom: "22px",
              }}
            >
              <label
                htmlFor="course-title"
                style={labelStyle}
              >
                Course Title
              </label>

              <input
                id="course-title"
                name="title"
                type="text"
                value={course.title}
                onChange={handleChange}
                placeholder="Enter course title"
                style={inputStyle}
              />
            </div>

            {/* Duration + Start Date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "22px",
              }}
            >
              <div>
                <label
                  htmlFor="course-duration"
                  style={labelStyle}
                >
                  Duration
                </label>

                <input
                  id="course-duration"
                  name="duration"
                  type="text"
                  value={String(
                    course.duration ?? ""
                  )}
                  onChange={handleChange}
                  placeholder="Example: 5 Months"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="course-start-date"
                  style={labelStyle}
                >
                  Start Date
                </label>

                <input
                  id="course-start-date"
                  name="startDate"
                  type="date"
                  value={String(
                    course.startDate ?? ""
                  ).slice(0, 10)}
                  onChange={handleChange}
                  style={inputStyle}
                />

                {course.startDate && (
                  <p
                    style={{
                      margin:
                        "7px 0 0",
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    {formatDate(
                      course.startDate
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Boards + Timing */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "28px",
              }}
            >
              <div>
                <label
                  htmlFor="course-boards"
                  style={labelStyle}
                >
                  Boards
                </label>

                <input
                  id="course-boards"
                  name="boards"
                  type="text"
                  value={course.boards}
                  onChange={handleChange}
                  placeholder="Example: CBSE & COHSEM"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="course-timing"
                  style={labelStyle}
                >
                  Class Timing
                </label>

                <input
                  id="course-timing"
                  name="timing"
                  type="text"
                  value={course.timing}
                  onChange={handleChange}
                  placeholder="Example: 4:30 PM – 7:15 PM"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Subjects */}
            <div
              style={{
                borderTop:
                  "1px solid #e5e7eb",
                paddingTop: "26px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  marginBottom: "14px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Subjects
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  Add or remove subjects
                  for this course.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "15px",
                }}
              >
                {course.subjects.map(
                  (subject, index) => (
                    <div
                      key={`${subject}-${index}`}
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background:
                            "#f3f4f6",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          flexShrink: 0,
                        }}
                      >
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <input
                        type="text"
                        value={subject}
                        onChange={(event) =>
                          handleSubjectChange(
                            index,
                            event.target.value
                          )
                        }
                        style={{
                          ...inputStyle,
                          flex: 1,
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveSubject(
                            index
                          )
                        }
                        title={`Remove ${subject}`}
                        style={
                          deleteButtonStyle
                        }
                        disabled={
                          isSaving ||
                          isUploading
                        }
                      >
                        🗑
                      </button>
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  value={newSubject}
                  onChange={(event) =>
                    setNewSubject(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleSubjectKeyDown
                  }
                  placeholder="Enter new subject"
                  style={{
                    ...inputStyle,
                    flex:
                      "1 1 250px",
                  }}
                />

                <button
                  type="button"
                  onClick={
                    handleAddSubject
                  }
                  style={
                    secondaryButtonStyle
                  }
                  disabled={
                    isSaving ||
                    isUploading
                  }
                >
                  + Add Subject
                </button>
              </div>
            </div>

            {/* Course Image */}
            <div
              style={{
                borderTop:
                  "1px solid #e5e7eb",
                paddingTop: "26px",
                marginBottom: "28px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Course Image
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 16px",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                Select an image to
                represent this course.
              </p>

              {course.image ? (
                <div
                  style={{
                    position:
                      "relative",
                    width: "100%",
                    maxWidth: "500px",
                    borderRadius:
                      "12px",
                    overflow: "hidden",
                    border:
                      "1px solid #e5e7eb",
                    background:
                      "#f9fafb",
                  }}
                >
                  <img
                    src={course.image}
                    alt="Course preview"
                    style={{
                      width: "100%",
                      height: "260px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <div
                    style={{
                      padding: "12px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "13px",
                        color:
                          "#6b7280",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {imageName ||
                        "Course image selected"}
                    </span>

                    <button
                      type="button"
                      onClick={
                        handleRemoveImage
                      }
                      style={
                        smallDeleteButtonStyle
                      }
                      disabled={
                        isSaving ||
                        isUploading
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="course-image"
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    minHeight: "180px",
                    border:
                      "2px dashed #d1d5db",
                    borderRadius:
                      "12px",
                    display: "flex",
                    flexDirection:
                      "column",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    cursor:
                      isUploading
                        ? "not-allowed"
                        : "pointer",
                    background:
                      "#fafafa",
                    textAlign: "center",
                    padding: "20px",
                    boxSizing:
                      "border-box",
                    opacity:
                      isUploading
                        ? 0.7
                        : 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: "32px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    {isUploading
                      ? "⏳"
                      : "🖼️"}
                  </span>

                  <strong
                    style={{
                      color: "#374151",
                      fontSize: "15px",
                    }}
                  >
                    {isUploading
                      ? "Uploading..."
                      : "Upload Course Image"}
                  </strong>

                  <span
                    style={{
                      marginTop: "5px",
                      color: "#9ca3af",
                      fontSize: "13px",
                    }}
                  >
                    {isUploading
                      ? "Please wait"
                      : "Click here to choose an image"}
                  </span>

                  <input
                    id="course-image"
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                    disabled={
                      isUploading ||
                      isSaving
                    }
                    style={{
                      display: "none",
                    }}
                  />
                </label>
              )}
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                style={{
                  marginBottom:
                    "20px",
                  padding:
                    "12px 14px",
                  borderRadius: "8px",
                  background:
                    saveMessage.includes(
                      "successfully"
                    )
                      ? "#ecfdf5"
                      : "#fff7ed",
                  border: `1px solid ${
                    saveMessage.includes(
                      "successfully"
                    )
                      ? "#a7f3d0"
                      : "#fed7aa"
                  }`,
                  color:
                    saveMessage.includes(
                      "successfully"
                    )
                      ? "#047857"
                      : "#c2410c",
                  fontSize: "14px",
                }}
              >
                {saveMessage}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                borderTop:
                  "1px solid #e5e7eb",
                paddingTop: "22px",
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                style={
                  resetButtonStyle
                }
                disabled={
                  isSaving ||
                  isUploading
                }
              >
                Reset
              </button>

              <button
                type="submit"
                style={
                  saveButtonStyle
                }
                disabled={
                  isSaving ||
                  isUploading
                }
              >
                {isSaving
                  ? "Saving..."
                  : isNewCourse
                  ? "Create Course"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  border:
    "1px solid #d1d5db",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "15px",
  outline: "none",
};

const deleteButtonStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  border:
    "1px solid #fecaca",
  borderRadius: "9px",
  background: "#fff1f2",
  color: "#dc2626",
  cursor: "pointer",
  fontSize: "16px",
  flexShrink: 0,
};

const smallDeleteButtonStyle: CSSProperties = {
  border:
    "1px solid #fecaca",
  borderRadius: "7px",
  background: "#fff1f2",
  color: "#dc2626",
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};

const secondaryButtonStyle: CSSProperties = {
  padding: "12px 16px",
  border:
    "1px solid #d1d5db",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
};

const resetButtonStyle: CSSProperties = {
  padding: "12px 20px",
  border:
    "1px solid #d1d5db",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
};

const saveButtonStyle: CSSProperties = {
  padding: "12px 24px",
  border: "none",
  borderRadius: "9px",
  background: "#111827",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
};

export default ManageCourse;
