# Stage 1: Build the Expo web app
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the code and build
COPY . .
RUN npx expo export --platform web

# Stage 2: Serve the static files with Nginx
FROM nginx:stable-alpine

# Copy the build output from the builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
