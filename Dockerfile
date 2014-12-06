FROM node

WORKDIR /usr/src/app

ADD ./package.json /usr/src/app/package.json
RUN npm install

ADD ./bin /usr/src/app/bin
ADD ./lib /usr/src/app/lib
ADD ./middleware /usr/src/app/middleware
ADD ./resources /usr/src/app/resources
ADD ./test /usr/src/app/test
ADD ./server.js /usr/src/app/server.js

EXPOSE 9001

CMD [ "./bin/server" ]
