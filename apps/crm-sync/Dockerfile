FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY apps/crm-sync ./apps/crm-sync
RUN npm install --workspace=apps/crm-sync --include-workspace-root
WORKDIR /app/apps/crm-sync
EXPOSE 8081
CMD ["npm", "run", "dev"]
