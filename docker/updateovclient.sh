#!/bin/sh

cp docker/Connection.js node_modules/openvidu-node-client/lib/Connection.js
cp docker/Session.js node_modules/openvidu-node-client/lib/Session.js

echo "Updated openvidu-client!"
