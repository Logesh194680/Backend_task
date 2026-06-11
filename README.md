## Prerequisites

### Required:
- Node.js (v14 or higher)
- PostgreSQL (or SQLite for development)

### Optional (for enhanced rate limiting):
- Redis Server

## Setup Options

### Option 1: Quick Start (without Redis)
The application works perfectly without Redis, using in-memory rate limiting.

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm start
