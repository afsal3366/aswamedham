# Step 1: Use an Nginx image to serve the static files
FROM nginx:stable-alpine

# Copy the build output from the local dist folder to the Nginx html folder
COPY ./dist /usr/share/nginx/html

# Copy a basic Nginx config to handle SPA routing (optional but recommended)
# If you need custom redirects, you can add an nginx.conf here too.

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
