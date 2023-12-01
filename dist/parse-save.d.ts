/// <reference types="node" />
export declare const getSaveInfo: (data: Buffer) => {
    gameInfo: {
        gameInfo: string;
        date: string;
        mapInfo: string;
        dlcInfo: string;
        language: string;
    };
    actorTable: any[];
    checkpoints: Checkpoint[];
};
interface Checkpoint {
    gameType: string;
    checkpoint: any;
    nameTable: any[];
    className: string;
    actors: any[];
    actorTemplates: any[];
    displayName: string;
    mapName: string;
}
export {};
