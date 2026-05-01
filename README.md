# Team Task Manager

A full stack web app where users can create projects, assign tasks to team members, and track progress. Built with the MERN stack and role based access (Admin / Member).

## Features

- Signup / Login with JWT authentication
- Project & team management (admins create projects, add members)
- Task creation, assignment, status tracking (todo / in-progress / done)
- Priorities and due dates with overdue detection
- Dashboard with task counts (total, in-progress, done, overdue, mine)
- Role based access control:
  - **Admin** can do everything (create/delete projects, manage all tasks, manage users)
  - **Owner** of a project can edit tasks, add/remove members
  - **Member** can update status of tasks assigned to them
- The first user to sign up is auto promoted to admin

## Tech stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, express-validator
- **Frontend:** React (CRA), React Router, Axios, Context API
- **Deployment:** Railway

## Folder structure

```
team-task-manager/
├── backend/
│   ├── models/        (User, Project, Task)
│   ├── routes/        (auth, users, projects, tasks)
│   ├── middleware/    (auth, role check)
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── api.js
│   │   └── App.js
│   └── package.json
├── package.json       (root - used by Railway)
├── railway.json
└── README.md
```

## Local setup

### 1. Prerequisites

- Node.js 18+
- A MongoDB connection string (local or MongoDB Atlas free tier)

### 2. Clone & install

```bash
git clone <your-repo-url>
cd team-task-manager
npm run install-all
```

### 3. Configure backend env

Create `backend/.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/team_task_manager
JWT_SECRET=replace_this_with_a_long_random_string
CLIENT_URL=http://localhost:3000
```

(For MongoDB Atlas use the connection string from the Atlas dashboard.)

### 4. (Optional) frontend env

If you want a custom backend URL during development, create `frontend/.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

Otherwise the React dev server uses the proxy from `frontend/package.json`.

### 5. Run in dev

In two terminals:

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Open `http://localhost:3000`. The first account you create becomes admin.

## API endpoints

### Auth

- `POST /api/auth/signup` — body: `{ name, email, password, role? }`
- `POST /api/auth/login` — body: `{ email, password }`
- `GET  /api/auth/me`    — current user (auth required)

### Users (admin only for mutations)

- `GET    /api/users`
- `PUT    /api/users/:id/role` — body: `{ role }`
- `DELETE /api/users/:id`

### Projects

- `GET    /api/projects`
- `GET    /api/projects/:id`
- `POST   /api/projects` — admin only
- `PUT    /api/projects/:id` — admin or owner
- `DELETE /api/projects/:id` — admin only
- `POST   /api/projects/:id/members` — body: `{ userId }`
- `DELETE /api/projects/:id/members/:userId`

### Tasks

- `GET    /api/tasks` — supports `?project=`, `?status=`, `?assignedTo=`, `?mine=true`
- `GET    /api/tasks/dashboard` — stats
- `GET    /api/tasks/:id`
- `POST   /api/tasks`
- `PUT    /api/tasks/:id`
- `DELETE /api/tasks/:id`

All routes (except signup/login) require an `Authorization: Bearer <token>` header.

## Validation & relationships

- User emails are unique (lowercased), passwords are bcrypt hashed (10 salt rounds)
- Projects reference an owner (User) and a list of members (Users)
- Tasks reference a project, an optional assignee, and the user who created it
- Deleting a project cascades to its tasks
- All inputs run through `express-validator` and Mongoose schema validators

## Deployment (Railway)

See `DEPLOY.md` for the step by step Railway guide.

## License

MIT — feel free to use this for your own projects.
