# ── Stage 1: install Node dependencies ───────────────────────────────────────
FROM node:20-alpine AS deps

# openssl → Prisma TLS; libc6-compat → Alpine glibc shim
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install all deps (devDeps are needed for the build stage)
RUN npm ci

# Generate Prisma client — reads schema only, no DB connection required
RUN npx prisma generate


# ── Stage 2: Next.js build ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build


# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

# System packages:
#   openssl        → Prisma TLS connections
#   python3        → TTS / STT audio scripts (generate_audio.py, stt_evaluate.py, …)
#   py3-pip        → install Python packages
#   python3-dev    → headers needed to compile numpy / soundfile wheels
#   ffmpeg         → audio conversion used by generate_conversation.py
#   gcc/g++/musl   → compile C-extension wheels
#   libsndfile-dev → soundfile backend
RUN apk add --no-cache \
      openssl \
      python3 \
      py3-pip \
      python3-dev \
      ffmpeg \
      gcc \
      g++ \
      musl-dev \
      libffi-dev \
      libsndfile-dev

# Python audio / ML packages (see requirements.txt)
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --home /home/nextjs nextjs \
 && mkdir -p /home/nextjs/audio_samples \
 && chown -R nextjs:nodejs /home/nextjs

# ── Next.js standalone output ─────────────────────────────────────────────────
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

# ── Prisma client + schema ────────────────────────────────────────────────────
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# ── Python scripts (TTS / STT) ────────────────────────────────────────────────
COPY --from=builder --chown=nextjs:nodejs /app/generate_audio.py        ./
COPY --from=builder --chown=nextjs:nodejs /app/batch_generate_audio.py  ./
COPY --from=builder --chown=nextjs:nodejs /app/generate_conversation.py ./
COPY --from=builder --chown=nextjs:nodejs /app/stt_evaluate.py          ./

# ── Static benchmark data ─────────────────────────────────────────────────────
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# HOME is used by Python's Path("~").expanduser() in audio scripts
ENV HOME=/home/nextjs

# ─────────────────────────────────────────────────────────────────────────────
# Required runtime env vars — pass via docker run -e or docker-compose env_file:
#   DATABASE_URL      — PostgreSQL connection (Supabase pooler URL)
#   DIRECT_URL        — PostgreSQL direct connection (for Prisma migrations)
#   ANTHROPIC_API_KEY — Claude API key from console.anthropic.com
# ─────────────────────────────────────────────────────────────────────────────
CMD ["node", "server.js"]
