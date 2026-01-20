
---

## Prerequisites

Make sure you have installed:
- Docker
- Docker Compose
- Node.js (LTS recommended)
- npm

---

## Run the Project Locally

### 1. Start Docker containers

From the **APP** folder:

```bash
docker compose up -d
```
Check running containers
```bash
docker ps
```

### 2. Start the backend
From the **backend** folder:

- install depencies
```bash
npm install
```
- create or replace the .env file
- clean install
```bash
npm ci
```
- prisma setup
```bash
npx prisma generate
npx prisma migrate dev
```
- if migration fails due to existing data:
```bash
npx prisma reset
```
- set the database
```bash
npm run seed
```
- start the backend
```bash
npm run dev
```
### 3. Start the frontend
- create or replace the .env file
- install the depencies
```bash
npm ci
```
- start the frontend
```bash
npm run dev
```
