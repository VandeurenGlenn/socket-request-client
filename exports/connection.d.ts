import Api from './api.js';
declare class ClientConnection {
    constructor(client: WebSocket, api: Api);
}
export { ClientConnection as default };
