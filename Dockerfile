FROM node:14-alpine as build
# Create app directory
ARG NODE_AUTH_TOKEN
WORKDIR /app
COPY package.json yarn.lock .npmrc ./
RUN apk add --no-cache git && yarn --frozen-lockfile
COPY . .
RUN rm -f .npmrc
RUN yarn compile

FROM node:14-alpine as runner
ARG NODE_AUTH_TOKEN
WORKDIR /app
COPY --from=build /app/lib /app/lib
COPY package.json yarn.lock .npmrc ./
RUN yarn --frozen-lockfile --production && rm -f .npmrc && yarn cache clean
COPY public /app/public
COPY config /app/config
RUN adduser -D tmea && chown -R tmea /app
USER tmea
CMD [ "yarn", "start:linux" ]