/* CONFIGURATION */

let OpenVidu = require('openvidu-node-client').OpenVidu;
let OpenViduRole = require('openvidu-node-client').OpenViduRole;

require('dotenv').config()

// Environment variable: port to run server
let SERVER_PORT = process.env.SERVER_PORT;
// Environment variable: URL where our OpenVidu server is listening
let OPENVIDU_URL = process.env.OPENVIDU_URL;
// Environment variable: secret shared with our OpenVidu server
let OPENVIDU_SECRET = process.env.OPENVIDU_SECRET;
// Environment variable: Certificate type
let CALL_OPENVIDU_CERTTYPE = process.env.CALL_OPENVIDU_CERTTYPE;

// Check launch arguments: must receive port, openvidu-server URL and the secret
if (!SERVER_PORT || !OPENVIDU_URL || !OPENVIDU_SECRET) {
    console.log("Please set all environment vaiables!!");
    process.exit(-1);
}

// Node imports
let express = require('express');
let fs = require('fs');
let session = require('express-session');
let http = require('http');
let https = require('https');
let bodyParser = require('body-parser'); // Pull information from HTML POST (express4)
const { ConnectionType } = require('openvidu-node-client');
const path = require('path');
let app = express(); // Create our app with express

// Server configuration
app.use(session({
    saveUninitialized: true,
    resave: false,
    secret: 'MY_SECRET'
}));
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // Parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // Parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // Parse application/vnd.api+json as json

if(CALL_OPENVIDU_CERTTYPE === 'selfsigned') {

    // For demo purposes we ignore self-signed certificate
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

    let options = {
        key: fs.readFileSync('openvidukey.pem'),
        cert: fs.readFileSync('openviducert.pem')
    };

    // Listen (start app with node server.js)
    https.createServer(options, app).listen(SERVER_PORT);
}
else {
    http.createServer(app).listen(SERVER_PORT);
} 

// Entrypoint to OpenVidu Node Client SDK
let OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
// Session Name
let mySession = null;
// list of cameras
let ipcameras = [];

let isIpcamConnection = false;

console.log("App listening on port " + SERVER_PORT);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

app.post('/ipcam', (req, res) => {
    
    mySession = req.body.session;
    ipcameras = req.body.cameras;
    isIpcamConnection = req.body.isIpcam;
    createAndPublish(res);

});

function createAndPublish(res) {
    // Connection flow starts here
    try {
        fetchSession().then( session => {
            publishCameras().then (success => {
                // createSubscriberConnection(res);
            })
            .catch(error => {
                console.log('Camera connection error!!');
            }) 
        })
        .catch(error => { 
            console.log('session creation error!!');
        });
    }
    catch(error) {
        console.log("Error in getting session and publishing cameras!!");
    }
}

function fetchSession() {
    
    return new Promise(function (resolve, reject) {
        // Fetch all session info from OpenVidu Server
        OV.fetch()
        .then(anyChange => {
            let activeSessions = OV.activeSessions;
            // Chech surveillance session already present
            mySession = activeSessions.find(u => (u.getSessionId() === mySession));
            resolve(mySession)
        })
        .catch(error=>console.log('Error in fetching session'));
    });
}

function publishCameras() {

    return new Promise(function (resolve, reject) {
        // Fetch one session info from OpenVidu Server
        mySession.fetch()
        .then(async anyChange => {
            let activeConnections = mySession.activeConnections;
            
            let publishedCameras = [];
            if(activeConnections !== undefined) {
                // looping through all connected cameras
                Object.entries(activeConnections).forEach(function(connection) {
                    let ac = activeConnections[connection[0]];
                    if((ac.platform === ConnectionType.IPCAM || ac.connectionProperties.type === 'rtsptortp' || 
                            ac.connectionProperties.type === 'rtsptortsp' || ac.connectionProperties.type === 'filetortsp') 
                            && ac.serverData !== undefined) {
                        console.log('Ip Camera already connected : ' + ac.serverData);
                        publishedCameras.push(ac.serverData);
                    }
                });
            }
            
            if(isIpcamConnection) {
                // creates connection to provided ip cameras
                for(const ipcam of ipcameras) {
                    let cameraName = ipcam.cam;
                    let cameraUri = ipcam.ip;
                    
                    // check cameras already published in the session
                    if(publishedCameras.indexOf(cameraName) == -1) {
                        
                        let connectionProperties = {
                            "type": ConnectionType.IPCAM,
                            "data": cameraName,
                            "rtspUri": cameraUri,
                            "adaptativeBitrate": true,
                            "onlyPlayWithSubscribers": true,
                            "networkCache": 2000,
                            // "kurentoOptions": {
                            //     "allowedFilters": [ "GStreamerFilter" ]
                            // }
                        };

                        // "mySession" being a Session object
                       await mySession.createIPCamConnection(connectionProperties)
                            .then(ipcamConnection => { 
                                console.log('session connected to ip camera : ' + cameraName);
                             })
                             .catch(error => {
                                 console.log('Error in create connection for ip camera : ' + cameraName);
                                 reject(error);
                             });    
                    } 
                }
            }
            else {
                for(const ipcam of ipcameras) {
                    let cameraUri = ipcam.ip;
                    let serverPort = ipcam.port;
                    let serverType = ipcam.type;
                    let serverData = ipcam.port.toString();

                    // check cameras already published in the session
                    if(publishedCameras.indexOf(serverData) == -1) {

                        let connectionProperties = {
                            "type": serverType,
                            "port": serverPort,
                            "data": serverData,
                            "rtspUri": cameraUri
                        };

                        // "mySession" being a Session object
                       await mySession.createServerConnection(connectionProperties)
                            .then(ipcamConnection => { 
                                console.log('session connected to ip camera : ' + cameraUri);
                             })
                             .catch(error => {
                                 console.log('Error in create connection for ip camera : ' + cameraUri);
                                 reject(error);
                             });    
                    } 
                }
            }
            
            resolve('created connection');
        });
    }); 
}

function createSubscriberConnection(res) {

    // Create a Connection for the client
    let connectionProperties = {
        type: ConnectionType.WEBRTC,
        role: OpenViduRole.SUBSCRIBER
    };
    
    let token = null;
    try{
            mySession.createConnection(connectionProperties).then(connection => { 
            token = connection.token; // Send this string to the client side
            // Return session template with all the needed attributes
            res.send(token);
        }).catch( error => {
            if(error.status == 404) {
                createAndPublish();
                mySession.createConnection(connectionProperties).then(connection => { 
                    token = connection.token; // Send this string to the client side

                    res.send(token);
                }).catch(error=>{
                    console.log('error in create connection second');
                });
            }
            else {
                console.log('Error creating connection for session!!');
            }
        });
    }   
    catch{
        console.log('Subscriber connection error!!');
    }
}

app.post('/deleteipcam', (req, res) => {
    let camera = req.body.camera;
    mySession = req.body.session;

    try {
        fetchSession().then(async session => {
            if(mySession != null && camera !== '') {

                // get all active connections in the session
                let activeConnections = mySession.activeConnections;
               
                if(activeConnections !== undefined) {
                   
                    for(const cam of camera) {
                        // looping through all available camera connections
                        for(const ac of activeConnections){
                            
                            // check for camera connected to session
                            if((ac.platform === ConnectionType.IPCAM || ac.platform === 'rtsptortp' || 
                                    ac.platform === 'rtsptortsp' || ac.platform === 'filetortsp') && ac.serverData === cam) {
            
                                //console.log('Ip Camera connection removed: ' + ac.serverData);
                                // remove the connection
                                await mySession
                                    .forceDisconnect(ac)
                                    .catch(error => {
                                        console.log("Error in disconnecting camera!")
                                    });
                            }
                        }
                     }
                }
            }
        })
        .catch(error => { 
            console.log('session creation error!!');
        });
    }
    catch(error) {
        console.log("Error in getting session and unpublishing cameras!!");
    }
});