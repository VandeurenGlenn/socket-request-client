import LittlePubSub from "@vandeurenglenn/little-pubsub";
declare class Api {
    _pubsub: any;
    constructor(_pubsub: LittlePubSub);
    subscribe(topic: any, cb: any): void;
    unsubscribe(topic: any, cb: any): void;
    publish(topic: any, value: any): void;
    subscribers(): void;
    connectionState(state: any): "connecting" | "open" | "closing" | "closed";
    /**
     * @param {string} type
     * @param {string} name
     * @param {object} params
     */
    request(client: any, request: any): Promise<{
        result: any;
        id: any;
        handler: any;
    }>;
    send(client: any, request: any): Promise<any>;
    pubsub(client: any): {
        publish: (topic: string, value: any) => Promise<any>;
        subscribe: (topic: string, cb: any) => Promise<any>;
        unsubscribe: (topic: string, cb: any) => Promise<any>;
        subscribers: any;
    };
    server(client: any): {
        uptime: () => Promise<any>;
        ping: () => Promise<number>;
    };
    peernet(client: any): {
        join: (params: any) => Promise<any>;
        leave: (params: any) => Promise<any>;
    };
}
export { Api as default };
