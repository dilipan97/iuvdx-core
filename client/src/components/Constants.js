const prod = {
    OPENVIDU_SERVER_URL: 'https://' + window.location.hostname,
    OPENVIDU_SERVER_SECRET: 'MY_SECRET',
};
const dev = {
    OPENVIDU_SERVER_URL: 'https://' + window.location.hostname + ':4443',
    OPENVIDU_SERVER_SECRET: 'MY_SECRET',
};
export const config = process.env.NODE_ENV === 'development' ? dev : prod;