FROM node:25-alpine as build
# Create app directory
WORKDIR /app
COPY package.json yarn.lock ./
RUN apk add --no-cache git && yarn --frozen-lockfile
COPY . .
RUN yarn compile

FROM node:25-alpine as runner
WORKDIR /app
COPY --from=build /app/lib /app/lib
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --production && yarn cache clean
COPY public /app/public
COPY config /app/config
RUN adduser -D tmea && chown -R tmea /app
USER tmea
CMD [ "yarn", "start:linux" ]
