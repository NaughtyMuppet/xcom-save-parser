export class DataHandler {
    #position = 0;

    public get position() {
        return this.#position;
    }

    private set position(value) {
        this.#position = value;
    }

    public get eof() {
        return this.position >= this.value.length;
    }

    public get length() {
        return this.value.length;
    }

    constructor(private value: Buffer) {}

    checkBounds(length: number) {
        if (this.position + length > this.value.length) {
            throw new Error(`End of file reached at offset ${this.position}`);
        }
    }

    seek(offset: number) {
        this.position += offset;
    }

    seekAbsolute(offset: number) {
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

    readSubarray(length: number, seek = true) {
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

    findNextSequence(sequence: Buffer) {
        const index = this.value.indexOf(sequence, this.position);
        return index;
    }

    readRestOfBuffer() {
        return this.value.subarray(this.position);
    }
}
