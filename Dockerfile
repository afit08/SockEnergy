# Use the official Node.js image as a base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the container
COPY package*.json yarn.lock ./

# Install dependencies
RUN apt-get update \
    && apt-get install -y bash curl \
    && curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
    && apt-get install -y infisical \
    && rm -rf /var/lib/apt/lists/*

# Install application dependencies using Yarn
RUN yarn install 

# Copy the application code to the container
COPY . .

# Expose the port your app will run on
EXPOSE 3000

# Command to run your application
CMD ["yarn", "start:dev"]
