import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useEffect, useState } from "react";

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

/*
 * Apps Script Web App URL
 *
 * Set this in:
 *
 * frontend/.env.local
 *
 * VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 */
const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

const DEFAULT_COURSE: CourseData = {
  title: "Class XI Foundation Course",
  duration: "5 Months",
  startDate: "2026-06-04",
  boards: "CBSE & COHSEM",
  timing: "4:30 PM – 7:15 PM",
  subjects: ["Physics", "Chemistry", "Biology"],
  image: "",
};

function ManageCourse() {
  const [course, setCourse] =
    useState<CourseData>(DEFAULT_COURSE);

  const [courses, setCourses] =
    useState<CourseOption[]>([]);

  const [selectedCourseId, setSelectedCourseId] =
    useState<string>("");

  const [isNewCourse, setIsNewCourse] =
    useState(false);

  const [newSubject, setNewSubject] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [imageName, setImageName] =
    useState("");

  /*
   * Load all available courses from Apps Script.
   */
  useEffect(() => {
    const loadCourses = async () => {
      if (!API_URL) {
        console.error(
          "VITE_APPS_SCRIPT_URL is not configured."
        );

        setSaveMessage(
          "Apps Script URL is not configured."
        );

        return;
      }

      try {
        setSaveMessage(
          "Loading courses..."
        );

        const response = await fetch(
          `${API_URL}?action=getCourses`
        );

        if (!response.ok) {
          throw new Error(
            `Request failed with status ${response.status}`
          );
        }

        const data =
          await response.json();

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
                    item: Record<
                      string,
                      unknown
                    >
                  ) => ({
                    course_id:
                      String(
                        item.course_id ??
                          ""
                      ).trim(),

                    title:
                      String(
                        item.title ??
                          ""
                      ).trim() ||
                      "Untitled Course",
                  })
                )
                .filter(
                  (
                    item: CourseOption
                  ) =>
                    item.course_id !== ""
                )
            : [];

        setCourses(courseList);

        /*
         * If courses already exist,
         * automatically select the first one.
         */
        if (
          courseList.length > 0
        ) {
          setIsNewCourse(false);

          setSelectedCourseId(
            courseList[0].course_id
          );
        }

        /*
         * If there are no courses,
         * open the form in New Course mode.
         */
        else {
          setIsNewCourse(true);

          setSelectedCourseId("");

          setCourse({
            ...DEFAULT_COURSE,
            course_id: undefined,
          });

          setSaveMessage(
            "No courses found. Create your first course."
          );
        }
      } catch (error) {
        console.error(
          "Failed to load courses:",
          error
        );

        setSaveMessage(
          "Unable to load courses from the server."
        );
      }
    };

    loadCourses();
  }, []);

  /*
   * Load the selected course by its course_id.
   */
  useEffect(() => {
    const loadSelectedCourse =
      async () => {
        if (!API_URL) {
          return;
        }

        /*
         * New course mode.
         */
        if (isNewCourse) {
          setCourse({
            ...DEFAULT_COURSE,
            course_id: undefined,
          });

          setNewSubject("");

          setImageName("");

          return;
        }

        /*
         * Nothing selected yet.
         */
        if (!selectedCourseId) {
          return;
        }

        try {
          setSaveMessage(
            "Loading selected course..."
          );

          const response =
            await fetch(
              `${API_URL}?action=getCourse&course_id=${encodeURIComponent(
                selectedCourseId
              )}`
            );

          if (!response.ok) {
            throw new Error(
              `Request failed with status ${response.status}`
            );
          }

          const data =
            await response.json();

          console.log(
            "getCourse response:",
            data
          );

          if (
            !data.success ||
            !data.course
          ) {
            throw new Error(
              data.error ||
                data.message ||
                "Course not found."
            );
          }

          const rawCourse =
            data.course as Record<
              string,
              unknown
            >;

          /*
           * Normalize Google Sheets /
           * Apps Script data into the
           * React form structure.
           */
          const normalizedCourse: CourseData =
            {
              course_id:
                String(
                  rawCourse.course_id ??
                    selectedCourseId
                ).trim(),

              title:
                String(
                  rawCourse.title ??
                    ""
                ),

              duration:
                String(
                  rawCourse.duration ??
                    ""
                ),

              startDate:
                String(
                  rawCourse.startDate ??
                    rawCourse.start_date ??
                    ""
                ).slice(0, 10),

              boards:
                String(
                  rawCourse.boards ??
                    ""
                ),

              timing:
                String(
                  rawCourse.timing ??
                    ""
                ),

              subjects:
                Array.isArray(
                  rawCourse.subjects
                )
                  ? rawCourse.subjects.map(
                      (
                        subject
                      ) =>
                        String(
                          subject
                        )
                    )
                  : [],

              image:
                String(
                  rawCourse.image ??
                    rawCourse.image_url ??
                    ""
                ),

              image_file_id:
                String(
                  rawCourse.image_file_id ??
                    ""
                ).trim(),

              image_url:
                String(
                  rawCourse.image_url ??
                    rawCourse.image ??
                    ""
                ),
            };

          /*
           * CourseSubjects is returned
           * separately by Apps Script.
           *
           * Accept common subject
           * column names.
           */
          if (
            Array.isArray(
              data.subjects
            ) &&
            data.subjects.length > 0
          ) {
            const subjectValues =
              data.subjects
                .map(
                  (
                    subject: unknown
                  ) => {
                    if (
                      typeof subject ===
                      "string"
                    ) {
                      return subject;
                    }

                    if (
                      subject &&
                      typeof subject ===
                        "object"
                    ) {
                      const item =
                        subject as Record<
                          string,
                          unknown
                        >;

                      return String(
                        item.subject_name ??
                          item.subject ??
                          item.name ??
                          ""
                      ).trim();
                    }

                    return "";
                  }
                )
                .filter(
                  (
                    subject: string
                  ) =>
                    subject !== ""
                );

            if (
              subjectValues.length >
              0
            ) {
              normalizedCourse.subjects =
                subjectValues;
            }
          }

          setCourse({
            ...DEFAULT_COURSE,
            ...normalizedCourse,
          });

          setNewSubject("");

          setImageName("");

          setSaveMessage("");
        } catch (error) {
          console.error(
            "Failed to load selected course:",
            error
          );

          setSaveMessage(
            "Unable to load the selected course."
          );
        }
      };

    loadSelectedCourse();
  }, [
    selectedCourseId,
    isNewCourse,
  ]);

  /*
   * Handle course selector.
   */
  const handleCourseSelection = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value =
      event.target.value;

    /*
     * Create new course.
     */
    if (
      value === "__NEW__"
    ) {
      setIsNewCourse(true);

      setSelectedCourseId("");

      setCourse({
        ...DEFAULT_COURSE,
        course_id: undefined,
      });

      setNewSubject("");

      setImageName("");

      setSaveMessage("");

      return;
    }

    /*
     * Existing course.
     */
    setIsNewCourse(false);

    setSelectedCourseId(value);

    setNewSubject("");

    setImageName("");
  };

  /*
   * Start a completely new course.
   */
  const handleNewCourse = () => {
    setIsNewCourse(true);

    setSelectedCourseId("");

    setCourse({
      ...DEFAULT_COURSE,
      course_id: undefined,
    });

    setNewSubject("");

    setImageName("");

    setSaveMessage(
      "New course form is ready."
    );
  };

  /*
   * Handle normal text/date inputs.
   */
  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setCourse(
      (previousCourse) => ({
        ...previousCourse,
        [name]: value,
      })
    );

    setSaveMessage("");
  };

  /*
   * Add a new subject.
   */
  const handleAddSubject = () => {
    const subject =
      newSubject.trim();

    if (!subject) {
      return;
    }

    /*
     * Prevent duplicate subjects.
     */
    const alreadyExists =
      course.subjects.some(
        (existingSubject) =>
          existingSubject
            .toLowerCase() ===
          subject.toLowerCase()
      );

    if (alreadyExists) {
      setSaveMessage(
        "This subject has already been added."
      );

      return;
    }

    setCourse(
      (previousCourse) => ({
        ...previousCourse,

        subjects: [
          ...previousCourse.subjects,
          subject,
        ],
      })
    );

    setNewSubject("");

    setSaveMessage("");
  };

  /*
   * Allow Enter key to add a subject.
   */
  const handleSubjectKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      handleAddSubject();
    }
  };

  /*
   * Remove a subject.
   */
  const handleRemoveSubject = (
    indexToRemove: number
  ) => {
    setCourse(
      (previousCourse) => ({
        ...previousCourse,

        subjects:
          previousCourse.subjects.filter(
            (_, index) =>
              index !==
              indexToRemove
          ),
      })
    );

    setSaveMessage("");
  };

  /*
   * Upload course image to Apps Script.
   *
   * Browser converts image to Base64.
   */
  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Validate image.
     */
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setSaveMessage(
        "Please select a valid image file."
      );

      return;
    }

    /*
     * Maximum 5 MB.
     */
    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setSaveMessage(
        "Please select an image smaller than 5 MB."
      );

      return;
    }

    if (!API_URL) {
      setSaveMessage(
        "Apps Script URL is not configured."
      );

      return;
    }

    setSaveMessage(
      "Uploading image..."
    );

    const reader =
      new FileReader();

    reader.onload =
      async () => {
        try {
          const result =
            reader.result;

          if (
            typeof result !==
            "string"
          ) {
            throw new Error(
              "Unable to read image."
            );
          }

          const parts =
            result.split(",");

          if (
            parts.length < 2
          ) {
            throw new Error(
              "Invalid image data."
            );
          }

          const base64 =
            parts[1];

          const response =
            await fetch(
              API_URL,
              {
                method:
                  "POST",

                body:
                  JSON.stringify(
                    {
                      action:
                        "uploadCourseImage",

                      fileName:
                        file.name,

                      mimeType:
                        file.type,

                      base64,
                    }
                  ),
              }
            );

          if (!response.ok) {
            throw new Error(
              `Upload failed with status ${response.status}`
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
              data.message ||
                data.error ||
                "Image upload failed."
            );
          }

          /*
           * Apps Script returns file_url.
           *
           * image_url is also accepted
           * for backward compatibility.
           */
          const uploadedImageUrl =
            String(
              data.image_url ||
                data.file_url ||
                ""
            ).trim();

          const uploadedFileId =
            String(
              data.file_id ||
                ""
            ).trim();

          setCourse(
            (previousCourse) => ({
              ...previousCourse,

              image: uploadedImageUrl,
              image_url: uploadedImageUrl,
              image_file_id: uploadedFileId,
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
        }
      };

    reader.onerror = () => {
      setSaveMessage(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  };

  /*
   * Remove currently selected image
   * from form state.
   *
   * This does NOT delete the
   * Google Drive file.
   */
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
   * Save course information.
   *
   * EXISTING COURSE:
   * course_id is sent.
   *
   * NEW COURSE:
   * course_id is deliberately omitted.
   *
   * Apps Script then generates a new
   * course ID and appends a new row.
   */
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    /*
     * Validation
     */
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
      course.startDate ===
        null ||
      course.startDate ===
        undefined ||
      String(
        course.startDate
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

    if (
      !Array.isArray(
        course.subjects
      ) ||
      course.subjects.length ===
        0
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

    try {
      setSaveMessage(
        isNewCourse
          ? "Creating course..."
          : "Saving course information..."
      );

      /*
       * Normalize data before sending.
       */
      const courseToSave: CourseData =
        {
          ...course,

          title: String(
            course.title ?? ""
          ).trim(),

          duration: String(
            course.duration ?? ""
          ).trim(),

          startDate: String(
            course.startDate ?? ""
          ),

          boards: String(
            course.boards ?? ""
          ).trim(),

          timing: String(
            course.timing ?? ""
          ).trim(),

          subjects:
            course.subjects.map(
              (subject) =>
                String(
                  subject
                ).trim()
            ),

          image: String(
            course.image ?? ""
          ),

          image_url: String(
            course.image_url ??
              course.image ??
              ""
          ),

          image_file_id: String(
            course.image_file_id ??
              ""
          ),
        };

      /*
       * NEW COURSE
       *
       * Do NOT send the old course ID.
       */
      if (isNewCourse) {
        delete courseToSave.course_id;
      }

      /*
       * EXISTING COURSE
       *
       * Force the selected ID.
       */
      else if (
        selectedCourseId
      ) {
        courseToSave.course_id =
          selectedCourseId;
      }

      console.log(
        "Saving course:",
        courseToSave
      );

      const response =
        await fetch(
          API_URL,
          {
            method:
              "POST",

            body:
              JSON.stringify(
                {
                  action:
                    "saveCourse",

                  course:
                    courseToSave,
                }
              ),
          }
        );

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}`
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

      /*
       * Apps Script MUST return course_id.
       */
      const savedCourseId =
        String(
          data.course_id ??
            ""
        ).trim();

      if (
        !savedCourseId
      ) {
        throw new Error(
          "Server saved the course but did not return a course ID."
        );
      }

      /*
       * Determine whether a new row
       * was created.
       */
      const wasCreated =
        data.action ===
          "created" ||
        isNewCourse;

      /*
       * Store the resulting ID locally.
       */
      setCourse(
        (previousCourse) => ({
          ...previousCourse,

          course_id:
            savedCourseId,
        })
      );

      /*
       * If a new course was created,
       * refresh the course list.
       */
      if (wasCreated) {
        const coursesResponse =
          await fetch(
            `${API_URL}?action=getCourses`
          );

        if (
          coursesResponse.ok
        ) {
          const coursesData =
            await coursesResponse.json();

          if (
            coursesData.success &&
            Array.isArray(
              coursesData.courses
            )
          ) {
            const refreshedCourses:
              CourseOption[] =
              coursesData.courses
                .map(
                  (
                    item: Record<
                      string,
                      unknown
                    >
                  ) => ({
                    course_id:
                      String(
                        item.course_id ??
                          ""
                      ).trim(),

                    title:
                      String(
                        item.title ??
                          ""
                      ).trim() ||
                      "Untitled Course",
                  })
                )
                .filter(
                  (
                    item: CourseOption
                  ) =>
                    item.course_id !==
                    ""
                );

            setCourses(
              refreshedCourses
            );
          }
        }

        /*
         * Switch from New Course
         * to Edit Course mode.
         */
        setIsNewCourse(
          false
        );

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
    }
  };

  /*
   * Reset the current form.
   *
   * Existing course:
   * reload it from backend.
   *
   * New course:
   * restore default form.
   */
  const handleReset =
    async () => {
      const confirmed =
        window.confirm(
          "Are you sure you want to reset the course information?"
        );

      if (!confirmed) {
        return;
      }

      /*
       * New course reset.
       */
      if (isNewCourse) {
        setCourse({
          ...DEFAULT_COURSE,
          course_id:
            undefined,
        });

        setNewSubject("");

        setImageName("");

        setSaveMessage(
          "New course form has been reset."
        );

        return;
      }

      /*
       * Existing course reset.
       */
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
            `Request failed with status ${response.status}`
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

        const rawCourse =
          data.course as Record<
            string,
            unknown
          >;

        const normalizedCourse:
          CourseData =
          {
            course_id:
              String(
                rawCourse.course_id ??
                  selectedCourseId
              ).trim(),

            title:
              String(
                rawCourse.title ??
                  ""
              ),

            duration:
              String(
                rawCourse.duration ??
                  ""
              ),

            startDate:
              String(
                rawCourse.startDate ??
                  rawCourse.start_date ??
                  ""
              ).slice(0, 10),

            boards:
              String(
                rawCourse.boards ??
                  ""
              ),

            timing:
              String(
                rawCourse.timing ??
                  ""
              ),

            subjects:
              Array.isArray(
                rawCourse.subjects
              )
                ? rawCourse.subjects.map(
                    (
                      subject
                    ) =>
                      String(
                        subject
                      )
                  )
                : [],

            image:
              String(
                rawCourse.image ??
                  rawCourse.image_url ??
                  ""
              ),

            image_file_id:
              String(
                rawCourse.image_file_id ??
                  ""
              ).trim(),

            image_url:
              String(
                rawCourse.image_url ??
                  rawCourse.image ??
                  ""
              ),
          };

        /*
         * Load subjects returned
         * separately by backend.
         */
        if (
          Array.isArray(
            data.subjects
          ) &&
          data.subjects.length >
            0
        ) {
          const subjectValues =
            data.subjects
              .map(
                (
                  subject: unknown
                ) => {
                  if (
                    typeof subject ===
                    "string"
                  ) {
                    return subject;
                  }

                  if (
                    subject &&
                    typeof subject ===
                      "object"
                  ) {
                    const item =
                      subject as Record<
                        string,
                        unknown
                      >;

                    return String(
                      item.subject_name ??
                        item.subject ??
                        item.name ??
                        ""
                    ).trim();
                  }

                  return "";
                }
              )
              .filter(
                (
                  subject: string
                ) =>
                  subject !== ""
              );

          if (
            subjectValues.length >
            0
          ) {
            normalizedCourse.subjects =
              subjectValues;
          }
        }

        setCourse({
          ...DEFAULT_COURSE,
          ...normalizedCourse,
        });

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
   * Convert YYYY-MM-DD into
   * human-readable date.
   */
  const formatDate = (
    dateString:
      | string
      | number
  ) => {
    if (
      dateString ===
        null ||
      dateString ===
        undefined ||
      String(
        dateString
      ).trim() === ""
    ) {
      return "";
    }

    const normalizedDate =
      String(
        dateString
      ).slice(0, 10);

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
        {/* Page Header */}
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
            information displayed on
            the coaching institute
            website.
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
              alignItems:
                "flex-end",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex:
                  "1 1 320px",
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
                style={
                  inputStyle
                }
              >
                {courses.length ===
                  0 && (
                  <option value="">
                    No existing
                    courses
                  </option>
                )}

                {courses.map(
                  (item) => (
                    <option
                      key={
                        item.course_id
                      }
                      value={
                        item.course_id
                      }
                    >
                      {item.title}{" "}
                      —{" "}
                      {
                        item.course_id
                      }
                    </option>
                  )
                )}

                <option value="__NEW__">
                  + Create New
                  Course
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
          onSubmit={
            handleSubmit
          }
        >
          <div
            style={{
              background:
                "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius:
                "16px",
              padding: "28px",
              boxShadow:
                "0 4px 16px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Course ID */}
            <div
              style={{
                marginBottom:
                  "22px",
                padding:
                  "12px 14px",
                borderRadius:
                  "9px",
                background:
                  isNewCourse
                    ? "#fffbeb"
                    : "#f9fafb",
                border:
                  isNewCourse
                    ? "1px solid #fde68a"
                    : "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  color:
                    "#6b7280",
                  marginBottom:
                    "4px",
                }}
              >
                Course ID
              </div>

              <strong
                style={{
                  color:
                    "#111827",
                  fontSize:
                    "14px",
                }}
              >
                {course.course_id ||
                  "Will be generated when saved"}
              </strong>
            </div>

            {/* Course Title */}
            <div
              style={{
                marginBottom:
                  "22px",
              }}
            >
              <label
                htmlFor="course-title"
                style={
                  labelStyle
                }
              >
                Course Title
              </label>

              <input
                id="course-title"
                name="title"
                type="text"
                value={
                  course.title
                }
                onChange={
                  handleChange
                }
                placeholder="Enter course title"
                style={
                  inputStyle
                }
              />
            </div>

            {/* Duration + Start Date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom:
                  "22px",
              }}
            >
              <div>
                <label
                  htmlFor="course-duration"
                  style={
                    labelStyle
                  }
                >
                  Duration
                </label>

                <input
                  id="course-duration"
                  name="duration"
                  type="text"
                  value={String(
                    course.duration ??
                      ""
                  )}
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 5 Months"
                  style={
                    inputStyle
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="course-start-date"
                  style={
                    labelStyle
                  }
                >
                  Start Date
                </label>

                <input
                  id="course-start-date"
                  name="startDate"
                  type="date"
                  value={String(
                    course.startDate ??
                      ""
                  ).slice(0, 10)}
                  onChange={
                    handleChange
                  }
                  style={
                    inputStyle
                  }
                />

                {course.startDate && (
                  <p
                    style={{
                      margin:
                        "7px 0 0",
                      fontSize:
                        "13px",
                      color:
                        "#6b7280",
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
                marginBottom:
                  "28px",
              }}
            >
              <div>
                <label
                  htmlFor="course-boards"
                  style={
                    labelStyle
                  }
                >
                  Boards
                </label>

                <input
                  id="course-boards"
                  name="boards"
                  type="text"
                  value={
                    course.boards
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: CBSE & COHSEM"
                  style={
                    inputStyle
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="course-timing"
                  style={
                    labelStyle
                  }
                >
                  Class Timing
                </label>

                <input
                  id="course-timing"
                  name="timing"
                  type="text"
                  value={
                    course.timing
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 4:30 PM – 7:15 PM"
                  style={
                    inputStyle
                  }
                />
              </div>
            </div>

            {/* Subjects */}
            <div
              style={{
                borderTop:
                  "1px solid #e5e7eb",
                paddingTop:
                  "26px",
                marginBottom:
                  "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "15px",
                  marginBottom:
                    "14px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        "19px",
                      fontWeight:
                        700,
                      color:
                        "#111827",
                    }}
                  >
                    Subjects
                  </h2>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color:
                        "#6b7280",
                      fontSize:
                        "13px",
                    }}
                  >
                    Add or remove
                    subjects for
                    this course.
                  </p>
                </div>
              </div>

              {/* Existing Subjects */}
              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "10px",
                  marginBottom:
                    "15px",
                }}
              >
                {course.subjects.map(
                  (
                    subject,
                    index
                  ) => (
                    <div
                      key={`${subject}-${index}`}
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width:
                            "36px",
                          height:
                            "36px",
                          borderRadius:
                            "8px",
                          background:
                            "#f3f4f6",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize:
                            "13px",
                          fontWeight:
                            700,
                          color:
                            "#6b7280",
                          flexShrink:
                            0,
                        }}
                      >
                        {String(
                          index +
                            1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <input
                        type="text"
                        value={
                          subject
                        }
                        onChange={(
                          event
                        ) => {
                          const updatedSubjects =
                            [
                              ...course.subjects,
                            ];

                          updatedSubjects[
                            index
                          ] =
                            event.target.value;

                          setCourse(
                            (
                              previousCourse
                            ) => ({
                              ...previousCourse,
                              subjects:
                                updatedSubjects,
                            })
                          );

                          setSaveMessage(
                            ""
                          );
                        }}
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
                      >
                        🗑
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Add Subject */}
              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <input
                  type="text"
                  value={
                    newSubject
                  }
                  onChange={(
                    event
                  ) =>
                    setNewSubject(
                      event.target
                        .value
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
                paddingTop:
                  "26px",
                marginBottom:
                  "28px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "19px",
                  fontWeight:
                    700,
                  color:
                    "#111827",
                }}
              >
                Course Image
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 16px",
                  color:
                    "#6b7280",
                  fontSize:
                    "13px",
                }}
              >
                Select an image
                to represent
                this course.
              </p>

              {course.image ? (
                <div
                  style={{
                    position:
                      "relative",
                    width:
                      "100%",
                    maxWidth:
                      "500px",
                    borderRadius:
                      "12px",
                    overflow:
                      "hidden",
                    border:
                      "1px solid #e5e7eb",
                    background:
                      "#f9fafb",
                  }}
                >
                  <img
                    src={
                      course.image
                    }
                    alt="Course preview"
                    style={{
                      width:
                        "100%",
                      height:
                        "260px",
                      objectFit:
                        "cover",
                      display:
                        "block",
                    }}
                  />

                  <div
                    style={{
                      padding:
                        "12px",
                      display:
                        "flex",
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
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="course-image"
                  style={{
                    width:
                      "100%",
                    maxWidth:
                      "500px",
                    minHeight:
                      "180px",
                    border:
                      "2px dashed #d1d5db",
                    borderRadius:
                      "12px",
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    cursor:
                      "pointer",
                    background:
                      "#fafafa",
                    textAlign:
                      "center",
                    padding:
                      "20px",
                    boxSizing:
                      "border-box",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "32px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    🖼️
                  </span>

                  <strong
                    style={{
                      color:
                        "#374151",
                      fontSize:
                        "15px",
                    }}
                  >
                    Upload Course
                    Image
                  </strong>

                  <span
                    style={{
                      marginTop:
                        "5px",
                      color:
                        "#9ca3af",
                      fontSize:
                        "13px",
                    }}
                  >
                    Click here to
                    choose an image
                  </span>

                  <input
                    id="course-image"
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                    style={{
                      display:
                        "none",
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
                  borderRadius:
                    "8px",
                  background:
                    saveMessage.includes(
                      "successfully"
                    )
                      ? "#ecfdf5"
                      : "#fff7ed",
                  border:
                    `1px solid ${
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
                  fontSize:
                    "14px",
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
                paddingTop:
                  "22px",
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap: "12px",
                flexWrap:
                  "wrap",
              }}
            >
              <button
                type="button"
                onClick={
                  handleReset
                }
                style={
                  resetButtonStyle
                }
              >
                Reset
              </button>

              <button
                type="submit"
                style={
                  saveButtonStyle
                }
              >
                {isNewCourse
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

/* =========================
   Styles
========================= */

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

const deleteButtonStyle: CSSProperties =
  {
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

const smallDeleteButtonStyle: CSSProperties =
  {
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

const secondaryButtonStyle: CSSProperties =
  {
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

const resetButtonStyle: CSSProperties =
  {
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

const saveButtonStyle: CSSProperties =
  {
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