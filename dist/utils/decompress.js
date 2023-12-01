"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompress = void 0;
const constants_1 = require("../constants");
const data_handler_1 = require("./data-handler");
const lzo_decompress_1 = require("lzo-decompress");
const decompress = (data) => {
    let out = Buffer.alloc(0);
    const handler = new data_handler_1.DataHandler(data);
    handler.seek(constants_1.COMPRESSED_DATA_OFFSET);
    while (!handler.eof) {
        if (handler.readUInt32() !== constants_1.UPK_MAGIC_NUMBER) {
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
exports.decompress = decompress;
const decompressChunk = (handler, length, outputSize) => {
    const compressedData = handler.readSubarray(length, false);
    const status = (0, lzo_decompress_1.decompress)(compressedData, outputSize);
    return status;
};
//# sourceMappingURL=decompress.js.map