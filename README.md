# ContactBook — Address Book Manager Frontend

An Angular 17 single-page application for managing address books and contacts, connected to a Spring Boot REST API deployed on AWS Elastic Beanstalk.

**Live demos**
- Vercel: https://quantity-measurement-app-frontend-tawny.vercel.app 
---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment & Configuration](#environment--configuration)
- [Deployment](#deployment)
- [Authentication Flow](#authentication-flow)
- [Route Guard Behavior](#route-guard-behavior)

---

## Overview

ContactBook is a full-stack address book application. This repository contains only the **Angular frontend**. The backend is a Spring Boot application deployed on AWS Elastic Beanstalk at:

```
http://addressbook.us-east-1.elasticbeanstalk.com
```

Swagger UI: http://addressbook.us-east-1.elasticbeanstalk.com/swagger-ui/index.html

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17 (standalone components) |
| Language | TypeScript 5.4 |
| Styles | SCSS |
| HTTP | Angular `HttpClient` + functional interceptors |
| Routing | Angular Router with lazy-loaded routes |
| Auth | JWT (stored in `localStorage`) |
| Fonts | Nunito, Baloo 2 (Google Fonts) |
| Build | Angular CLI 17 (`ng build --configuration production`) |
| CI/CD | GitHub Actions → GitHub Pages |
| Hosting | Vercel (primary) + GitHub Pages (legacy) |
| API Proxy | Vercel rewrites (`/api/*` → Elastic Beanstalk) |

---

## Project Structure

```
src/
└── app/
    ├── components/
    │   ├── book-list/          # Address book list (scaffold)
    │   ├── contact-card/       # Contact card (scaffold)
    │   ├── contact-modal/      # Contact form modal (scaffold)
    │   └── sidebar/            # Sidebar (scaffold)
    ├── guards/
    │   └── auth.guard.ts       # authGuard + guestGuard
    ├── interceptors/
    │   └── auth.interceptor.ts # Attaches Bearer token; handles 401/403
    ├── models/
    │   └── models.ts           # Interfaces: AddressBook, Contact, ContactDTO, AuthResponse, etc.
    ├── pages/
    │   ├── home/               # Main dashboard — books + contacts + search + filter + count
    │   ├── login/              # Login page
    │   └── register/           # Registration page
    ├── services/
    │   ├── addressbook.service.ts  # All address book + contact API calls
    │   └── auth.service.ts         # Register, login, logout, token management
    ├── app.component.ts
    ├── app.config.ts
    └── app.routes.ts           # Route definitions with lazy loading
```

---

## Features

### Authentication
- **Register** — username, email, password with real-time password strength indicator (Weak / Medium / Strong) and confirm-password validation
- **Login** — username + password with show/hide toggle
- JWT stored in `localStorage` under key `cb_jwt`; username stored under `cb_user`
- JWT expiry is checked client-side on every `isLoggedIn()` call — expired tokens are cleared automatically without hitting the server
- `401` or `403` responses from the API trigger automatic logout via the HTTP interceptor

### Address Books
- List all address books in the sidebar with a contact count badge and emoji icon
- Create a new book by name
- Delete a book (with confirmation) — cascades to all contacts
- Click a book to load its contacts

### Contacts
- View all contacts for the selected book as cards showing: name initials (color-coded), full name, email, full address, phone
- Add a new contact (firstName, lastName, address, city, state are required; zip, phone, email are optional)
- Edit an existing contact (form pre-filled)
- Delete a contact (with confirmation)
- **Sort** contacts by name or by location (via API)
- **Local search** — filter visible contacts by name, city, or email instantly

### Global Panels (via top panel switcher)
| Panel | Description | API |
|---|---|---|
| Contacts | Default — contacts in the selected book | `GET /api/addressbooks/{id}/contacts` |
| Search | Search contacts across all books by name | `GET /api/addressbooks/contacts/search?name=` |
| Filter | Filter all contacts by city or state | `GET /api/addressbooks/contacts/city/{city}` or `/state/{state}` |
| Count | Count contacts matching a city or state | `GET /api/addressbooks/contacts/count?city=&state=` |

### UI / UX
- Animated floating bubble backgrounds on login and register pages
- Color-coded avatar initials for contacts and book emoji icons derived from a deterministic hash
- Toast notifications (success ✅ / error ❌) auto-dismiss after 2.8 seconds
- `Escape` key closes modals and user menus
- Fully responsive layout

---

## Architecture

### HTTP Flow

```
Angular Component
      │
      ▼
AddressbookService / AuthService
      │  Observable<T>
      ▼
HttpClient
      │
      ▼  (authInterceptor adds Bearer token to every request)
Vercel Rewrite Proxy  →  /api/*  →  http://addressbook.us-east-1.elasticbeanstalk.com/api/*
      │
      ▼
Spring Boot API (AWS Elastic Beanstalk)
      │
      ▼
MySQL (AWS RDS — addressbook_db)
```

 On **Vercel**, the `vercel.json` rewrite proxies `/api/*` to the EB backend, so the frontend uses `/api` as a relative base path.

### API Response Unwrapping

All backend responses follow a `{ data: T, message?: string }` wrapper. `AddressbookService` normalises this with a `private extract<T>()` helper. `AuthService` additionally handles both wrapped (`{ data: { token } }`) and direct (`{ token }`) shapes from the auth endpoints.

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register — body: `{ username, email, password }` |
| `POST` | `/api/auth/login` | Login — body: `{ username, password }` → returns JWT |

### Address Books
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/addressbooks` | Get all address books |
| `POST` | `/api/addressbooks?name={name}` | Create a new address book |
| `GET` | `/api/addressbooks/{id}` | Get a single address book |
| `DELETE` | `/api/addressbooks/{id}` | Delete an address book |

### Contacts
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/addressbooks/{bookId}/contacts` | Get all contacts in a book |
| `GET` | `/api/addressbooks/{bookId}/contacts/sorted/name` | Contacts sorted by name |
| `GET` | `/api/addressbooks/{bookId}/contacts/sorted/location` | Contacts sorted by location |
| `POST` | `/api/addressbooks/{bookId}/contacts` | Add a contact |
| `PUT` | `/api/addressbooks/{bookId}/contacts/{firstName}/{lastName}` | Update a contact |
| `DELETE` | `/api/addressbooks/{bookId}/contacts/{firstName}/{lastName}` | Delete a contact |
| `GET` | `/api/addressbooks/contacts/{contactId}` | Get contact by ID |
| `GET` | `/api/addressbooks/contacts/search?name=` | Search contacts by name |
| `GET` | `/api/addressbooks/contacts/city/{city}` | Filter contacts by city |
| `GET` | `/api/addressbooks/contacts/state/{state}` | Filter contacts by state |
| `GET` | `/api/addressbooks/contacts/count?city=&state=` | Count contacts by city or state |

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- Angular CLI 17: `npm install -g @angular/cli@17`

### Install & run locally

```bash
git clone https://github.com/ANUBHAV-03042004/AddressbookApp-Frontend.git
cd AddressbookApp-Frontend
npm install
ng serve
```

Open http://localhost:4200. The Angular dev server proxies `/api/*` requests to the backend through Vercel rewrites at build time; for local dev you may need to add a `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://addressbook.us-east-1.elasticbeanstalk.com",
    "secure": false,
    "changeOrigin": true
  }
}
```

And update `angular.json` under `architect.serve.options`:
```json
"proxyConfig": "proxy.conf.json"
```

### Build for production

```bash
npm run build
# Output: dist/addressbook-frontend/browser/
```

---

## Environment & Configuration

There is no `environment.ts` file — the API base path is set directly in the services:

| Service | Base path | Notes |
|---|---|---|
| `AddressbookService` | `/api` | Relative — works via Vercel proxy |
| `AuthService` | `/api/auth` | Relative — works via Vercel proxy |

To point at a different backend (e.g. for local development), update the `private api` field in both services, or add an Angular proxy config as described above.

---

## Deployment

### Vercel (primary — automatic)

Pushes to `main` trigger a Vercel deployment automatically. The `vercel.json` at the repo root configures:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/addressbook-frontend/browser",
  "framework": "angular",
  "rewrites": [
    { "source": "/api/:path*", "destination": "http://addressbook.us-east-1.elasticbeanstalk.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The first rewrite proxies all API calls server-side, avoiding CORS issues entirely. The second rewrite enables Angular's client-side routing (all paths fall through to `index.html`).

---

## Authentication Flow

```
User fills login form
        │
        ▼
AuthService.login() → POST /api/auth/login
        │
        ▼
Backend returns { token, username, tokenType, expiresInMs }
        │
        ▼
AuthService.persist() → localStorage.setItem('cb_jwt', token)
                      → localStorage.setItem('cb_user', username)
        │
        ▼
Router navigates to /home
        │
        ▼
Every subsequent HTTP request:
  authInterceptor reads cb_jwt
  → clones request with Authorization: Bearer <token>
        │
        ▼
On 401/403 (non-auth endpoint):
  authInterceptor calls auth.logout()
  → clears localStorage
  → Router navigates to /login
```

Token expiry is also checked **client-side** in `isLoggedIn()` by decoding the JWT payload and comparing `exp * 1000` to `Date.now()`, so expired tokens are cleared before they even reach the network.

---

## Route Guard Behavior

| Guard | Applied to | Behaviour |
|---|---|---|
| `authGuard` | `/home` | Redirects to `/login` if `isLoggedIn()` returns false |
| `guestGuard` | `/login`, `/register` | Redirects to `/home` if `isLoggedIn()` returns true |

All unknown routes (`**`) redirect to `/home`, which then defers to `authGuard`.
