import Api from './api.js';
import { SocketRequest } from './api.js';
declare class ClientConnection {
    #private;
    client: WebSocket;
    api: Api;
    constructor(client: WebSocket, api: Api);
    request: (req: SocketRequest) => Promise<any>;
    send: (req: SocketRequest) => Promise<any>;
    get subscribe(): (topic: any, cb: any) => void;
    get unsubscribe(): (topic: any, cb: any) => void;
    get subscribers(): () => void;
    get publish(): (topic: any, value: any) => void;
    get pubsub(): {
        publish: (topic: string, value: any) => Promise<any>;
        subscribe: (topic: string, cb: any) => Promise<any>;
        unsubscribe: (topic: string, cb: any) => Promise<any>;
        subscribers: any;
    };
    uptime: () => number;
    get peernet(): {
        join: (params: any) => Promise<any>;
        leave: (params: any) => Promise<any>;
    };
    get server(): {
        uptime: () => Promise<any>;
        ping: () => Promise<number>;
    };
    connectionState: () => "connecting" | "open" | "closing" | "closed";
    close: (exit: any) => void;
}
export { ClientConnection as default };
