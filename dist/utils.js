"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceWith = exports.uint8ArrayAlterFirst = exports.signHash32 = exports.getTransactionHashWithNonce = void 0;
const crypto_1 = require("crypto");
const tweetnacl_1 = require("tweetnacl");
function getTransactionHashWithNonce(ins, skip, nonce) {
    const hash = (0, crypto_1.createHash)('sha256');
    hash.update(ins.programId.toBytes());
    ins.keys.forEach((account, index) => {
        if (index < skip) {
            return;
        }
        const metaByte1 = account.isSigner ? 0x01 : 0x00;
        const metaByte2 = account.isWritable ? 0x01 : 0x00;
        hash.update(new Uint8Array([metaByte1, metaByte2]));
        hash.update(account.pubkey.toBytes());
    });
    hash.update(ins.data);
    const nonceBuffer = Buffer.alloc(8);
    const nonceBig = nonce;
    nonceBuffer.writeBigUInt64BE(nonceBig);
    hash.update(nonceBuffer);
    return hash.digest();
}
exports.getTransactionHashWithNonce = getTransactionHashWithNonce;
function signHash32(hash, keypair) {
    if (hash.length !== 32) {
        throw new Error('Hash must be 32 bytes');
    }
    return tweetnacl_1.sign.detached(hash, keypair.secretKey);
}
exports.signHash32 = signHash32;
const uint8ArrayAlterFirst = (data, replaceFirst) => {
    const len = Object.keys(data).length;
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        buf[i] = data[i];
    }
    // 2. 直接替换前 8 个字节
    buf.set(replaceFirst, 0);
    for (let i = 0; i < buf.length; i++) {
        data[i] = buf[i];
    }
};
exports.uint8ArrayAlterFirst = uint8ArrayAlterFirst;
function replaceWith(array, target, replacer, equalsFn) {
    const eq = equalsFn || ((a, b) => a === b);
    for (let i = 0; i < array.length; i++) {
        if (eq(array[i], target)) {
            array[i] = replacer;
        }
    }
}
exports.replaceWith = replaceWith;
