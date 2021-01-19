# Build OpenVidu IpCamera for production
FROM node:lts-alpine3.12 as openvidu-ipcam-build

# Create app directory
WORKDIR /openvidu-ipcam

RUN apk add wget

COPY . .
	
# Build openvidu ipcamera
RUN rm client/package-lock.json && \
    rm package-lock.json && \
    # Install openvidu ipcamera frontend dependencies and build it for production
    npm i --prefix client && \
    npm run build --prefix client && \
    mv client/build/ . && \
    rm -rf client/ && \
    mkdir client && \
    mv build/ client/ && \
    # Install openvidu ipcamera backend dependencies
    npm i && \
    # Copy openvidu-node-client file changes to node_modules
    chmod +x docker/updateovclient.sh && \
    sh docker/updateovclient.sh	


FROM node:lts-alpine3.11

WORKDIR /opt/openvidu-ipcam

COPY --from=openvidu-ipcam-build /openvidu-ipcam .
# Entrypoint
COPY docker/entrypoint.sh /usr/local/bin
RUN apk add curl && \
    chmod +x /usr/local/bin/entrypoint.sh && \
    npm install -g nodemon

# CMD /usr/local/bin/entrypoint.sh
CMD ["/usr/local/bin/entrypoint.sh"]
