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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toVersionTransaction = exports.replaceWith = exports.uint8ArrayAlterFirst = exports.signHash32 = exports.getTransactionHashWithNonce = void 0;
const web3_js_1 = require("@solana/web3.js");
const nacl = __importStar(require("tweetnacl"));
async function getTransactionHashWithNonce(ins, skip, nonce) {
    const chunks = [];
    // programId
    chunks.push(ins.programId.toBytes());
    // account metas
    ins.keys.forEach((account, index) => {
        if (index < skip)
            return;
        const meta = new Uint8Array([
            account.isSigner ? 1 : 0,
            account.isWritable ? 1 : 0,
        ]);
        chunks.push(meta);
        chunks.push(account.pubkey.toBytes());
    });
    // instruction data
    chunks.push(ins.data);
    // nonce (8-byte BE)
    const nonceBuf = new Uint8Array(8);
    const view = new DataView(nonceBuf.buffer);
    view.setBigUint64(0, nonce, false); // false = big-endian
    chunks.push(nonceBuf);
    // concat all
    const totalLen = chunks.reduce((s, x) => s + x.length, 0);
    const all = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
        all.set(chunk, offset);
        offset += chunk.length;
    }
    // hash (browser or Node)
    let digest;
    if (typeof crypto !== "undefined" && crypto.subtle) {
        // Browser
        digest = await crypto.subtle.digest("SHA-256", all);
    }
    else {
        // Node fallback
        const { createHash } = await Promise.resolve().then(() => __importStar(require("crypto")));
        const hash = createHash("sha256").update(Buffer.from(all)).digest();
        return new Uint8Array(hash);
    }
    return new Uint8Array(digest);
}
exports.getTransactionHashWithNonce = getTransactionHashWithNonce;
function signHash32(hash, keypair) {
    if (hash.length !== 32) {
        throw new Error('Hash must be 32 bytes');
    }
    return nacl.sign.detached(hash, keypair.secretKey);
}
exports.signHash32 = signHash32;
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
exports.replaceWith = replaceWith;
function toVersionTransaction(tx, payer, recentBlockhash) {
    const messageV0 = new web3_js_1.TransactionMessage({
        payerKey: payer,
        recentBlockhash: recentBlockhash,
        instructions: tx.instructions,
    }).compileToV0Message();
    return new web3_js_1.VersionedTransaction(messageV0);
}
exports.toVersionTransaction = toVersionTransaction;
//# sourceMappingURL=utils.js.map