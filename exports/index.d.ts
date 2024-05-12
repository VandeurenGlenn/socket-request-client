import Api from './api.js';
import ClientConnection from './connection.js';
declare class SocketRequestClient {
    #private;
    api: Api;
    clientConnection: ClientConnection;
    constructor(url: string, protocol?: string, options?: {
        retry: boolean;
        timeout: number;
        times: number;
        experimentalWebsocket?: boolean;
    });
    init(): Promise<ClientConnection>;
    onerror: (error: any) => void;
    onmessage(message: any): void;
}
export { SocketRequestClient };
