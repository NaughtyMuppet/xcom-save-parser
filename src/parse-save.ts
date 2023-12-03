import { COMPRESSED_DATA_OFFSET, PropertyKind } from './constants';
import { DataHandler } from './utils/data-handler';
import assert from 'node:assert';
import { Property } from './types';
import { determineArrayPropertyKind } from './utils/determine-array-property-kind';
import { decompress } from './utils/decompress';

export const getSaveInfo = (data: Buffer) => {
    const gameInfo = getGameInfo(data);

    const parsedData = decompress(data);
    const uncompressedHandler = new DataHandler(parsedData);
    const actorTable = readActorTable(uncompressedHandler);
    const checkpoints = readCheckpoints(uncompressedHandler);

    const magicNumberLocation = uncompressedHandler.findNextSequence(Buffer.from([0xc1, 0x83, 0x2a, 0x9e]));
    let strategyLayerInfo: any;
    if (magicNumberLocation !== -1) {
        // Tactical layer save have a lot of data that we can't parse. I did discover that way at the end there's some extra data
        // that needs more decompressing.
        uncompressedHandler.seekAbsolute(magicNumberLocation - COMPRESSED_DATA_OFFSET);
        const doubleDecompressed = new DataHandler(decompress(uncompressedHandler.readRestOfBuffer()));
        doubleDecompressed.seek(126 + 36);
        strategyLayerInfo = readProperties(doubleDecompressed);
    }

    return { gameInfo, actorTable, checkpoints, strategyLayerInfo };
};

const getGameInfo = (data: Buffer) => {
    const header = new DataHandler(data.subarray(0, COMPRESSED_DATA_OFFSET));
    header.seek(4 * 4); // int32, byte[4], int32
    const gameInfoRaw = header.readUnicodeString();
    const gameInfo = parseGameInfo(gameInfoRaw);
    const date = header.readUnicodeString();
    const mapInfoRaw = header.readUnicodeString();
    const mapInfo = parseMapInfo(mapInfoRaw);
    header.seek(4 * 3);
    const dlcInfo = header.readUnicodeString();
    const language = header.readUnicodeString();
    return {
        gameInfo,
        gameInfoRaw,
        date,
        mapInfo,
        mapInfoRaw,
        dlcInfo,
        language
    };
};

const parseGameInfo = (gameInfo: string) => {
    // 12/2/2023 - 15:42 - IRONMAN: Game 5 - Geoscape - 5:32 am   March 1 2015
    // 12/2/2023 - 16:03 - IRONMAN: Game 5 - Operation Blinding Shroud (Gateway) - Lille, France 5:21 am
    // 8/29/2015 - 11:05 - Game 2 - Geoscape - 6:17 am   July 21 2016
    // 11/30/2023 - 18:47 - Game 3 - Operation Blinding Shroud (Gateway) - Chihuahua, Mexico 12:12 am
    // "12/2/2023 - 16:14 - IRONMAN: Game 5 - Operation Red Palace (UFO Crash Site) - Germany 5:35 am"
    const [date, time, gameName, operation, locationInfo] = gameInfo.split(' - ');
    const isIronman = gameName.includes('IRONMAN');
    const gameNumber = Number.parseInt(gameName.replace('IRONMAN: ', '').replace('Game ', ''), 10);
    const [operationName, operationType] = operation.split(' (');
    const gameTime = locationInfo.match(/(\d+):(\d+) (am|pm)/)?.[0];
    const gameDate = locationInfo.match(/(\w+) (\d+) (\d+)$/)?.[0];
    const [city, rest] = locationInfo.split(',');
    const country = rest
        ?.trim()
        .match(/[ A-Za-z]+/)?.[0]
        .trim();

    return {
        date,
        time,
        city: rest ? city : undefined,
        country: country || undefined,
        gameName,
        isIronman,
        gameNumber,
        operationName,
        operationType: operationType?.replace(')', ''),
        gameTime,
        gameDate
    };
};

const parseMapInfo = (mapInfo: string) => {
    // open CSmallScout_DirtRoad?game=XComGame.XComTacticalGame?LoadingFromStrategy=1?Meld=1?StreamingMap0=CIN_DropshipIntros?StreamingMap1=CSmallScout_DirtRoad_Tutorial?LoadingSave
    // open Command1?game=XComStrategyGame.XComHeadQuartersGame
    const [mapName, ...rest] = mapInfo.split('?');
    return {
        mapName: mapName.replace('open ', ''),
        ...Object.fromEntries(rest.map((x) => x.split('=')))
    };
};

const readActorTable = (handler: DataHandler) => {
    const actorTable: any[] = [];
    const actorCount = handler.readUInt32();
    const entriesPerActor = 2;
    for (let iteration = 0; iteration < actorCount; iteration += entriesPerActor) {
        const actor = handler.readUnicodeString();
        const instanceNumber = handler.readUInt32();
        const packageName = handler.readUnicodeString();
        const sentinel = handler.readUInt32();
        if (sentinel !== 0) {
            throw new Error(`Sentinel mismatch at offset ${handler.position}`);
        }
        const name = `${packageName}.${actor}_${instanceNumber}`;
        actorTable.push(name);
    }
    return actorTable;
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

const readCheckpoints = (handler: DataHandler) => {
    const checkpoints: Checkpoint[] = [];
    try {
        while (!handler.eof) {
            handler.readUInt32();
            const gameType = handler.readUnicodeString();
            const none = handler.readUnicodeString();
            if (none !== 'None') {
                throw new Error(
                    `None mismatch for ${gameType} at offset ${handler.position} iteration ${checkpoints.length + 1}`
                );
            }
            handler.seek(4);
            const checkpoint = readCheckpointTable(handler);
            const nameTableLength = handler.readUInt32();
            let nameTable = [];
            if (nameTableLength > 0) {
                nameTable = readNameTable(handler);
            }
            const className = handler.readUnicodeString();
            const actors = readActorTable(handler);
            handler.readUInt32();
            const actorTemplates = readActorTemplateTable(handler);
            const displayName = handler.readUnicodeString();
            const mapName = handler.readUnicodeString();
            handler.readUInt32();
            checkpoints.push({
                gameType,
                checkpoint,
                nameTable,
                className,
                actors,
                actorTemplates,
                displayName,
                mapName
            });
        }
    } catch (error) {
        console.log('Failed getting more checkpoints after iteration', checkpoints.length, error);
    }
    return checkpoints;
};

const readActorTemplateTable = (handler: DataHandler) => {
    const templateCount = handler.readUInt32();
    const templates: any[] = [];
    for (let i = 0; i < templateCount; i++) {
        const classPath = handler.readUnicodeString();
        const rawBytes = handler.readSubarray(64);
        const archetypePath = handler.readUnicodeString();
        templates.push({ classPath, rawBytes, archetypePath });
    }
    return templates;
};

const readNameTable = (handler: DataHandler) => {
    const nameCount = handler.readUInt32();
    const names: any[] = [];
    for (let i = 0; i < nameCount; i++) {
        const name = handler.readUnicodeString();
        const zeros = handler.readSubarray(8);
        if (zeros.some((x) => x !== 0)) {
            throw new Error(`Zero mismatch at offset ${handler.position}`);
        }
        const dataLength = handler.readUInt32();
        const data = handler.readSubarray(dataLength);
        names.push({ name, data });
    }
    return names;
};

const readCheckpointTable = (handler: DataHandler) => {
    const checkpointCount = handler.readUInt32();
    const checkpoints: any[] = [];
    for (let i = 0; i < checkpointCount; i++) {
        const name = handler.readUnicodeString();
        const instanceName = handler.readUnicodeString();
        const vector = [handler.readFloat(), handler.readFloat(), handler.readFloat()];
        const rotator = [handler.readInt32(), handler.readInt32(), handler.readInt32()];
        const className = handler.readUnicodeString();
        const propertyLength = handler.readUInt32();
        if (propertyLength < 0) {
            throw new Error(`Negative prop length at offset ${handler.position}`);
        }
        let padSize = 0;
        const startOffset = handler.position;
        const properties = readProperties(handler);
        if (handler.position - startOffset < propertyLength) {
            padSize = propertyLength - (handler.position - startOffset);
            for (let j = 0; j < padSize; j++) {
                const byte = handler.readByte();
                if (byte !== 0) {
                    throw new Error(`Padding mismatch at offset ${handler.position}`);
                }
            }
        }
        handler.readUInt32();
        checkpoints.push({
            name,
            instanceName,
            vector,
            rotator,
            className,
            propLength: propertyLength,
            padSize,
            startOffset,
            properties
        });
    }
    return checkpoints;
};

const readProperties = (handler: DataHandler) => {
    const properties: Property.AnyProperty[] = [];
    while (true) {
        const name = handler.readUnicodeString();
        const nonZero = handler.readInt32();
        if (nonZero !== 0) {
            throw new Error(`Non-zero mismatch for property ${name} at offset ${handler.position}`);
        }
        if (name === 'None') {
            break;
        }
        const propertyType = handler.readUnicodeString();
        const nonZero2 = handler.readInt32();
        if (nonZero2 !== 0) {
            throw new Error(`Non-zero mismatch for property ${name} ${propertyType} at offset ${handler.position}`);
        }
        const propertySize = handler.readUInt32();
        const arrayIndex = handler.readUInt32();
        let property: null | Property.AnyProperty = null;
        switch (propertyType) {
            case 'IntProperty': {
                assert(propertySize === 4);
                const value = handler.readUInt32();
                property = {
                    name,
                    size: 4,
                    value,
                    kind: PropertyKind.IntProperty
                };
                break;
            }
            case 'FloatProperty': {
                const value = handler.readFloat();
                property = {
                    name,
                    size: 4,
                    value,
                    kind: PropertyKind.FloatProperty
                };
                break;
            }
            case 'ObjectProperty': {
                assert(propertySize === 8);
                const actor1 = handler.readUInt32();
                const actor2 = handler.readUInt32();
                if (actor1 !== -1 && actor1 !== actor2 + 1) {
                    // throw new Error(`Actor references unrelated ${handler.position}`);
                }
                property = {
                    name,
                    size: 8,
                    kind: PropertyKind.ObjectProperty,
                    value: actor1 === -1 ? actor1 : actor1 // / 2
                };
                break;
            }
            case 'BoolProperty': {
                assert(propertySize === 0);
                const value = handler.readByte();
                property = {
                    name,
                    size: 0,
                    value: value !== 0,
                    kind: PropertyKind.BoolProperty
                };
                break;
            }
            case 'ByteProperty': {
                const enumType = handler.readUnicodeString();
                const nonZero3 = handler.readInt32();
                if (nonZero3 !== 0) {
                    throw new Error(`Non-zero mismatch at offset ${handler.position}`);
                }
                if (enumType === 'None') {
                    const char = handler.readByte();
                    property = {
                        name,
                        size: 1,
                        value: { name: 'None', value: char },
                        kind: PropertyKind.EnumProperty
                    };
                } else {
                    const value = handler.readUnicodeString();
                    property = {
                        name,
                        size: propertySize,
                        value: { name: value, value: handler.readUInt32() },
                        kind: PropertyKind.EnumProperty
                    };
                }
                break;
            }
            case 'StrProperty': {
                const value = handler.readUnicodeString();
                property = {
                    name,
                    size: value.length > 0 ? value.length + 1 + 4 : 4,
                    value,
                    kind: PropertyKind.StringProperty
                };
                break;
            }
            case 'NameProperty': {
                const string = handler.readUnicodeString();
                const number = handler.readUInt32();
                property = {
                    name,
                    size: string.length + 1 + 4 + 4,
                    value: { string, number },
                    kind: PropertyKind.NameProperty
                };
                break;
            }
            case 'ArrayProperty': {
                const arrayBound = handler.readUInt32();
                const arrayDataSize = propertySize - 4;
                if (arrayDataSize > 0) {
                    if (arrayBound * 8 === arrayDataSize) {
                        // array of actors
                        const elements = [];
                        for (let index = 0; index < arrayBound; index++) {
                            const actor1 = handler.readUInt32();
                            const actor2 = handler.readUInt32();
                            if (actor1 === -1 && actor2 === -1) {
                                elements.push(actor1);
                            } else if (actor1 === actor2 + 1) {
                                elements.push(actor1 === -1 ? actor1 : actor1 /* / 2 */);
                            } else {
                                // console.info(`Actor references unrelated ${actor1}:${actor2} at ${handler.position}`);
                            }
                        }
                        property = {
                            name,
                            size: propertySize,
                            kind: PropertyKind.ObjectArrayProperty,
                            value: elements
                        };
                    } else if (arrayBound * 4 === arrayDataSize) {
                        // array of ints
                        const elements = [] as number[];
                        for (let index = 0; index < arrayBound; index++) {
                            elements.push(handler.readUInt32());
                        }
                        property = {
                            name,
                            size: elements.length * 4 + 4,
                            kind: PropertyKind.NumberArrayProperty,
                            value: elements
                        };
                    } else {
                        const position = handler.position;
                        const arrayType = determineArrayPropertyKind(handler);
                        if (position !== handler.position) {
                            throw new Error('Position was moved by determineArrayPropertyKind');
                        }

                        switch (arrayType) {
                            case PropertyKind.StructArrayProperty: {
                                const elements = [] as any[];
                                for (let index = 0; index < arrayBound; index++) {
                                    elements.push(readProperties(handler));
                                }
                                property = {
                                    name,
                                    size: arrayDataSize + 4,
                                    kind: PropertyKind.StructArrayProperty,
                                    value: elements
                                };
                                break;
                            }
                            case PropertyKind.StringArrayProperty: {
                                const elements = [] as string[];
                                for (let index = 0; index < arrayBound; index++) {
                                    elements.push(handler.readUnicodeString());
                                }
                                property = {
                                    name,
                                    size: arrayDataSize + 4,
                                    kind: PropertyKind.StringArrayProperty,
                                    value: elements
                                };
                                break;
                            }
                            case PropertyKind.LastProperty: {
                                property = {
                                    name,
                                    size: propertySize,
                                    kind: PropertyKind.LastProperty,
                                    value: handler.readSubarray(arrayDataSize).toJSON() as any
                                };

                                break;
                            }
                            case PropertyKind.EnumArrayProperty: {
                                const elements = [] as { name: string; value: number }[];
                                for (let i = 0; i < arrayBound; i++) {
                                    elements.push({
                                        name: handler.readUnicodeString(),
                                        value: handler.readUInt32()
                                    });
                                }
                                property = {
                                    name,
                                    size: propertySize,
                                    kind: PropertyKind.EnumArrayProperty,
                                    value: elements
                                };
                                break;
                            }
                            default: {
                                throw new Error(`Unknown array type ${arrayType} at offset ${handler.position}`);
                            }
                        }
                    }
                } else {
                    property = {
                        name,
                        size: 4,
                        kind: PropertyKind.ObjectArrayProperty,
                        value: []
                    };
                }
                break;
            }
            case 'StructProperty': {
                const structName = handler.readUnicodeString();
                const nonZero3 = handler.readUInt32();
                if (nonZero3 !== 0) {
                    throw new Error(`Non-zero mismatch at offset ${handler.position}`);
                }
                const structNameToSize: Record<string, number> = {
                    Vector: 12,
                    Rotator: 12,
                    Box: 25,
                    Color: 4,
                    Vector2D: 8
                };
                property =
                    structName in structNameToSize
                        ? {
                              name,
                              structName: structName,
                              size: structNameToSize[structName],
                              kind: PropertyKind.StructProperty,
                              value: handler.readSubarray(structNameToSize[structName]).toJSON() as any
                          }
                        : {
                              name,
                              structName: structName,
                              size: propertySize,
                              kind: PropertyKind.StructProperty,
                              value: handler.readSubarray(propertySize).toJSON() as any
                          };
                break;
            }
            default: {
                throw new Error(`Unknown property type ${propertyType} at offset ${handler.position}`);
            }
        }
        if (property) {
            assert(
                propertySize === property.size,
                `Property ${propertyType} ${name} size mismatch ${propertySize} !== ${property.size}`
            );
            if (arrayIndex === 0) {
                properties.push(property);
            } else {
                if (properties.at(-1)?.name !== name) {
                    throw new Error(`Array does not match previous property ${handler.position}`);
                }
                if (properties.at(-1)?.kind === PropertyKind.StaticArrayProperty) {
                    const array = properties.pop() as Property.StaticArrayProperty;
                    properties.push({
                        name,
                        size: array.size,
                        kind: PropertyKind.StaticArrayProperty,
                        value: array.value
                    });
                } else {
                    assert(arrayIndex === 1);
                    const lastProperty = properties.pop();
                    properties.push({
                        name,
                        size: lastProperty?.size ?? 0,
                        kind: PropertyKind.StaticArrayProperty,
                        value: [(lastProperty as Property.ObjectProperty).value, property.value]
                    });
                }
            }
        } else {
            console.error(`Property ${propertyType} is null at offset ${handler.position}`);
        }
    }
    return properties;
};
