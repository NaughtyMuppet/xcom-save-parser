"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSaveInfo = void 0;
const constants_1 = require("./constants");
const data_handler_1 = require("./utils/data-handler");
const node_assert_1 = __importDefault(require("node:assert"));
const determine_array_property_kind_1 = require("./utils/determine-array-property-kind");
const decompress_1 = require("./utils/decompress");
const getSaveInfo = (data) => {
    const gameInfo = getGameInfo(data);
    const parsedData = (0, decompress_1.decompress)(data);
    const uncompressedHandler = new data_handler_1.DataHandler(parsedData);
    const actorTable = readActorTable(uncompressedHandler);
    const checkpoints = readCheckpoints(uncompressedHandler);
    return { gameInfo, actorTable, checkpoints };
};
exports.getSaveInfo = getSaveInfo;
const getGameInfo = (data) => {
    const header = new data_handler_1.DataHandler(data.subarray(0, constants_1.COMPRESSED_DATA_OFFSET));
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
const parseGameInfo = (gameInfo) => {
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
    // TODO: parse location
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
const parseMapInfo = (mapInfo) => {
    // open CSmallScout_DirtRoad?game=XComGame.XComTacticalGame?LoadingFromStrategy=1?Meld=1?StreamingMap0=CIN_DropshipIntros?StreamingMap1=CSmallScout_DirtRoad_Tutorial?LoadingSave
    // open Command1?game=XComStrategyGame.XComHeadQuartersGame
    const [mapName, ...rest] = mapInfo.split('?');
    return {
        mapName: mapName.replace('open ', ''),
        ...Object.fromEntries(rest.map((x) => x.split('=')))
    };
};
const readActorTable = (handler) => {
    const actorTable = [];
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
const readCheckpoints = (handler) => {
    const checkpoints = [];
    try {
        while (!handler.eof) {
            handler.readUInt32();
            const gameType = handler.readUnicodeString();
            const none = handler.readUnicodeString();
            if (none !== 'None') {
                throw new Error(`None mismatch for ${gameType} at offset ${handler.position} iteration ${checkpoints.length + 1}`);
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
    }
    catch (error) {
        console.log('Failed getting more checkpoints after iteration', checkpoints.length, error);
    }
    return checkpoints;
};
const readActorTemplateTable = (handler) => {
    const templateCount = handler.readUInt32();
    const templates = [];
    for (let i = 0; i < templateCount; i++) {
        const classPath = handler.readUnicodeString();
        const rawBytes = handler.readSubarray(64);
        const archetypePath = handler.readUnicodeString();
        templates.push({ classPath, rawBytes, archetypePath });
    }
    return templates;
};
const readNameTable = (handler) => {
    const nameCount = handler.readUInt32();
    const names = [];
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
const readCheckpointTable = (handler) => {
    const checkpointCount = handler.readUInt32();
    const checkpoints = [];
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
const readProperties = (handler) => {
    const properties = [];
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
        let property = null;
        switch (propertyType) {
            case 'IntProperty': {
                (0, node_assert_1.default)(propertySize === 4);
                const value = handler.readUInt32();
                property = {
                    name,
                    size: 4,
                    value,
                    kind: constants_1.PropertyKind.IntProperty
                };
                break;
            }
            case 'FloatProperty': {
                const value = handler.readFloat();
                property = {
                    name,
                    size: 4,
                    value,
                    kind: constants_1.PropertyKind.FloatProperty
                };
                break;
            }
            case 'ObjectProperty': {
                (0, node_assert_1.default)(propertySize === 8);
                const actor1 = handler.readUInt32();
                const actor2 = handler.readUInt32();
                if (actor1 !== -1 && actor1 !== actor2 + 1) {
                    // throw new Error(`Actor references unrelated ${handler.position}`);
                }
                property = {
                    name,
                    size: 8,
                    kind: constants_1.PropertyKind.ObjectProperty,
                    value: actor1 === -1 ? actor1 : actor1 // / 2
                };
                break;
            }
            case 'BoolProperty': {
                (0, node_assert_1.default)(propertySize === 0);
                const value = handler.readByte();
                property = {
                    name,
                    size: 0,
                    value: value !== 0,
                    kind: constants_1.PropertyKind.BoolProperty
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
                        kind: constants_1.PropertyKind.EnumProperty
                    };
                }
                else {
                    const value = handler.readUnicodeString();
                    property = {
                        name,
                        size: propertySize,
                        value: { name: value, value: handler.readUInt32() },
                        kind: constants_1.PropertyKind.EnumProperty
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
                    kind: constants_1.PropertyKind.StringProperty
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
                    kind: constants_1.PropertyKind.NameProperty
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
                            }
                            else if (actor1 === actor2 + 1) {
                                elements.push(actor1 === -1 ? actor1 : actor1 /* / 2 */);
                            }
                            else {
                                // console.info(`Actor references unrelated ${actor1}:${actor2} at ${handler.position}`);
                            }
                        }
                        property = {
                            name,
                            size: propertySize,
                            kind: constants_1.PropertyKind.ObjectArrayProperty,
                            value: elements
                        };
                    }
                    else if (arrayBound * 4 === arrayDataSize) {
                        // array of ints
                        const elements = [];
                        for (let index = 0; index < arrayBound; index++) {
                            elements.push(handler.readUInt32());
                        }
                        property = {
                            name,
                            size: elements.length * 4 + 4,
                            kind: constants_1.PropertyKind.NumberArrayProperty,
                            value: elements
                        };
                    }
                    else {
                        const position = handler.position;
                        const arrayType = (0, determine_array_property_kind_1.determineArrayPropertyKind)(handler);
                        if (position !== handler.position) {
                            throw new Error('Position was moved by determineArrayPropertyKind');
                        }
                        switch (arrayType) {
                            case constants_1.PropertyKind.StructArrayProperty: {
                                const elements = [];
                                for (let index = 0; index < arrayBound; index++) {
                                    elements.push(readProperties(handler));
                                }
                                property = {
                                    name,
                                    size: arrayDataSize + 4,
                                    kind: constants_1.PropertyKind.StructArrayProperty,
                                    value: elements
                                };
                                break;
                            }
                            case constants_1.PropertyKind.StringArrayProperty: {
                                const elements = [];
                                for (let index = 0; index < arrayBound; index++) {
                                    elements.push(handler.readUnicodeString());
                                }
                                property = {
                                    name,
                                    size: arrayDataSize + 4,
                                    kind: constants_1.PropertyKind.StringArrayProperty,
                                    value: elements
                                };
                                break;
                            }
                            case constants_1.PropertyKind.LastProperty: {
                                property = {
                                    name,
                                    size: propertySize,
                                    kind: constants_1.PropertyKind.LastProperty,
                                    value: handler.readSubarray(arrayDataSize).toJSON()
                                };
                                break;
                            }
                            case constants_1.PropertyKind.EnumArrayProperty: {
                                const elements = [];
                                for (let i = 0; i < arrayBound; i++) {
                                    elements.push({
                                        name: handler.readUnicodeString(),
                                        value: handler.readUInt32()
                                    });
                                }
                                property = {
                                    name,
                                    size: propertySize,
                                    kind: constants_1.PropertyKind.EnumArrayProperty,
                                    value: elements
                                };
                                break;
                            }
                            default: {
                                throw new Error(`Unknown array type ${arrayType} at offset ${handler.position}`);
                            }
                        }
                    }
                }
                else {
                    property = {
                        name,
                        size: 4,
                        kind: constants_1.PropertyKind.ObjectArrayProperty,
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
                const structNameToSize = {
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
                            kind: constants_1.PropertyKind.StructProperty,
                            value: handler.readSubarray(structNameToSize[structName]).toJSON()
                        }
                        : {
                            name,
                            structName: structName,
                            size: propertySize,
                            kind: constants_1.PropertyKind.StructProperty,
                            value: handler.readSubarray(propertySize).toJSON()
                        };
                break;
            }
            default: {
                throw new Error(`Unknown property type ${propertyType} at offset ${handler.position}`);
            }
        }
        if (property) {
            (0, node_assert_1.default)(propertySize === property.size, `Property ${propertyType} ${name} size mismatch ${propertySize} !== ${property.size}`);
            if (arrayIndex === 0) {
                properties.push(property);
            }
            else {
                if (properties.at(-1)?.name !== name) {
                    throw new Error(`Array does not match previous property ${handler.position}`);
                }
                if (properties.at(-1)?.kind === constants_1.PropertyKind.StaticArrayProperty) {
                    const array = properties.pop();
                    properties.push({
                        name,
                        size: array.size,
                        kind: constants_1.PropertyKind.StaticArrayProperty,
                        value: array.value
                    });
                }
                else {
                    (0, node_assert_1.default)(arrayIndex === 1);
                    const lastProperty = properties.pop();
                    properties.push({
                        name,
                        size: lastProperty?.size ?? 0,
                        kind: constants_1.PropertyKind.StaticArrayProperty,
                        value: [lastProperty.value, property.value]
                    });
                }
            }
        }
        else {
            console.error(`Property ${propertyType} is null at offset ${handler.position}`);
        }
    }
    return properties;
};
//# sourceMappingURL=parse-save.js.map