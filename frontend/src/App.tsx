import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import ProtectedRoute from "./components/ProtectedRoute";

/* ================= PUBLIC PAGES ================= */

import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Notices from "./pages/Notices";
import StudyMaterials from "./pages/StudyMaterials";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import CoachingInfo from "./pages/CoachingInfo";
import Enquiry from "./pages/Enquiry";

/* ================= TEACHER PAGES ================= */

import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import ManageNotices from "./pages/ManageNotices";
import ManageMaterials from "./pages/ManageMaterials";
import ManageGallery from "./pages/ManageGallery";
import StudentEnquiries from "./pages/StudentEnquiries";
import ActivityLogs from "./pages/ActivityLogs";
import ManageCourse from "./pages/ManageCourse";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC WEBSITE
            ===================================================== */}

        <Route element={<PublicLayout />}>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/courses"
            element={<Courses />}
          />

          <Route
            path="/notices"
            element={<Notices />}
          />

          <Route
            path="/materials"
            element={<StudyMaterials />}
          />

          <Route
            path="/gallery"
            element={<Gallery />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          <Route
            path="/coaching-info"
            element={<CoachingInfo />}
          />

          <Route
            path="/enquiry"
            element={<Enquiry />}
          />

        </Route>


        {/* =====================================================
            TEACHER LOGIN
            ===================================================== */}

        <Route
          path="/teacher/login"
          element={<TeacherLogin />}
        />


        {/* =====================================================
            PROTECTED TEACHER DASHBOARD
            ===================================================== */}

        <Route
          element={<ProtectedRoute />}
        >

          <Route
            path="/teacher"
            element={<TeacherLayout />}
          >

            {/* /teacher */}
            <Route
              index
              element={<TeacherDashboard />}
            />

            {/* /teacher/dashboard */}
            <Route
              path="dashboard"
              element={<TeacherDashboard />}
            />

            {/* /teacher/notices */}
            <Route
              path="notices"
              element={<ManageNotices />}
            />

            {/* /teacher/materials */}
            <Route
              path="materials"
              element={<ManageMaterials />}
            />

            {/* /teacher/gallery */}
            <Route
              path="gallery"
              element={<ManageGallery />}
            />

            {/* /teacher/enquiries */}
            <Route
              path="enquiries"
              element={<StudentEnquiries />}
            />

            {/* /teacher/coaching-info */}
            <Route
              path="coaching-info"
              element={<CoachingInfo />}
            />

            {/* /teacher/activity-logs */}
            <Route
              path="activity-logs"
              element={<ActivityLogs />}
            />

            {/* /teacher/course */}
            <Route
              path="course"
              element={<ManageCourse />}
            />

          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;