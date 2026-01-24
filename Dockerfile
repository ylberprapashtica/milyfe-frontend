FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json first for better caching
COPY package.json ./

# Copy package-lock.json if it exists
COPY package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment variable to allow external connections
ENV HOST=0.0.0.0

# Start the development server
CMD ["npm", "start"]

