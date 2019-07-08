FROM node:11-slim
MAINTAINER Eli Sheets
RUN npm i npm@latest -g
RUN mkdir /ideablock-cli && chown node:node /ideablock-cli
WORKDIR /ideablock-cli
COPY package.json /ideablock-cli/package.json
RUN npm install --no-optional && npm cache clean --force
RUN mkdir ~/.ideablock
RUN touch ~/.ideablock/auth.json
COPY . /ideablock-cli
CMD ["npm","start"]