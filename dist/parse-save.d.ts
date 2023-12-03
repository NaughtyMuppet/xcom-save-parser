/// <reference types="node" />
export declare const getSaveInfo: (data: Buffer) => {
    gameInfo: {
        gameInfo: {
            date: string;
            time: string;
            city: string | undefined;
            country: string | undefined;
            gameName: string;
            isIronman: boolean;
            gameNumber: number;
            operationName: string;
            operationType: string;
            gameTime: string | undefined;
            gameDate: string | undefined;
        };
        gameInfoRaw: string;
        date: string;
        mapInfo: any;
        mapInfoRaw: string;
        dlcInfo: string;
        language: string;
    };
    actorTable: any[];
    checkpoints: Checkpoint[];
    strategyLayerInfo: any;
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
