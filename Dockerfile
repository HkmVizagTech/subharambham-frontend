# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Pass API base to the React build
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

COPY . .
RUN npm run build

# Runtime stage: serve static build with nginx
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

# Cloud Run uses $PORT
ENV PORT=8080
EXPOSE 8080
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;' -c /etc/nginx/nginx.conf"]
