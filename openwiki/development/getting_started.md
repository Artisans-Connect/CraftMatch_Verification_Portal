---
type: "Reference"
title: "Getting Started & Development"
description: "Setup procedures, dev scripts, and dependency management instructions for the Verification Portal."
---

# Getting Started & Development

This page outlines the setup procedure and development workflows for the **CraftMatch Verification Portal** project.

## Prerequisites
Ensure Node.js `>=20.0.0` is installed on your machine.

---

## Installation

1. Navigate to the project directory:
   ```bash
   cd CraftMatch_Verification_Portal
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Modify the values in `.env` to match your local development environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_API_URL`

---

## Development Scripts

The following npm commands are configured in [package.json](file:///c:/Users/user/Downloads/FinalYearProject/CraftMatch_Verification_Portal/package.json):

### Running Locally
To launch the Vite development server:
```bash
npm run dev
```
The application will default to running on `http://localhost:5173/`.

### Linting and Type Checking
Run ESLint statically across the codebase:
```bash
npm run lint
```
Perform Type Script compile checking:
```bash
npm run typecheck
```

### Production Build
Compile and bundle optimization code under `dist/`:
```bash
npm run build
```
To run a local preview server for the compiled bundle:
```bash
npm run preview
```

### Wiki Management
- **`npm run docs:wiki:init`**: Initialize the local OpenWiki documentation directory.
- **`npm run docs:wiki:update`**: Update and reconcile recent changes in documentation files.
