# Client Lead Management System (Mini CRM)

A simple CRM to manage client leads generated from website contact forms.

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt (secure admin access)

## Features
- Lead listing (name, email, source, status) with search and status filter
- Lead status updates: New / Contacted / Interested / Not Interested / Converted
- Notes and follow-ups for each lead
- Public website contact form that creates leads automatically
- Secure admin login (JWT protected API)
- Full CRUD operations

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Create your environment file
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `MONGO_URI` and a strong `JWT_SECRET`.
3. Create the admin user
   ```bash
   npm run seed
   ```
4. Start the server
   ```bash
   npm start
   ```
5. Open http://localhost:5000
   - Admin dashboard: `/` (login with the ADMIN_EMAIL / ADMIN_PASSWORD from `.env`)
   - Website contact form: `/contact.html`

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/login | Public | Admin login |
| POST | /api/leads/public | Public | Contact form submission |
| GET | /api/leads | Admin | List leads (?status=&search=) |
| GET | /api/leads/:id | Admin | Get one lead |
| POST | /api/leads | Admin | Add lead |
| PATCH | /api/leads/:id/status | Admin | Update status |
| DELETE | /api/leads/:id | Admin | Delete lead |
| POST | /api/leads/:id/notes | Admin | Add note |
| POST | /api/leads/:id/followups | Admin | Add follow-up |
| PATCH | /api/leads/:id/followups/:fid | Admin | Mark follow-up done/undone |

## Project Structure
```
mini-crm/
├── server.js
├── seedAdmin.js
├── models/        (Lead.js, Admin.js)
├── routes/        (auth.js, leads.js)
├── middleware/    (auth.js)
└── public/        (index.html, contact.html, style.css, app.js)
```
