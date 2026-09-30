import { Link } from "react-router-dom";
import "./../styles/pages.css";

function TeacherDashboard() {
  return (
    <main className="teacher-page">

      <div className="container">

        <header className="teacher-header">
          <span className="page-label">
            Teacher Portal
          </span>

          <h1>
            SciGenesis Teacher Dashboard
          </h1>

          <p>
            Manage institute content and student enquiries
            from one place.
          </p>
        </header>

        <section className="dashboard-grid">

          <DashboardCard
            title="Notices"
            description="Add, edit or delete notices."
            link="/teacher/notices"
            action="Manage Notices"
          />

          <DashboardCard
            title="Study Materials"
            description="Upload and organise study materials."
            link="/teacher/materials"
            action="Manage Materials"
          />

          <DashboardCard
            title="Gallery"
            description="Upload photos and organise gallery content."
            link="/teacher/gallery"
            action="Manage Gallery"
          />

          <DashboardCard
            title="Student Enquiries"
            description="View enquiries, contact students and update status."
            link="/teacher/enquiries"
            action="Manage Enquiries"
          />

          <DashboardCard
            title="Coaching Info"
            description="Update centre information and basic details."
            link="/coaching-info"
            action="Edit Information"
          />

          <DashboardCard
            title="Activity Logs"
            description="View teacher actions and updates."
            link="/teacher/activity-logs"
            action="View Logs"
          />

        </section>

      </div>

    </main>
  );
}

function DashboardCard({
  title,
  description,
  link,
  action,
}: {
  title: string;
  description: string;
  link: string;
  action: string;
}) {
  return (
    <article className="dashboard-card">

      <h2>{title}</h2>

      <p>
        {description}
      </p>

      <Link
        to={link}
        className="page-button page-button-primary"
      >
        {action}
      </Link>

    </article>
  );
}

export default TeacherDashboard;