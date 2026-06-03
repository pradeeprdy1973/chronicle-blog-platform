# ✦ The Chronicle — Full-Stack Blog Platform

A production-quality blogging platform built with **React**, **Express.js**, and **SQLite**. Features full user authentication, rich post management, threaded comments, likes, and a beautifully designed editorial UI.

---

## 📸 Features

| Feature | Description |
|---|---|
| 🔐 Authentication | Register, login, JWT-protected routes |
| ✍️ Post Management | Create, edit, delete posts with cover images and tags |
| 💬 Comments | Threaded replies, edit/delete your own comments |
| ❤️ Likes | Like/unlike posts (one per user) |
| 👤 User Profiles | View any author's profile and their post history |
| 🔍 Search & Filter | Search by keyword, filter by tag |
| 📱 Responsive | Mobile-friendly layout throughout |

---

## 🏗️ Tech Stack

**Frontend**
- React 18 with React Router v6
- Axios for API calls
- react-hot-toast for notifications
- date-fns for date formatting
- Google Fonts (Playfair Display + Source Serif 4)

**Backend**
- Node.js + Express.js
- better-sqlite3 (fast, synchronous SQLite)
- bcryptjs for password hashing
- jsonwebtoken for JWT auth

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher ([download](https://nodejs.org))
- **npm** v8 or higher (comes with Node.js)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment (Optional)

```bash
cd backend
cp .env.example .env
# Edit .env to set your own JWT_SECRET
```

### 3. Start the Backend

Open a terminal in the `backend/` folder:

```bash
# Production
node server.js

# Development (auto-restart on changes)
npm run dev
```

The API will start at **http://localhost:5000**

The SQLite database (`blog.db`) is created automatically on first run.

### 4. Start the Frontend

Open another terminal in the `frontend/` folder:

```bash
npm start
```

The app opens at **http://localhost:3000**

---

## 📁 Project Structure

```
blog-platform/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── models/
│   │   └── database.js      # SQLite setup & schema
│   ├── routes/
│   │   ├── auth.js          # /api/auth/* endpoints
│   │   ├── posts.js         # /api/posts/* endpoints
│   │   └── comments.js      # /api/posts/:slug/comments/* endpoints
│   ├── .env.example
│   ├── package.json
│   └── server.js            # Express app entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Navbar.js    # Top navigation
│       │   └── PostCard.js  # Post summary card
│       ├── context/
│       │   └── AuthContext.js  # Global auth state
│       ├── pages/
│       │   ├── Home.js      # Feed with search & pagination
│       │   ├── Auth.js      # Login & Register forms
│       │   ├── Write.js     # Create / edit post
│       │   ├── PostDetail.js  # Full post + comments
│       │   └── Profile.js   # Author profile page
│       ├── api.js           # Axios instance with interceptors
│       ├── App.js           # Router & providers
│       └── index.css        # Global design tokens & styles
│
└── README.md
```

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Get JWT token |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/me` | ✅ | Update profile |

### Posts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | Optional | List posts (supports `?page`, `?tag`, `?search`, `?author`) |
| GET | `/api/posts/:slug` | Optional | Get post by slug |
| POST | `/api/posts` | ✅ | Create post |
| PUT | `/api/posts/:id` | ✅ (owner) | Edit post |
| DELETE | `/api/posts/:id` | ✅ (owner) | Delete post |
| POST | `/api/posts/:id/like` | ✅ | Toggle like |

### Comments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts/:slug/comments` | Optional | Get threaded comments |
| POST | `/api/posts/:slug/comments` | ✅ | Add comment (use `parent_id` for replies) |
| PUT | `/api/posts/:slug/comments/:id` | ✅ (owner) | Edit comment |
| DELETE | `/api/posts/:slug/comments/:id` | ✅ (owner) | Delete comment |

**Authentication:** Include `Authorization: Bearer <token>` header.

**Request/Response example — Create Post:**
```json
POST /api/posts
{
  "title": "My First Post",
  "content": "Full post content here…",
  "excerpt": "A short preview",
  "tags": ["tech", "writing"],
  "published": true,
  "cover_image": "https://images.unsplash.com/..."
}
```

---

## 🗄️ Database Schema

```sql
users       — id, username, email, password, avatar, bio, created_at
posts       — id, title, slug, content, excerpt, cover_image, author_id, tags, published, views, created_at, updated_at
comments    — id, content, post_id, author_id, parent_id, created_at, updated_at
likes       — id, post_id, user_id, created_at (UNIQUE post_id+user_id)
```

---

## 🛠️ Customization Tips

### Change the port
Edit `backend/server.js` → `const PORT = 5000` or set `PORT` in `.env`.

### Use a different database
Swap `better-sqlite3` for `pg` (PostgreSQL) or `mysql2`. Update `models/database.js` to use async queries.

### Add image uploads
Install `multer` in the backend and create a `POST /api/upload` endpoint; store images in a `uploads/` folder or use Cloudinary/S3.

### Deploy
- **Backend**: Railway, Render, or Fly.io (Node.js app)
- **Frontend**: Vercel or Netlify (set `REACT_APP_API_URL` env var to your backend URL)
- **Database in prod**: Replace SQLite with PostgreSQL on Supabase or Railway

---

## 🧑‍💻 Development Notes

- The frontend proxies `/api` requests to `localhost:5000` via the `"proxy"` field in `frontend/package.json`
- JWT tokens expire after **7 days**
- All passwords are hashed with bcrypt (10 rounds)
- Post slugs are auto-generated and unique (title + timestamp hash)

---

## 📄 License

MIT — free to use and modify.
