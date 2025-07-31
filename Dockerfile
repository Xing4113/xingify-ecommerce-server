# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json first for faster rebuilds
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose backend port
EXPOSE 5000

# Run the server
CMD ["npm", "start"]
