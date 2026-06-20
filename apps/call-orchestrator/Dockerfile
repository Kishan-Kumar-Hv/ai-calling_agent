FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY apps/call-orchestrator ./apps/call-orchestrator
RUN npm install --workspace=apps/call-orchestrator --include-workspace-root
WORKDIR /app/apps/call-orchestrator
EXPOSE 4000
CMD ["npm", "run", "dev"]
