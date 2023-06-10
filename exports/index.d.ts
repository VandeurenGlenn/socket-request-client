import Api from './api.js';
import ClientConnection from './connection.js';
declare type socketRequestMessage = {
    data: ArrayBuffer | Uint8Array;
};
declare class SocketRequestClient {
    #private;
    api: Api;
    clientConnection: ClientConnection;
    constructor(url: string, protocol?: string, options?: {
        retry: boolean;
        timeout: number;
        times: number;
    });
    init(): Promise<ClientConnection>;
    onerror: (error: any) => void;
    onmessage(message: socketRequestMessage): void;
}
export { SocketRequestClient };
