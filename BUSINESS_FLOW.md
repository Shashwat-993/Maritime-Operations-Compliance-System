# Maritime Operations & Compliance System

## Business Flow Documentation

### 1. Overview
This platform enables marine organizations to manage ship maintenance, safety drills, crew participation, and compliance monitoring. It supports both admin and crew roles, ensuring operational safety and regulatory compliance.

---

### 2. User Roles
- **Admin**: Manages ships, maintenance tasks, drills, and monitors compliance.
- **Crew**: Views and updates assigned tasks, marks drill attendance, and logs activity.

---

### 3. Core Flows

#### A. Maintenance Management
- **Admin**
  1. Logs in to the system.
  2. Selects a ship and creates maintenance tasks (title, description, due date).
  3. Assigns tasks to crew members.
  4. Updates task status (Pending, In Progress, Completed).
- **Crew**
  1. Logs in and views assigned tasks.
  2. Updates task status and adds comments/notes.

#### B. Safety Drill Management
- **Admin**
  1. Schedules safety drills (type, date, ship).
  2. Assigns drills to ships.
- **Crew**
  1. Views upcoming drills.
  2. Marks attendance and submits drill completion.

#### C. Compliance Dashboard
- **System**
  1. Aggregates data on maintenance and drills.
  2. Shows pending/overdue tasks, missed drills, and compliance percentages.
  3. Highlights non-compliance (overdue tasks, missed drills).

---

### 4. Compliance Calculation
- **Maintenance Compliance**: % of completed tasks vs total tasks (per ship, per period).
- **Drill Participation**: % of crew attended vs assigned (per drill, per ship).
- **Non-compliance**: Any overdue task or missed drill is flagged.

---

### 5. Business Rules
- Maintenance tasks have due dates; overdue tasks are non-compliant.
- Drills have scheduled dates; missed attendance is non-compliant.
- Compliance is calculated and visualized on the dashboard.

---

### 6. Bonus Features (Optional)
- Role-based access control.
- Filters (by ship, status, date).
- Notifications for overdue tasks.
- Compliance charts/graphs.

---

### 7. Example Flows
- **Admin schedules a fire drill for MV Horizon.**
- **Crew logs in, sees the drill, marks attendance.**
- **Admin checks dashboard: sees compliance % and overdue items.**

---

### 8. API & DB Design (Summary)
- RESTful API endpoints for ships, users, tasks, drills, compliance.
- PostgreSQL schema: ships, users, maintenance_tasks, drills, drill_attendance, comments.

---

### 9. Deployment
- Docker Compose for local/dev.
- Can be deployed to cloud (Render, Railway, etc.).

---

### 10. Contact
For questions, contact the development team.

---

*This document can be converted to PDF as needed.*
