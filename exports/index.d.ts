import Api from './api.js';
import ClientConnection from './connection.js';
declare type socketRequestMessage = {
    data: ArrayBuffer | Uint8Array;
};
interface socketRequestClientInterface {
    api: Api;
    constructor(url: string, protocol?: string, options?: {
        retry: true;
        timeout: 10000;
        times: 10;
    }): Promise<ClientConnection>;
    onmessage(message: socketRequestMessage): void;
}
declare class SocketRequestClient implements socketRequestClientInterface {
    #private;
    api: Api;
    clientConnection: ClientConnection;
    ['constructor'](url: string, protocol?: string, options?: {
        retry: boolean;
        timeout: number;
        times: number;
    }): Promise<ClientConnection>;
    init(): Promise<ClientConnection>;
    onerror: (error: any) => void;
    onmessage(message: any): void;
}
export { SocketRequestClient as default };
