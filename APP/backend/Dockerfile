FROM node:20-bookworm

RUN apt-get update && apt-get install -y python3 python3-venv python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# deps node
COPY package*.json ./
RUN npm ci

# deps python in venv
COPY requirements.txt ./
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt


# restul codului
COPY . .

RUN npm run build

EXPOSE 4000
CMD ["npm", "start"]
