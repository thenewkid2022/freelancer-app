# 🚀 Freelancer App

> **Eine moderne Webanwendung für Freelancer und ihre Kunden zur Verwaltung von Zeiterfassung, Abrechnungen und Projekten.**

![Vercel](https://img.shields.io/badge/Frontend-Vercel-blue?logo=vercel)
![Render](https://img.shields.io/badge/Backend-Render-green?logo=render)
![TypeScript](https://img.shields.io/badge/TypeScript-Frontend%20%26%20Backend-blue?logo=typescript)
![MUI](https://img.shields.io/badge/UI-Material--UI-blueviolet?logo=mui)
![MongoDB](https://img.shields.io/badge/DB-MongoDB-brightgreen?logo=mongodb)

---

## ✨ Features

- ⏱️ **Zeiterfassung** für Projekte
- 📁 Verwaltung von **Kunden & Projekten**
- 🧾 **Rechnungsstellung** & Export
- 👤 **Benutzerprofil** mit Bearbeitungsfunktion (Name, E-Mail, Sprache, Passwort)
- 🌙 **Darkmode** (umschaltbar im Profil, systemweit gespeichert)
- 🔔 **E-Mail-Benachrichtigungen** (optional)
- 🌐 **Mehrsprachigkeit** (Deutsch/Englisch)
- 📱 **Responsive Design** (optimiert für Desktop & Mobile)
- 🔒 **Sichere Authentifizierung** (JWT)
- 📖 **API-Dokumentation** via Swagger

---

## 🗂️ Projektstruktur

```text
freelancer-app/
├── frontend/                 # React Frontend (TypeScript, MUI)
│   ├── src/
│   │   ├── components/      # UI-Komponenten (inkl. Profile, Settings, Navbar)
│   │   ├── contexts/        # Globale Contexts (z.B. Auth, Theme)
│   │   ├── hooks/           # Custom React Hooks
│   │   ├── services/        # API Services
│   │   ├── types/           # Typdefinitionen
│   │   └── utils/           # Hilfsfunktionen
│   └── public/              # Statische Dateien
│   └── package.json         # Frontend Dependencies
│
├── server/                  # Node.js Backend (Express, TypeScript)
│   ├── src/
│   │   ├── config/          # Konfiguration
│   │   ├── controllers/     # API Controller
│   │   ├── middleware/      # Express Middleware
│   │   ├── models/          # Mongoose Modelle
│   │   ├── routes/          # API Routen
│   │   ├── services/        # Business Logic
│   │   ├── tests/           # Integrationstests
│   │   ├── types/           # Typdefinitionen
│   │   └── utils/           # Hilfsfunktionen
│   └── package.json         # Backend Dependencies
│
├── .github/                 # GitHub Actions Workflows
├── .gitignore
├── package.json             # Root Dependencies
├── tsconfig.json            # TypeScript Konfiguration
├── vercel.json              # Vercel Deployment Konfiguration (Frontend)
└── render.yaml              # Render Deployment Konfiguration (Backend)
```

---

## 🛠️ Technologien

### Frontend
- ⚛️ React mit TypeScript
- 🎨 Material-UI (MUI) für das UI
- 🔄 React Query für Datenverwaltung
- 🧭 React Router für Navigation
- 🧩 Context API (u.a. für Auth und Theme/Darkmode)
- 🧪 Jest & React Testing Library für Tests
- 💾 file-saver für Datei-Downloads

### Backend
- 🟩 Node.js mit Express
- 🟦 TypeScript
- 🍃 MongoDB mit Mongoose
- 🔑 JWT für Authentifizierung
- 🧪 Jest für Tests
- 📖 Swagger für API Dokumentation

---

## ⚡ Schnellstart

1. **Repository klonen:**
    ```bash
    git clone https://github.com/your-username/freelancer-app.git
    cd freelancer-app
    ```

2. **Dependencies installieren:**
    ```bash
    # Root Dependencies
    npm install

    # Frontend Dependencies
    cd frontend
    npm install

    # Backend Dependencies
    cd ../server
    npm install
    ```

3. **Umgebungsvariablen konfigurieren:**
    ```bash
    # Server .env
    cp server/.env.example server/.env

    # Frontend .env
    cp frontend/.env.example frontend/.env
    ```

4. **Entwicklungsserver starten:**
    ```bash
    # Backend
    cd server
    npm run dev

    # Frontend
    cd frontend
    npm start
    ```

---

## 🧪 Tests

```bash
# Backend Tests
cd server
npm test

# Frontend Tests
cd frontend
npm test
```

---

## 🚀 Deployment

- **Frontend:** Automatisches Deployment über [Vercel](https://vercel.com/) (`vercel.json`)
- **Backend:** Automatisches Deployment über [Render](https://render.com/) (`render.yaml`)

---

## 📖 API Dokumentation

Die API-Dokumentation ist über Swagger verfügbar:
- Entwicklung: [`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)
- Produktion: [`https://api.freelancer-app.com/api-docs`](https://api.freelancer-app.com/api-docs)

---

## 🖼️ Screenshots

> **Tipp:** Füge hier aktuelle Screenshots der wichtigsten Ansichten ein (z.B. Profil mit Darkmode, Dashboard, Zeiterfassung).

---

## 📄 Lizenz

MIT

---

> **Hinweis:**
> Diese README ist auf dem Stand nach den letzten größeren Änderungen (Darkmode, Profil-Update, Layout). Bitte bei weiteren Features oder Änderungen regelmäßig aktualisieren! 