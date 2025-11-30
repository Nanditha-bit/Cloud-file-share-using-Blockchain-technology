# Cloud File Sharing System using Blockchain Technology

A decentralized cloud-based file sharing platform designed to provide secure, tamper-proof, and transparent file storage using blockchain concepts. The system integrates decentralized identity, secure uploads, and immutable file tracking with a modern web front-end powered by React, TypeScript, Vite, and Tailwind CSS.

This project focuses on enhancing data privacy, ownership, and auditability by leveraging blockchain-inspired techniques while using Supabase for authentication and cloud storage.

## Features

### Core Functionalities

* Secure user authentication and role-based access using Supabase Auth
* Encrypted file uploads and cloud storage
* Blockchain-style hashing for every uploaded file
* Immutable file history maintained through hash chaining
* Tamper detection using SHA-based hash recalculations
* User-friendly dashboard for uploading, viewing, and managing files
* Real-time activity logs

### Front-End Architecture

* **Vite** for fast bundling and development
* **React + TypeScript** for modular and type-safe UI
* **Tailwind CSS** for responsive styling
* **PostCSS** for style processing
* Organized components, pages, and service layers

### Blockchain Logic

* File hashing (SHA-256)
* Hash chaining to replicate blockchain immutability
* Python automation scripts (`rewrite.py`) for rewriting and validating metadata when required
* Integrity check mechanism to detect any unauthorized modification

## Project Structure

/
├── public/                     # Static assets
├── src/                        # React + TypeScript source code
│   ├── components/             # UI components
│   ├── pages/                  # User interface pages (Dashboard, Login, Upload)
│   ├── services/               # Blockchain logic, hashing utils, API handlers
│   └── main.tsx                # Application entry point
├── supabase/                   # Supabase configuration & migrations
├── .env                        # Environment variables (ignored)
├── index.html                  # App root HTML
├── package.json                # Project dependencies and scripts
├── tailwind.config.ts          # Tailwind styling configuration
├── postcss.config.js           # PostCSS pipeline config
├── eslint.config.js            # Linting configuration
├── tsconfig.json               # Global TypeScript settings
├── tsconfig.app.json           # App-specific TS settings
├── tsconfig.node.json          # Node environment TS settings
├── bun.lockb                   # Bun package manager lockfile (if used)
├── refresh.txt                 # Used internally for refresh processes
├── replace-emails.txt          # Utility data file, likely used by rewrite scripts
├── rewrite.py                  # Python script for blockchain metadata rewriting
└── vite.config.ts              # Vite configuration

## Technology Stack

### Front-End

* React (TypeScript)
* Vite
* Tailwind CSS
* PostCSS
* ESLint

### Backend / Cloud

* Supabase Auth
* Supabase Storage
* Database for user-file mapping
* Python-based blockchain metadata tooling

### Security

* SHA-256 hashing
* Immutable record generation
* Access control restrictions
* End-to-end integrity validation

## Environment Variables

Create a `.env` file in the root folder:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BLOCKCHAIN_SALT=any_salt_value_for_hashing
```

Do not commit real keys in your repository.

## Installation and Setup

### 1. Clone the repository

```
git clone <your-repo-url>
cd cloud-file-sharing-blockchain
```

### 2. Install dependencies

Using npm:

```
npm install
```

Using Bun:

```
bun install
```

### 3. Start the development server

```
npm run dev
```

### 4. Build the project

```
npm run build
```

### 5. Run blockchain rewrite / integrity script (if required)

```
python rewrite.py
```

## How Blockchain Logic Works

### 1. File Upload Process

1. User uploads a file.
2. System calculates SHA-256 hash of the file.
3. A metadata record is generated:

   ```
   {
     fileHash,
     previousHash,
     timestamp,
     userId
   }
   ```
4. This block is appended to the chain.

### 2. Hash Chaining

* Each new file block references the previous file’s hash
* This creates a tamper-evident chain similar to blockchain

### 3. Integrity Checking

* The system recalculates hashes to verify authenticity
* Any change triggers a mismatch alert

## Use Cases

* Secure cloud storage
* Academic file submission
* Enterprise document verification
* Digital content authenticity
* Legal document tracking

## Future Enhancements

* Actual decentralized storage using IPFS
* Smart contract integration
* File-sharing access tokens
* Complete audit dashboards
* Multi-device sync
* QR-code based secure sharing
