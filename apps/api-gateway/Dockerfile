FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY apps/api-gateway ./apps/api-gateway
RUN npm install --workspace=apps/api-gateway --include-workspace-root
WORKDIR /app/apps/api-gateway
EXPOSE 3000
CMD ["npm", "run", "dev"]
