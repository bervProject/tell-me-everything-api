FROM node:14-alpine as build
# Create app directory
ARG NODE_AUTH_TOKEN
WORKDIR /app
COPY package.json yarn.lock .npmrc ./
RUN apk add --no-cache git && yarn
COPY . .
RUN rm -f .npmrc
RUN yarn compile

FROM node:14-alpine as runner
# Bundle app source
WORKDIR /app
COPY --from=build /app /app
RUN adduser -D tmea
USER tmea
CMD [ "yarn", "start:prod" ]