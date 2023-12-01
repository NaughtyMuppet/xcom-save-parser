declare module 'lzo-decompress' {
    export const decompress: (data: Uint8Array, length: number) => Buffer;
}
