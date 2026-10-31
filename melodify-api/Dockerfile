# --------------------------------------------------
# Stage 1: Build
# --------------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

# Match local npm version
RUN npm install -g npm@11.8.0

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# --------------------------------------------------
# Stage 2: Production
# --------------------------------------------------

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Match local npm version
RUN npm install -g npm@11.8.0

# Required by audio processing worker
RUN apk add --no-cache ffmpeg

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["npm", "start"]