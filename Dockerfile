FROM node:14-alpine as build
# Create app directory
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN apk add --no-cache git
RUN yarn
COPY . .

FROM node:14-alpine as runner
# Bundle app source
COPY --from=build /usr/src/app /usr/src/app
WORKDIR /usr/src/app
CMD [ "yarn", "start" ]