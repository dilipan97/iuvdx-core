class UserModel {
    connectionId;
    audioActive;
    videoActive;
    screenShareActive;
    nickname;
    streamManager;
    type; // 'remote' | 'local'
    groupActive;

    constructor() {
        this.connectionId = '';
        this.audioActive = true;
        this.videoActive = false;
        this.screenShareActive = false;
        this.nickname = '';
        this.streamManager = null;
        this.type = 'local';
        this.groupActive = true;
    }

    isAudioActive() {
        return this.audioActive;
    }

    isVideoActive() {
        return this.videoActive;
    }

    isScreenShareActive() {
        return this.screenShareActive;
    }

    getConnectionId() {
        return this.connectionId;
    }

    getNickname() {
        return this.nickname;
    }

    getStreamManager() {
        return this.streamManager;
    }

    isLocal() {
        return this.type === 'local';
    }

    isRemote() {
        return !this.isLocal();
    }

    isGroupActive() {
        return this.groupActive;
    }

    setAudioActive(isAudioActive) {
        this.audioActive = isAudioActive;
    }

    setVideoActive(isVideoActive) {
        this.videoActive = isVideoActive;
    }

    setScreenShareActive(isScreenShareActive) {
        this.screenShareActive = isScreenShareActive;
    }

    setStreamManager(streamManager) {
        this.streamManager = streamManager;
    }

    setConnectionId(conecctionId) {
        this.connectionId = conecctionId;
    }

    setNickname(nickname) {
        this.nickname = nickname;
    }

    setGroupActive(groupActive) {
        this.groupActive = groupActive;
    }

    setType(type) {
        if (type === 'local' |  type === 'remote') {
            this.type = type;
        }
    }
}

export default UserModel;
