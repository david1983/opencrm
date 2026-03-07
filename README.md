<div align="center">

# 🚀 OpenCRM — Free & Open Source CRM

### The Modern, Self-Hosted Customer Relationship Management Platform

**A powerful, free, open source CRM alternative to Salesforce, HubSpot, and Zoho — built with React, Node.js, and MongoDB.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7%2B-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Getting Started](#-getting-started) · [Features](#-features) · [Tech Stack](#-tech-stack) · [API Docs](#-api-overview) · [Contributing](#-contributing) · [Roadmap](#-roadmap)

</div>

---

## 📖 What Is OpenCRM?

**OpenCRM** is a **free, open source CRM** (Customer Relationship Management) platform designed for startups, small businesses, and enterprises that need a modern, self-hosted alternative to proprietary solutions like Salesforce, HubSpot, Pipedrive, and Zoho CRM.

Built as a full-stack JavaScript application, OpenCRM gives you complete control over your customer data, sales pipeline, contacts, and business relationships — with no vendor lock-in, no per-seat pricing, and no usage limits.

### Who Is OpenCRM For?

- **Startups & Small Businesses** looking for a free CRM to manage customer relationships
- **Sales Teams** that need pipeline management, lead tracking, and activity logging
- **Developers** who want a self-hosted, customizable CRM they can extend
- **Organizations** that require data sovereignty and on-premises deployment

---

## ✨ Features

### Core CRM Capabilities

| Feature | Description |
|---------|-------------|
| **Account Management** | Track companies and organizations with industry, website, phone, and address details |
| **Contact Management** | Manage individual contacts linked to accounts with full profile information |
| **Lead Management** | Capture, qualify, and convert leads through your sales funnel |
| **Lead Conversion** | One-click conversion of qualified leads into accounts, contacts, and opportunities |
| **Opportunity Tracking** | Manage sales deals through customizable pipeline stages with probability and close dates |
| **Activity Logging** | Record calls, emails, meetings, and notes against any CRM record |
| **Task Management** | Create and assign tasks with due dates, priorities, and status tracking |
| **Notes & Attachments** | Add rich notes and file attachments to any record |
| **Sales Pipeline** | Visual pipeline with stages: Prospecting → Qualification → Proposal → Negotiation → Closed Won/Lost |
| **Global Search** | Instantly search across all accounts, contacts, leads, and opportunities |

### Analytics & Reporting

- 📊 **Dashboard Analytics** — Real-time overview of your sales metrics
- 📈 **Pipeline Reports** — Track deal flow and revenue forecasts
- 📉 **Lead Reports** — Analyze leads by source and status
- 📋 **Activity Reports** — Monitor team engagement and productivity

### Administration & Customization

- 🔧 **Custom Objects** — Create your own data models beyond the standard CRM entities
- 🔧 **Custom Fields** — Add custom properties to any object type
- 👥 **User Management** — Invite team members with role-based access (Admin / User)
- 🏢 **Organization Settings** — Configure company info, timezone, currency, and feature flags
- 📝 **Audit Logging** — Full change history for compliance and accountability

### Security & Authentication

- 🔐 **JWT Authentication** — Secure, stateless token-based auth
- 🔑 **OAuth 2.0** — Sign in with Google or GitHub
- 🛡️ **Role-Based Access Control** — Admin and User roles with permission enforcement
- 🚦 **Rate Limiting** — API rate limiting to prevent abuse (100 requests / 15 min)
- 🔒 **Security Headers** — Helmet.js for HTTP security headers
- 🧹 **Data Sanitization** — MongoDB injection prevention built-in

---

## 🛠 Tech Stack

OpenCRM is built with a modern, production-ready JavaScript stack:

### Frontend

| Technology | Purpose |
|-----------|---------|
| [React 18](https://react.dev/) | UI framework |
| [Vite 5](https://vitejs.dev/) | Build tool & dev server |
| [React Router v6](https://reactrouter.com/) | Client-side routing |
| [TanStack React Query](https://tanstack.com/query) | Server state management |
| [Zustand](https://zustand-demo.pmnd.rs/) | Client state management |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first CSS framework |
| [Headless UI](https://headlessui.com/) | Accessible UI components |
| [Heroicons](https://heroicons.com/) | SVG icon set |
| [Recharts](https://recharts.org/) | Charting library for analytics |

### Backend

| Technology | Purpose |
|-----------|---------|
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Express 4](https://expressjs.com/) | REST API framework |
| [MongoDB](https://www.mongodb.com/) | NoSQL database |
| [Mongoose 8](https://mongoosejs.com/) | MongoDB ODM |
| [Passport.js](https://www.passportjs.org/) | OAuth authentication (Google, GitHub) |
| [JSON Web Tokens](https://jwt.io/) | Stateless authentication |
| [Multer](https://github.com/expressjs/multer) | File upload handling |

### Testing

| Technology | Purpose |
|-----------|---------|
| [Jest](https://jestjs.io/) | Backend test runner |
| [Supertest](https://github.com/ladjs/supertest) | HTTP assertion library |
| [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server) | In-memory MongoDB for tests |
| [Vitest](https://vitest.dev/) | Frontend test runner |
| [React Testing Library](https://testing-library.com/react) | Component testing |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **MongoDB** v7 or higher — [Install](https://www.mongodb.com/docs/manual/installation/) or use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier available)
- **npm** v9+ (included with Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/david1983/opencrm.git
   cd opencrm
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This installs dependencies for both the client and server workspaces.

3. **Configure environment variables**

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Edit `server/.env` with your settings:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/opencrm
   JWT_SECRET=your-secure-secret-key
   JWT_EXPIRE=7d

   # OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret

   CLIENT_URL=http://localhost:5173
   ```

4. **Seed the database** (optional — adds sample data)

   ```bash
   npm run seed
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   This launches both the frontend and backend concurrently:
   - 🌐 **Frontend**: [http://localhost:5173](http://localhost:5173)
   - ⚙️ **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 📁 Project Structure

OpenCRM uses an **npm workspaces monorepo** architecture:

```
opencrm/
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── layout/            # MainLayout, AdminLayout, Sidebar, Header
│   │   │   └── ui/                # Button, Input, Modal, Badge, Card, Table
│   │   ├── pages/                 # Route page components
│   │   │   ├── accounts/          # Account list & detail views
│   │   │   ├── contacts/          # Contact management
│   │   │   ├── leads/             # Lead tracking & conversion
│   │   │   ├── opportunities/     # Sales pipeline
│   │   │   ├── activities/        # Activity logging
│   │   │   ├── tasks/             # Task management
│   │   │   ├── reports/           # Analytics & dashboards
│   │   │   ├── admin/             # Admin settings
│   │   │   └── auth/              # Login & registration
│   │   ├── hooks/                 # Custom React hooks (useAuth, useForm)
│   │   ├── lib/                   # API client, state store
│   │   ├── App.jsx                # Application routes
│   │   └── main.jsx               # React entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── config/                # Database & auth configuration
│   │   ├── controllers/           # Request handlers
│   │   ├── middleware/            # Auth, validation, error handling
│   │   ├── models/                # Mongoose schemas (13+ models)
│   │   ├── routes/                # API route definitions
│   │   └── scripts/               # Database seeding
│   ├── tests/                     # Backend test suite
│   ├── package.json
│   └── jest.config.js
│
├── package.json                   # Workspace configuration & scripts
└── .gitignore
```

---

## 📡 API Overview

OpenCRM exposes a RESTful API. All endpoints (except auth) require a valid JWT token.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive JWT |
| `POST` | `/api/auth/logout` | Log out (clear token) |
| `GET`  | `/api/auth/me` | Get current user profile |
| `GET`  | `/api/auth/google` | Sign in with Google OAuth |
| `GET`  | `/api/auth/github` | Sign in with GitHub OAuth |

### Core Resources (CRUD)

| Resource | Endpoint | Operations |
|----------|----------|------------|
| Accounts | `/api/accounts` | List, Create, Read, Update, Delete |
| Contacts | `/api/contacts` | List, Create, Read, Update, Delete |
| Leads | `/api/leads` | List, Create, Read, Update, Delete |
| Opportunities | `/api/opportunities` | List, Create, Read, Update, Delete |
| Activities | `/api/activities` | List, Create, Read, Update, Delete |
| Tasks | `/api/tasks` | List, Create, Read, Update, Delete |
| Notes | `/api/notes` | List, Create, Read, Update, Delete |
| Attachments | `/api/attachments` | Upload, Download, Delete |

### Special Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/leads/:id/convert` | Convert a lead to account + contact + opportunity |
| `GET`  | `/api/search` | Global search across all entities |
| `GET`  | `/api/reports/dashboard` | Dashboard analytics data |
| `GET`  | `/api/reports/pipeline` | Sales pipeline report |
| `GET`  | `/api/reports/leads-by-source` | Leads grouped by source |
| `GET`  | `/api/reports/leads-by-status` | Leads grouped by status |
| `GET`  | `/api/reports/activities` | Activity summary report |
| `GET`  | `/api/audit/:type/:id` | Audit history for a record |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET / PUT` | `/api/admin/organization` | Organization settings |
| `CRUD` | `/api/admin/users` | User management |
| `POST` | `/api/admin/users/:id/reset-password` | Reset user password |
| `CRUD` | `/api/admin/setup/objects` | Custom object definitions |
| `CRUD` | `/api/admin/setup/fields` | Custom field definitions |
| `GET`  | `/api/admin/setup/field-types` | Available field types |

---

## 🧪 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:server` | Start backend only (port 5000) |
| `npm run dev:client` | Start frontend only (port 5173) |
| `npm run build` | Build the frontend for production |
| `npm run start` | Start the production server |
| `npm run seed` | Seed the database with sample data |
| `npm test` | Run all tests |

### Running Tests

**Backend tests** (Jest + Supertest with in-memory MongoDB):

```bash
cd server
npm test
```

**Frontend tests** (Vitest + React Testing Library):

```bash
cd client
npm test
```

### Code Architecture

- **Monorepo**: npm workspaces for client/server
- **API Pattern**: RESTful with Express controllers and Mongoose models
- **State Management**: React Query for server state, Zustand for client state
- **Authentication**: JWT tokens (Bearer header or HTTP-only cookie) + Passport.js OAuth
- **Validation**: Express Validator middleware with custom rule sets
- **Error Handling**: Centralized error middleware with consistent error responses

---

## 🌍 Deployment

### Production Build

```bash
# Build the frontend
npm run build

# Start the production server
NODE_ENV=production npm run start
```

The production server serves both the API and the built frontend from a single Express instance.

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Server port (default: `5000`) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `JWT_EXPIRE` | No | Token expiration (default: `7d`) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |

### Deploying to Cloud Providers

OpenCRM can be deployed to any platform that supports Node.js and MongoDB:

- **Railway** — One-click deploy with MongoDB plugin
- **Render** — Free tier available with managed MongoDB
- **DigitalOcean App Platform** — Scalable container deployment
- **AWS (EC2 / ECS)** — Full control with managed DocumentDB
- **Heroku** — Simple deployment with MongoDB Atlas add-on
- **Self-hosted** — Run on any Linux server with Node.js and MongoDB installed

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, documentation improvements, or translations — every contribution matters.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Make** your changes and add tests
4. **Run** the test suite: `npm test`
5. **Commit** your changes: `git commit -m "feat: add your feature"`
6. **Push** to your fork: `git push origin feature/your-feature-name`
7. **Open** a Pull Request

### Contribution Ideas

- 🐛 Bug fixes and issue resolution
- ✨ New CRM features (email integration, workflow automation)
- 📝 Documentation improvements
- 🌐 Internationalization (i18n) and translations
- 🧪 Test coverage improvements
- 🎨 UI/UX enhancements
- 🐳 Docker and deployment tooling
- 📊 New report types and analytics

---

## 🗺 Roadmap

We're actively developing OpenCRM. Here's what's planned:

### Upcoming

- [ ] Docker & Docker Compose support
- [ ] GitHub Actions CI/CD pipeline
- [ ] Email integration (send/receive from CRM)
- [ ] Workflow automation and triggers
- [ ] Bulk import/export (CSV, Excel)
- [ ] API documentation with Swagger/OpenAPI

### Planned

- [ ] Real-time notifications (WebSocket)
- [ ] Advanced reporting with custom report builder
- [ ] Kanban board view for opportunities
- [ ] Calendar integration
- [ ] Mobile-responsive progressive web app (PWA)
- [ ] Webhooks for third-party integrations
- [ ] Multi-language support (i18n)
- [ ] Advanced permission system (field-level security)
- [ ] REST API SDK for JavaScript/Python

---

## 🆚 OpenCRM vs. Other CRM Solutions

| Feature | OpenCRM | Salesforce | HubSpot CRM | Zoho CRM |
|---------|---------|------------|-------------|----------|
| **Price** | Free forever | $25+/user/mo | Free (limited) | $14+/user/mo |
| **Open Source** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Self-Hosted** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Data Ownership** | ✅ Full | ❌ Vendor | ❌ Vendor | ❌ Vendor |
| **Custom Objects** | ✅ Yes | ✅ Yes | ⚠️ Paid | ⚠️ Paid |
| **OAuth Login** | ✅ Google, GitHub | ✅ SSO | ✅ Google | ✅ Google |
| **REST API** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **No User Limits** | ✅ Unlimited | ❌ Per-seat | ⚠️ Limited | ❌ Per-seat |

---

## ❓ FAQ

<details>
<summary><strong>Is OpenCRM really free?</strong></summary>

Yes! OpenCRM is 100% free and open source under the MIT License. There are no hidden fees, per-seat pricing, or premium tiers. You can use it for personal projects, startups, or enterprise deployments at no cost.
</details>

<details>
<summary><strong>Can I use OpenCRM for my business?</strong></summary>

Absolutely. OpenCRM is licensed under the MIT License, which allows commercial use. You can deploy it for your business, modify it to fit your needs, and even build commercial products on top of it.
</details>

<details>
<summary><strong>Do I need to know how to code to use OpenCRM?</strong></summary>

No coding is required to use OpenCRM as an end user. However, setting up and deploying the application requires basic knowledge of Node.js and MongoDB. Once deployed, the web interface is intuitive and requires no technical expertise.
</details>

<details>
<summary><strong>Can I migrate data from Salesforce / HubSpot / other CRMs?</strong></summary>

Data migration via CSV/Excel import is on our roadmap. In the meantime, you can use the REST API to programmatically import data from any source.
</details>

<details>
<summary><strong>Is OpenCRM production-ready?</strong></summary>

OpenCRM is actively developed and includes essential security features (JWT auth, rate limiting, input sanitization). For production use, we recommend deploying behind a reverse proxy (Nginx), using MongoDB Atlas or a managed database, and configuring proper backups.
</details>

---

## 📄 License

OpenCRM is released under the [MIT License](LICENSE). You are free to use, modify, and distribute this software for any purpose, including commercial use.

---

## ⭐ Support the Project

If OpenCRM is useful to you, consider supporting the project:

- ⭐ **Star this repository** — it helps others discover OpenCRM
- 🐛 **Report bugs** — [open an issue](https://github.com/david1983/opencrm/issues)
- 💡 **Request features** — [start a discussion](https://github.com/david1983/opencrm/discussions)
- 🤝 **Contribute** — submit a pull request
- 📢 **Spread the word** — share OpenCRM with your network

---

<div align="center">

**Built with ❤️ by the OpenCRM community**

[⬆ Back to top](#-opencrm--free--open-source-crm)

</div>
