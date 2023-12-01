"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataHandler = void 0;
class DataHandler {
    value;
    #position = 0;
    get position() {
        return this.#position;
    }
    set position(value) {
        this.#position = value;
    }
    get eof() {
        return this.position >= this.value.length;
    }
    get length() {
        return this.value.length;
    }
    constructor(value) {
        this.value = value;
    }
    checkBounds(length) {
        if (this.position + length > this.value.length) {
            throw new Error(`End of file reached at offset ${this.position}`);
        }
    }
    seek(offset) {
        this.position += offset;
    }
    seekAbsolute(offset) {
        this.position = offset;
    }
    readByte() {
        this.checkBounds(1);
        const result = this.value.readUInt8(this.position);
        this.position += 1;
        return result;
    }
    readInt32() {
        this.checkBounds(4);
        const result = this.value.readInt32LE(this.position);
        this.position += 4;
        return result;
    }
    readUInt32(seek = true) {
        this.checkBounds(4);
        const result = this.value.readUInt32LE(this.position);
        if (seek) {
            this.position += 4;
        }
        return result;
    }
    readFloat() {
        this.checkBounds(4);
        const result = this.value.readFloatLE(this.position);
        this.position += 4;
        return result;
    }
    readSubarray(length, seek = true) {
        this.checkBounds(length);
        const result = this.value.subarray(this.position, this.position + length);
        if (seek) {
            this.position += length;
        }
        return result;
    }
    readUnicodeString() {
        const length = this.readUInt32();
        this.checkBounds(length);
        const result = this.readSubarray(length - 1).toString('utf8');
        this.seek(1);
        return result;
    }
    findNextSequence(sequence) {
        const index = this.value.indexOf(sequence, this.position);
        if (index === -1) {
            throw new Error(`Sequence not found at offset ${this.position}`);
        }
        return index;
    }
}
exports.DataHandler = DataHandler;
//# sourceMappingURL=data-handler.js.map