# syntax = docker/dockerfile:1.2
FROM node:gallium-alpine3.16

# Environment variables
ENV NODE_ENV=production
ENV PORT=80

# Create app directory with permissions
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Set working directory
WORKDIR /home/node/app

# Copy package.json and package-lock.json to working directory
COPY package*.json ./

# Set ownership for files to be added to working directory
USER node

# Install dependencies
RUN yarn

# Copy source code to working directory
COPY --chown=node:node . .

# Will make port 80 available for external connections at runtime
EXPOSE 80

RUN --mount=type=secret,id=_env,dst=/etc/secrets/.env cat /etc/secrets/.env

CMD [ "node", "./bin/www" ]