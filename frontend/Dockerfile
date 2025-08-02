# Use NGINX as the base image
FROM nginx:alpine

# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy all frontend static files (HTML, CSS, JS, PDF, etc.)
COPY . /usr/share/nginx/html/

# Expose NGINX default port
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
