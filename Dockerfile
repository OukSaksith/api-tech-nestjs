# Use official Node.js LTS image as the base image
FROM node:20-alpine

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache \
    make \
    gcc \
    g++ \
    python3 \
    libc-dev

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 8000

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "run", "start:prod"]
