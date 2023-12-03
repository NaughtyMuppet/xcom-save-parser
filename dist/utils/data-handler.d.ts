/// <reference types="node" />
export declare class DataHandler {
    #private;
    private value;
    get position(): number;
    private set position(value);
    get eof(): boolean;
    get length(): number;
    constructor(value: Buffer);
    checkBounds(length: number): void;
    seek(offset: number): void;
    seekAbsolute(offset: number): void;
    readByte(): number;
    readInt32(): number;
    readUInt32(seek?: boolean): number;
    readFloat(): number;
    readSubarray(length: number, seek?: boolean): Buffer;
    readUnicodeString(): string;
    findNextSequence(sequence: Buffer): number;
    readRestOfBuffer(): Buffer;
}
