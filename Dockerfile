FROM node:26-alpine AS build
# Create app directory
WORKDIR /app
COPY package.json yarn.lock ./
RUN apk add --no-cache git && npm install --global yarn && yarn --frozen-lockfile
COPY . .
RUN yarn compile

FROM node:26-alpine AS runner
WORKDIR /app
COPY --from=build /app/lib /app/lib
COPY package.json yarn.lock ./
RUN npm install --global yarn && yarn --frozen-lockfile --production && yarn cache clean
COPY public /app/public
COPY config /app/config
RUN adduser -D tmea && chown -R tmea /app
USER tmea
CMD [ "yarn", "start:linux" ]
