class IpCamModel {
    connectionId;
    audioActive;
    videoActive;
    nickname;
    streamManager;
    type;

    constructor() {
        this.connectionId = '';
        this.audioActive = true;
        this.videoActive = true;
        this.nickname = '';
        this.streamManager = null;
        this.type = 'ipcam';
    }

    isAudioActive() {
        return this.audioActive;
    }

    isVideoActive() {
        return this.videoActive;
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

    setAudioActive(isAudioActive) {
        this.audioActive = isAudioActive;
    }

    setVideoActive(isVideoActive) {
        this.videoActive = isVideoActive;
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

    setType(type) {
        if (type === 'ipcam') {
            this.type = type;
        }
    }
}

export default IpCamModel;
