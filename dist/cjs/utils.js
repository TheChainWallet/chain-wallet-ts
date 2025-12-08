"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uint8ArrayAlterFirst = void 0;
exports.getTransactionHashWithNonce = getTransactionHashWithNonce;
exports.signHash32 = signHash32;
exports.replaceWith = replaceWith;
exports.toVersionTransaction = toVersionTransaction;
const web3_js_1 = require("@solana/web3.js");
const crypto_1 = require("crypto");
const nacl = __importStar(require("tweetnacl"));
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
function signHash32(hash, keypair) {
    if (hash.length !== 32) {
        throw new Error('Hash must be 32 bytes');
    }
    return nacl.sign.detached(hash, keypair.secretKey);
}
const uint8ArrayAlterFirst = (data, replaceFirst) => {
    data.set(replaceFirst, 0);
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
function toVersionTransaction(tx, payer, recentBlockhash) {
    const messageV0 = new web3_js_1.TransactionMessage({
        payerKey: payer,
        recentBlockhash: recentBlockhash,
        instructions: tx.instructions,
    }).compileToV0Message();
    return new web3_js_1.VersionedTransaction(messageV0);
}
//# sourceMappingURL=utils.js.map