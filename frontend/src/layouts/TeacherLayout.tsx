import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import "./TeacherLayout.css";

import {
  logoutTeacher,
} from "../services/auth";


function TeacherLayout() {

  const navigate =
    useNavigate();


  /* =====================================================
     LOGOUT
     ===================================================== */

  async function handleLogout() {

    try {

      await logoutTeacher();

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    } finally {

      /*
       * Always return to the login page.
       */

      navigate(
        "/teacher/login",
        {
          replace: true,
        }
      );

    }

  }


  return (

    <div className="teacher-layout">


      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="teacher-sidebar">


        {/* =================================================
            BRAND
            ================================================= */}

        <div className="teacher-brand">

          <div className="teacher-brand-mark">
            SCI
          </div>


          <div>

            <strong>
              Teacher Dashboard
            </strong>

            <span>
              SciGenesis Coaching Institute
            </span>

          </div>

        </div>


        {/* =================================================
            NAVIGATION
            ================================================= */}

        <nav className="teacher-nav">


          {/* OVERVIEW */}

          <NavLink
            to="/teacher"
            end
          >

            <span>
              📊
            </span>

            Overview

          </NavLink>


          {/* NOTICES */}

          <NavLink
            to="/teacher/notices"
          >

            <span>
              📢
            </span>

            Notices

          </NavLink>


          {/* STUDY MATERIALS */}

          <NavLink
            to="/teacher/materials"
          >

            <span>
              📚
            </span>

            Study Materials

          </NavLink>


          {/* COURSE */}

          <NavLink
            to="/teacher/course"
          >

            <span>
              📘
            </span>

            Course

          </NavLink>


          {/* GALLERY */}

          <NavLink
            to="/teacher/gallery"
          >

            <span>
              🖼️
            </span>

            Gallery

          </NavLink>


          {/* STUDENT ENQUIRIES */}

          <NavLink
            to="/teacher/enquiries"
          >

            <span>
              📝
            </span>

            Student Enquiries

          </NavLink>


          {/* COACHING INFO */}

          <NavLink
            to="/teacher/coaching-info"
          >

            <span>
              🏫
            </span>

            Coaching Info

          </NavLink>


          {/* ACTIVITY LOGS */}

          <NavLink
            to="/teacher/activity-logs"
          >

            <span>
              📋
            </span>

            Activity Logs

          </NavLink>


        </nav>


        {/* =================================================
            SIDEBAR BOTTOM
            ================================================= */}

        <div className="teacher-sidebar-bottom">


          {/* VIEW PUBLIC WEBSITE */}

          <NavLink
            to="/"
          >

            ← View Website

          </NavLink>


          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            className="teacher-logout-button"
          >

            Logout

          </button>


        </div>


      </aside>


      {/* =================================================
          MAIN DASHBOARD
          ================================================= */}

      <main className="teacher-main">


        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="teacher-topbar">

          <div>

            <h1>
              Teacher Dashboard
            </h1>

            <p>
              Manage your coaching centre website.
            </p>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        <section className="teacher-content">

          <Outlet />

        </section>


      </main>


    </div>

  );

}


export default TeacherLayout;