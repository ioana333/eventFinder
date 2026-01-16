FROM node:20-bookworm-slim

WORKDIR /app

# 1) Pachete OS necesare pentru Python deps + lxml + psycopg2
RUN apt-get update && apt-get install -y \
  python3 python3-pip python3-venv \
  build-essential \
  libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# 2) Copiem doar requirements și instalăm deps Python (cache-friendly)
COPY requirements.txt ./requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# 3) Copiem backend-ul
COPY package*.json ./
RUN npm ci

COPY . .

# (dacă folosești Prisma în container)
# RUN npx prisma generate

ENV PYTHON_CMD=python3

EXPOSE 4000
CMD ["npm", "run", "dev"]
