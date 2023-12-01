import { COMPRESSED_DATA_OFFSET, UPK_MAGIC_NUMBER } from '../constants';
import { DataHandler } from './data-handler';
import { decompress as lzoDecompress } from 'lzo-decompress';
export const decompress = (data: Buffer) => {
    let out = Buffer.alloc(0);
    const handler = new DataHandler(data);
    handler.seek(COMPRESSED_DATA_OFFSET);
    while (!handler.eof) {
        if (handler.readUInt32() !== UPK_MAGIC_NUMBER) {
            throw new Error(`Compression marker not found at offset ${handler.position - 4}`);
        }
        // Block size
        handler.readUInt32();
        const compressedSize = handler.readUInt32();
        const uncompressedSize = handler.readUInt32();
        if (uncompressedSize < compressedSize) {
            throw new Error(`Uncompressed size is smaller than compressed size at offset ${handler.position}`);
        }
        handler.seek(8);
        const uncompressedData = decompressChunk(handler, compressedSize, uncompressedSize);
        if (uncompressedData.length !== uncompressedSize) {
            throw new Error(`Uncompressed size mismatch at offset ${handler.position}`);
        }
        out = Buffer.concat([out, uncompressedData]);
        handler.seek(compressedSize);
    }
    return out;
};

const decompressChunk = (handler: DataHandler, length: number, outputSize: number) => {
    const compressedData = handler.readSubarray(length, false);
    const status = lzoDecompress(compressedData, outputSize);
    return status;
};
