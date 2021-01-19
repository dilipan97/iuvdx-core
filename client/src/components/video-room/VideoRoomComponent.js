import React, { Component } from 'react';
import axios from 'axios';
import './VideoRoomComponent.css';
import { OpenVidu } from 'openvidu-browser';
import StreamComponent from '../stream/StreamComponent';
import DialogExtensionComponent from '../dialog-extension/DialogExtension';
import ChatComponent from '../chat/ChatComponent';
import OpenViduLayout from '../../layout/openvidu-layout';
import UserModel from '../../models/user-model';
import ToolbarComponent from '../toolbar/ToolbarComponent';
import IpCameraComponent from '../ip-camera/IpCameraComponent';
import IpcamServerComponent from '../ipcam-server/IpcamServerComponent';
import IpCamModel from '../../models/ipcam-model';
import { config } from '../Constants';

var localUser = new UserModel();

const screen_share = require('../../assets/images/screen.png')

export default class VideoRoomComponent extends Component {
    constructor(props) {
        super(props);
        this.OPENVIDU_SERVER_URL = config.OPENVIDU_SERVER_URL;
        this.OPENVIDU_SERVER_SECRET = config.OPENVIDU_SERVER_SECRET;
        this.hasBeenUpdated = false;
        this.layout = new OpenViduLayout();
        let sessionName = this.props.match.params.value.replace(/-/g, '');
        let userName = this.props.user ? this.props.user : 'IUDX_User' + Math.floor(Math.random() * 100);
        this.state = {
            mySessionId: sessionName,
            myUserName: userName,
            session: undefined,
            localUser: undefined,
            subscribers: [],
            ipCamSubscribers: [],
            chatDisplay: 'none',
            modalOpen:false,
            serverModalOpen:false,
            localUserOn: false,
            groupDisplay: true,
        };

        this.joinSession = this.joinSession.bind(this);
        this.leaveSession = this.leaveSession.bind(this);
        this.onbeforeunload = this.onbeforeunload.bind(this);
        this.updateLayout = this.updateLayout.bind(this);
        this.camStatusChanged = this.camStatusChanged.bind(this);
        this.micStatusChanged = this.micStatusChanged.bind(this);
        this.nicknameChanged = this.nicknameChanged.bind(this);
        this.toggleFullscreen = this.toggleFullscreen.bind(this);
        this.screenShare = this.screenShare.bind(this);
        this.stopScreenShare = this.stopScreenShare.bind(this);
        this.closeDialogExtension = this.closeDialogExtension.bind(this);
        this.toggleChat = this.toggleChat.bind(this);
        this.checkNotification = this.checkNotification.bind(this);
        this.checkSize = this.checkSize.bind(this);
        this.showIPCameraDialog = this.showIPCameraDialog.bind(this);
        this.showIPCameraServerDialog = this.showIPCameraServerDialog.bind(this);	
        this.setClose = this.setClose.bind(this);
        this.setServerClose = this.setServerClose.bind(this);
        this.getIPToken = this.getIPToken.bind(this);
        this.removeCamera = this.removeCamera.bind(this);
        this.groupStatusChanged = this.groupStatusChanged.bind(this);
        this.leaveSessionPage = this.leaveSessionPage.bind(this);
    }

    componentDidMount() {
        const openViduLayoutOptions = {
            maxRatio: 3 / 2, // The narrowest ratio that will be used (default 2x3)
            minRatio: 9 / 16, // The widest ratio that will be used (default 16x9)
            fixedRatio: false, // If this is true then the aspect ratio of the video is maintained and minRatio and maxRatio are ignored (default false)
            bigClass: 'OV_big', // The class to add to elements that should be sized bigger
            bigPercentage: 0.8, // The maximum percentage of space the big ones should take up
            bigFixedRatio: false, // fixedRatio for the big ones
            bigMaxRatio: 3 / 2, // The narrowest ratio to use for the big elements (default 2x3)
            bigMinRatio: 9 / 16, // The widest ratio to use for the big elements (default 16x9)
            bigFirst: true, // Whether to place the big one in the top left (true) or bottom right
            animate: true, // Whether you want to animate the transitions
        };

        this.layout.initLayoutContainer(document.getElementById('layout'), openViduLayoutOptions);
        window.addEventListener('beforeunload', this.onbeforeunload);
        window.addEventListener('resize', this.updateLayout);
        window.addEventListener('resize', this.checkSize);
        this.joinSession();
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.onbeforeunload);
        window.removeEventListener('resize', this.updateLayout);
        window.removeEventListener('resize', this.checkSize);
        this.leaveSession();
    }

    onbeforeunload(event) {
        this.leaveSession();
    }

    joinSession() {
        this.OV = new OpenVidu();

        this.setState(
            {
                session: this.OV.initSession(),
            },
            () => {
                this.subscribeToStreamCreated();

                this.connectToSession();
            },
        );
    }

    connectToSession() {
        if (this.props.token !== undefined) {
            console.log('token received: ', this.props.token);
            this.connect(this.props.token);
        } else {
            this.getToken().then((token) => {
                console.log(token);
                this.connect(token);
            }).catch((error) => {
                if(this.props.error){
                    this.props.error({ error: error.error, messgae: error.message, code: error.code, status: error.status });
                }
                console.log('There was an error getting the token:', error.code, error.message);
                alert('There was an error getting the token:', error.message);
              });
        }
    }

    connect(token) {
        this.state.session
            .connect(
                token,
                { clientData: this.state.myUserName },
            )
            .then(() => {
                this.connectWebCam();
            })
            .catch((error) => {
                if(this.props.error){
                    this.props.error({ error: error.error, messgae: error.message, code: error.code, status: error.status });
                }
                alert('There was an error connecting to the session:', error.message);
                console.log('There was an error connecting to the session:', error.code, error.message);
            });
    }

    connectWebCam() {
        let publisher = this.OV.initPublisher(undefined, {
            audioSource: undefined,
            videoSource: undefined,
            publishAudio: localUser.isAudioActive(),
            publishVideo: localUser.isVideoActive(),
            resolution: '640x480',
            frameRate: 30,
            insertMode: 'APPEND',
        });

        if (this.state.session.capabilities.publish) {
            this.state.session.publish(publisher).then(() => {
                if (this.props.joinSession) {
                    this.props.joinSession();
                }
            });
        }
        localUser.setNickname(this.state.myUserName);
        localUser.setConnectionId(this.state.session.connection.connectionId);
        localUser.setScreenShareActive(false);
        localUser.setStreamManager(publisher);
        this.subscribeToUserChanged();
        this.subscribeToStreamDestroyed();
        this.sendSignalUserChanged({ isScreenShareActive: localUser.isScreenShareActive() });

        this.setState({ localUser: localUser }, () => {
            this.state.localUser.getStreamManager().on('streamPlaying', (e) => {
                this.updateLayout();
                publisher.videos[0].video.parentElement.classList.remove('custom-class');
            });
        });
    }

    leaveSession(e) {
        const mySession = this.state.session;

        if (mySession) {
            mySession.disconnect();
        }

        // Empty all properties...
        this.OV = null;
        this.setState({
            session: undefined,
            subscribers: [],
            ipCamSubscribers: [],
            mySessionId: 'SessionA',
            myUserName: 'IUDX_User' + Math.floor(Math.random() * 100),
            localUser: undefined,
            chatDisplay: 'none',
            modalOpen: false,
            serverModalOpen: false,
            localUserOn: false,
            groupDisplay: true,
        });
        localUser.setAudioActive(true);
        localUser.setVideoActive(false);
        localUser.setGroupActive(true);
        if (this.props.leaveSession) {
            this.props.leaveSession();
        }   
    }

    leaveSessionPage() {
        this.props.history.goBack();
    }

    camStatusChanged() {
        localUser.setVideoActive(!localUser.isVideoActive());
        localUser.getStreamManager().publishVideo(localUser.isVideoActive());
        this.sendSignalUserChanged({ isVideoActive: localUser.isVideoActive() });
        this.setState({ localUser: localUser });
        this.setState({ localUserOn: !this.state.localUserOn})
    }

    micStatusChanged() {
        localUser.setAudioActive(!localUser.isAudioActive());
        localUser.getStreamManager().publishAudio(localUser.isAudioActive());
        this.sendSignalUserChanged({ isAudioActive: localUser.isAudioActive() });
        this.setState({ localUser: localUser });
    }

    nicknameChanged(nickname) {
        let localUser = this.state.localUser;
        localUser.setNickname(nickname);
        this.setState({ localUser: localUser });
        this.sendSignalUserChanged({ nickname: this.state.localUser.getNickname() });
    }

    deleteSubscriber(stream) {
        if(stream.typeOfVideo === 'IPCAM') {
            const remoteCams = this.state.ipCamSubscribers;
            const camStream = remoteCams.filter((user) => user.getStreamManager().stream === stream)[0];
            let index = remoteCams.indexOf(camStream, 0);
            if (index > -1) {
                remoteCams.splice(index, 1);
                this.setState({
                    ipCamSubscribers: remoteCams,
                });
            }
        }
        else {
            const remoteUsers = this.state.subscribers;
            const userStream = remoteUsers.filter((user) => user.getStreamManager().stream === stream)[0];
            let index = remoteUsers.indexOf(userStream, 0);
            if (index > -1) {
                remoteUsers.splice(index, 1);
                this.setState({
                    subscribers: remoteUsers,
                });
            }
        }
    }

    subscribeToStreamCreated() {
        this.state.session.on('streamCreated', (event) => {
            const subscriber = this.state.session.subscribe(event.stream, undefined);
            
            if(event.stream.typeOfVideo === 'IPCAM') {
                var ipCamSubscribers = this.state.ipCamSubscribers;
                subscriber.on('streamPlaying', (e) => {
                    subscriber.videos[0].video.parentElement.classList.remove('custom-class');
                });
                const newCam = new IpCamModel();
                newCam.setStreamManager(subscriber);
                newCam.setConnectionId(event.stream.connection.connectionId);
                newCam.setType('ipcam');
                newCam.setNickname(event.stream.connection.data);
                ipCamSubscribers.push(newCam);
                this.setState(
                    {
                        ipCamSubscribers: ipCamSubscribers,
                    },
                    () => {
                        if (this.state.localUser) {
                            this.sendSignalUserChanged({
                                isAudioActive: this.state.localUser.isAudioActive(),
                                isVideoActive: this.state.localUser.isVideoActive(),
                                nickname: this.state.localUser.getNickname(),
                                isScreenShareActive: this.state.localUser.isScreenShareActive(),
                            });
                        }
                        this.updateLayout();
                    },
                );
            }
            else {
                var subscribers = this.state.subscribers;
                subscriber.on('streamPlaying', (e) => {
                    this.checkSomeoneShareScreen();
                    subscriber.videos[0].video.parentElement.classList.remove('custom-class');
                });
                const newUser = new UserModel();
                newUser.setStreamManager(subscriber);
                newUser.setConnectionId(event.stream.connection.connectionId);
                newUser.setType('remote');
                var nickname = event.stream.connection.data.split('%')[0];
                newUser.setNickname(JSON.parse(nickname).clientData);
                subscribers.push(newUser);
                this.setState(
                    {
                        subscribers: subscribers,
                    },
                    () => {
                        if (this.state.localUser) {
                            this.sendSignalUserChanged({
                                isAudioActive: this.state.localUser.isAudioActive(),
                                isVideoActive: this.state.localUser.isVideoActive(),
                                nickname: this.state.localUser.getNickname(),
                                isScreenShareActive: this.state.localUser.isScreenShareActive(),
                            });
                        }
                        this.updateLayout();
                    },
                );
            }
        });
    }

    subscribeToStreamDestroyed() {
        // On every Stream destroyed...
        this.state.session.on('streamDestroyed', (event) => {
            // Remove the stream from 'subscribers' array
            this.deleteSubscriber(event.stream);
            setTimeout(() => {
                this.checkSomeoneShareScreen();
            }, 20);
            event.preventDefault();
            this.updateLayout();
        });
    }

    subscribeToUserChanged() {
        this.state.session.on('signal:userChanged', (event) => {
            let remoteUsers = this.state.subscribers;
            remoteUsers.forEach((user) => {
                if (user.getConnectionId() === event.from.connectionId) {
                    const data = JSON.parse(event.data);
                    console.log('EVENTO REMOTE: ', event.data);
                    if (data.isAudioActive !== undefined) {
                        user.setAudioActive(data.isAudioActive);
                    }
                    if (data.isVideoActive !== undefined) {
                        user.setVideoActive(data.isVideoActive);
                    }
                    if (data.nickname !== undefined) {
                        user.setNickname(data.nickname);
                    }
                    if (data.isScreenShareActive !== undefined) {
                        user.setScreenShareActive(data.isScreenShareActive);
                    }
                }
            });
            this.setState(
                {
                    subscribers: remoteUsers,
                },
                () => this.checkSomeoneShareScreen(),
            );
        });
    }

    updateLayout() {
        setTimeout(() => {
            this.layout.updateLayout();
        }, 20);
    }

    sendSignalUserChanged(data) {
        const signalOptions = {
            data: JSON.stringify(data),
            type: 'userChanged',
        };
        this.state.session.signal(signalOptions);
    }

    toggleFullscreen() {
        const document = window.document;
        const fs = document.getElementById('container');
        if (
            !document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement
        ) {
            if (fs.requestFullscreen) {
                fs.requestFullscreen();
            } else if (fs.msRequestFullscreen) {
                fs.msRequestFullscreen();
            } else if (fs.mozRequestFullScreen) {
                fs.mozRequestFullScreen();
            } else if (fs.webkitRequestFullscreen) {
                fs.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    screenShare() {
        const videoSource = navigator.userAgent.indexOf('Firefox') !== -1 ? 'window' : 'screen';
        const publisher = this.OV.initPublisher(
            undefined,
            {
                videoSource: videoSource,
                publishAudio: localUser.isAudioActive(),
                publishVideo: localUser.isVideoActive(),
                mirror: false,
            },
            (error) => {
                if (error && error.name === 'SCREEN_EXTENSION_NOT_INSTALLED') {
                    this.setState({ showExtensionDialog: true });
                } else if (error && error.name === 'SCREEN_SHARING_NOT_SUPPORTED') {
                    alert('Your browser does not support screen sharing');
                } else if (error && error.name === 'SCREEN_EXTENSION_DISABLED') {
                    alert('You need to enable screen sharing extension');
                } else if (error && error.name === 'SCREEN_CAPTURE_DENIED') {
                    alert('You need to choose a window or application to share');
                }
            },
        );

        publisher.once('accessAllowed', () => {
            this.state.session.unpublish(localUser.getStreamManager());
            localUser.setStreamManager(publisher);
            this.state.session.publish(localUser.getStreamManager()).then(() => {
                localUser.setScreenShareActive(true);
                this.setState({ localUser: localUser }, () => {
                    this.sendSignalUserChanged({ isScreenShareActive: localUser.isScreenShareActive() });
                });
            });
        });
        publisher.on('streamPlaying', () => {
            this.updateLayout();
            publisher.videos[0].video.parentElement.classList.remove('custom-class');
        });
    }

    closeDialogExtension() {
        this.setState({ showExtensionDialog: false });
    }

    stopScreenShare() {
        this.state.session.unpublish(localUser.getStreamManager());
        this.connectWebCam();
    }

    groupStatusChanged() {
        localUser.setGroupActive(!this.state.groupDisplay);
        this.sendSignalUserChanged({ isGroupActive: localUser.isGroupActive() });
        this.setState({ groupDisplay: !this.state.groupDisplay });
    }

    checkSomeoneShareScreen() {
        let isScreenShared;
        // return true if at least one passes the test
        isScreenShared = this.state.subscribers.some((user) => user.isScreenShareActive()) || localUser.isScreenShareActive();
        const openviduLayoutOptions = {
            maxRatio: 3 / 2,
            minRatio: 9 / 16,
            fixedRatio: isScreenShared,
            bigClass: 'OV_big',
            bigPercentage: 0.8,
            bigFixedRatio: false,
            bigMaxRatio: 3 / 2,
            bigMinRatio: 9 / 16,
            bigFirst: true,
            animate: true,
        };
        this.layout.setLayoutOptions(openviduLayoutOptions);
        this.updateLayout();
    }

    toggleChat(property) {
        let display = property;

        if (display === undefined) {
            display = this.state.chatDisplay === 'none' ? 'block' : 'none';
        }
        if (display === 'block') {
            this.setState({ chatDisplay: display, messageReceived: false });
        } else {
            this.setState({ chatDisplay: display });
        }
        this.updateLayout();
    }

    checkNotification(event) {
        this.setState({
            messageReceived: this.state.chatDisplay === 'none',
        });
    }

    checkSize() {
        if (document.getElementById('layout').offsetWidth <= 700 && !this.hasBeenUpdated) {
            this.toggleChat('none');
            this.hasBeenUpdated = true;
        }
        if (document.getElementById('layout').offsetWidth > 700 && this.hasBeenUpdated) {
            this.hasBeenUpdated = false;
        }
    }

    showIPCameraDialog(){
        if(this.state.serverModalOpen) {
            this.setServerClose();
        }
        this.setState({modalOpen:!this.state.modalOpen});
    }
       
    showIPCameraServerDialog(){
        if(this.state.modalOpen) {
            this.showIPCameraDialog();
        }
        this.setState({serverModalOpen:!this.state.serverModalOpen});
    }

    setClose(){
        this.setState({modalOpen:!this.state.modalOpen});
    }

    setServerClose(){
        this.setState({serverModalOpen:!this.state.serverModalOpen});
    }

    render() {
        const mySessionId = this.state.mySessionId;
        const localUser = this.state.localUser;
        var chatDisplay = { display: this.state.chatDisplay };

        return (
            <div className="container" id="container">
                <ToolbarComponent
                    sessionId={mySessionId}
                    user={localUser}
                    showNotification={this.state.messageReceived}
                    camStatusChanged={this.camStatusChanged}
                    micStatusChanged={this.micStatusChanged}
                    groupStatusChanged={this.groupStatusChanged}
                    screenShare={this.screenShare}
                    stopScreenShare={this.stopScreenShare}
                    toggleFullscreen={this.toggleFullscreen}
                    leaveSessionPage={this.leaveSessionPage}
                    toggleChat={this.toggleChat}
                    showIPCameraDialog= {this.showIPCameraDialog}
                    showIPCameraServerDialog={this.showIPCameraServerDialog}
                />

                <DialogExtensionComponent showDialog={this.state.showExtensionDialog} cancelClicked={this.closeDialogExtension} />
                <IpCameraComponent open={this.state.modalOpen} setClose={this.setClose} getToken={this.getIPToken} removeCam={this.removeCamera}/>
                <IpcamServerComponent open={this.state.serverModalOpen} setClose={this.setServerClose} getToken={this.getIPToken} removeCam={this.removeCamera}/>


                <div id="layout" className="bounds">
                    {this.state.localUserOn && localUser !== undefined && localUser.getStreamManager() !== undefined && (
                        localUser.isScreenShareActive() ? (
                            <div id="screenshare">
                                <ul>
                                    <li><img alt="Screen Sharing" src={screen_share} /></li>
                                    <li><h1>You're presenting to everyone</h1></li>
                                </ul>
                            </div>
                        ) : (
                            <div className="OT_root OT_publisher custom-class" id="localUser">
                                <StreamComponent user={localUser} handleNickname={this.nicknameChanged} />
                            </div>
                        )
                    )}
                    {this.state.groupDisplay && this.state.subscribers.map((sub, i) => (
                        <div key={i} className="OT_root OT_publisher custom-class" id="remoteUsers">
                            <StreamComponent user={sub} streamId={sub.streamManager.stream.streamId} />
                        </div>
                    ))}
                    {this.state.ipCamSubscribers.map((sub, i) => (	
                        <div key={i} className="OT_root OT_publisher custom-class" id="remoteCam">
                            <StreamComponent user={sub} streamId={sub.streamManager.stream.streamId} />
                        </div>	
                    ))}
                    {localUser !== undefined && localUser.getStreamManager() !== undefined && (
                        <div className="OT_root OT_publisher custom-class" style={chatDisplay}>
                            <ChatComponent
                                user={localUser}
                                chatDisplay={this.state.chatDisplay}
                                close={this.toggleChat}
                                messageReceived={this.checkNotification}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /**
     * --------------------------
     * SERVER-SIDE RESPONSIBILITY
     * --------------------------
     * These methods retrieve the mandatory user token from OpenVidu Server.
     * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
     * the API REST, openvidu-java-client or openvidu-node-client):
     *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
     *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
     *   3) The token must be consumed in Session.connect() method
     */
    
    getIPToken(cameras, isIpcam) {

        const sendData = {
            session: this.state.mySessionId,
            cameras: cameras,
            isIpcam: isIpcam
        };
        const headers = {
            'Content-Type': 'application/json'
        };
        axios
            .post('/ipcam', sendData, { headers })
            .then((response) => {
                console.log('connection success!');
            })
            .catch((error) => console.log(error))
    }

    removeCamera(camName) {

        const sendData = { 
            session: this.state.mySessionId,
            camera : camName 
        };
        const headers = {
            'Content-Type': 'application/json'
        };
        axios
            .post('/deleteipcam', sendData, { headers })
            .then((response) => {
                console.log('Disconnection success!');
            })
            .catch((error) => console.log(error))
    }

    getToken() {
        return this.createSession(this.state.mySessionId).then((sessionId) => this.createToken(sessionId));
    }

    createSession(sessionId) {
        return new Promise((resolve, reject) => {
            var data = JSON.stringify({ customSessionId: sessionId });
            axios
                .post(this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions', data, {
                    headers: {
                        Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => {
                    console.log('CREATE SESION', response);
                    resolve(response.data.id);
                })
                .catch((response) => {
                    var error = Object.assign({}, response);
                    if (error.response && error.response.status === 409) {
                        resolve(sessionId);
                    } else {
                        console.log(error);
                        console.warn(
                            'No connection to OpenVidu Server. This may be a certificate error at ' + this.OPENVIDU_SERVER_URL,
                        );
                        if (
                            window.confirm(
                                'No connection to OpenVidu Server. This may be a certificate error at "' +
                                    this.OPENVIDU_SERVER_URL +
                                    '"\n\nClick OK to navigate and accept it. ' +
                                    'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                                    this.OPENVIDU_SERVER_URL +
                                    '"',
                            )
                        ) {
                            window.location.assign(this.OPENVIDU_SERVER_URL + '/accept-certificate');
                        }
                    }
                });
        });
    }

    createToken(sessionId) {
        return new Promise((resolve, reject) => {
            var data = JSON.stringify({});
            axios
                .post(this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions/' + sessionId + '/connection', data, {
                    headers: {
                        Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => {
                    console.log('TOKEN', response);
                    resolve(response.data.token);
                })
                .catch((error) => reject(error));
        });
    }
}
