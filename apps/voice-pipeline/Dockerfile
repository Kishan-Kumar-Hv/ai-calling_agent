FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY apps/voice-pipeline ./apps/voice-pipeline
RUN npm install --workspace=apps/voice-pipeline --include-workspace-root
WORKDIR /app/apps/voice-pipeline
EXPOSE 8080
CMD ["npm", "run", "dev"]
