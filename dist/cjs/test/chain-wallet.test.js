"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chain_wallet_1 = require("../chain-wallet");
const web3_js_1 = require("@solana/web3.js");
const bytes_1 = require("@coral-xyz/anchor/dist/cjs/utils/bytes");
const anchor_1 = require("@coral-xyz/anchor");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const safe_stable_stringify_1 = __importDefault(require("safe-stable-stringify"));
const chain_wallet_json_1 = __importDefault(require("../idl/devnet/chain_wallet.json"));
require("dotenv").config();
describe("test chain wallet", () => {
    const chainWalletClient = new chain_wallet_1.ChainWalletClient({
        network: "Devnet",
        endpoint: process.env.ENDPOINT
    });
    const keypair = web3_js_1.Keypair.fromSecretKey(bytes_1.bs58.decode(process.env.PRIVATE_KEY));
    const chainWallet = new web3_js_1.PublicKey(process.env.CHAIN_WALLET);
    const nodeWallet = new nodewallet_1.default(keypair);
    const nodeWallet2 = new nodewallet_1.default(web3_js_1.Keypair.fromSecretKey(bytes_1.bs58.decode(process.env.PRIVATE_KEY2)));
    const custody = new web3_js_1.PublicKey(process.env.CUSTODY);
    const provider = new anchor_1.AnchorProvider(chainWalletClient.connect, nodeWallet);
    it("create wallet", async () => {
        const transaction = await chainWalletClient.createWallet("Test wallet", keypair.publicKey, 1, [keypair.publicKey], [keypair.publicKey]);
        const tx = await provider.sendAndConfirm(transaction, [keypair]);
        console.log(tx);
    });
    it("executor transfer", async () => {
        const transferTx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: nodeWallet.publicKey,
            toPubkey: chainWallet,
            lamports: 2e9
        }), web3_js_1.SystemProgram.transfer({
            fromPubkey: chainWallet,
            toPubkey: nodeWallet.publicKey,
            lamports: 1e9
        }), web3_js_1.SystemProgram.transfer({
            fromPubkey: chainWallet,
            toPubkey: nodeWallet.publicKey,
            lamports: 0.99 * 1e9
        }));
        console.log((0, safe_stable_stringify_1.default)(transferTx, null, 2));
        // const convertTx = await chainWalletClient.executorTxConvert(transferTx, chainWallet, nodeWallet.publicKey);
        // const txSignature = await chainWalletClient.connect.sendTransaction(convertTx, [nodeWallet.payer]);
        // console.log(txSignature);
    });
    it("init fee", async () => {
        const transferTx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: nodeWallet.publicKey,
            toPubkey: new web3_js_1.PublicKey("ANSUPKasMgpWaAzg4JVQcryr6n9cU1Ts5KSRMowyRu3i"),
            lamports: await chainWalletClient.connect.getMinimumBalanceForRentExemption(0)
        }));
        const txSignature = await chainWalletClient.connect.sendTransaction(transferTx, [nodeWallet.payer]);
        console.log(txSignature);
    });
    it("multi signature", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", custodyAccount);
        const ins = await chainWalletClient.managerChangeStatusInstruction(chainWallet, { delay: { "0": 500 } });
    });
    it("multi signature change threshed", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", custodyAccount);
        const ins = await chainWalletClient.managerChangeThresholdInstruction(chainWallet, 1);
    });
    it("multi signature add manager", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", custodyAccount);
        const ins = await chainWalletClient.managerMangersAddInstruction(chainWallet, [nodeWallet2.publicKey]);
    });
    it("multi signature remove manager", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", (0, safe_stable_stringify_1.default)(custodyAccount, null, 2));
        const ins = await chainWalletClient.managerMangersDeleteInstruction(chainWallet, [1]);
        const transferTx = new web3_js_1.Transaction().add(ins);
    });
    it("executor push delay", async () => {
        const transferTx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: nodeWallet.publicKey,
            toPubkey: chainWallet,
            lamports: 2e9
        }), web3_js_1.SystemProgram.transfer({
            fromPubkey: chainWallet,
            toPubkey: nodeWallet.publicKey,
            lamports: 1e9
        }), web3_js_1.SystemProgram.transfer({
            fromPubkey: chainWallet,
            toPubkey: nodeWallet.publicKey,
            lamports: 0.99 * 1e9
        }));
        console.log((0, safe_stable_stringify_1.default)(transferTx, null, 2));
        const convertTx = await chainWalletClient.executorTxConvert(transferTx, chainWallet, nodeWallet.publicKey);
        console.log((0, safe_stable_stringify_1.default)(convertTx, null, 2));
        // const convertDelayTx = await chainWalletClient.delayExecuteVersionTransaction(convertTx,nodeWallet.publicKey);
        // convertDelayTx.sign([nodeWallet.payer]);
        const convertDelayTx = await chainWalletClient.delayExecuteTransaction(convertTx, nodeWallet.publicKey);
        console.log((0, safe_stable_stringify_1.default)(convertDelayTx, null, 2));
        const txSignature = await chainWalletClient.connect.sendTransaction(convertDelayTx, [nodeWallet.payer]);
        console.log(txSignature);
    });
    it("test decode multisigPush data", async () => {
        console.log("=== Testing multisigPush data decoding ===\n");
        // 1. 创建一个原始指令
        const originalInstruction = web3_js_1.SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: chainWallet,
            lamports: 1e9
        });
        console.log("Original instruction data:", Buffer.from(originalInstruction.data).toString('hex'));
        // 2. 创建 multisigPush 指令
        const pushInstruction = await chainWalletClient.multisigPushInstruction(originalInstruction, chainWallet, keypair.publicKey, "test decode remark");
        console.log("\n=== MultisigPush Instruction ===");
        console.log("Program ID:", pushInstruction.programId.toString());
        console.log("Data length:", pushInstruction.data.length);
        console.log("Full data (hex):", Buffer.from(pushInstruction.data).toString('hex'));
        // 3. 解码指令
        const coder = new anchor_1.BorshCoder(chain_wallet_json_1.default);
        // 跳过前8字节的 discriminator
        const discriminator = pushInstruction.data.slice(0, 8);
        const paramsData = pushInstruction.data.slice(8);
        console.log("\n=== Decoding Process ===");
        console.log("Discriminator (8 bytes):", Buffer.from(discriminator).toString('hex'));
        console.log("Params data length:", paramsData.length);
        try {
            // 使用 coder.types.decode 解码参数
            const decoded = coder.types.decode("MultisigPushParams", paramsData);
            console.log("\n=== Decoded Result ===");
            console.log("Full decoded object:");
            console.log(JSON.stringify(decoded, (key, value) => {
                if (value instanceof Uint8Array || value instanceof Buffer) {
                    return {
                        type: 'Buffer',
                        hex: Buffer.from(value).toString('hex'),
                        length: value.length
                    };
                }
                return value;
            }, 2));
            console.log("\n=== Extracted Fields ===");
            console.log("Remark:", decoded.remark);
            console.log("Data type:", decoded.data?.constructor?.name || typeof decoded.data);
            console.log("Data length:", decoded.data?.length);
            console.log("Data (hex):", decoded.data ? Buffer.from(decoded.data).toString('hex') : 'null');
            // 验证解码的 data 是否与原始指令的 data 相同
            if (decoded.data) {
                const matches = Buffer.from(decoded.data).equals(Buffer.from(originalInstruction.data));
                console.log("\n=== Verification ===");
                console.log("Decoded data matches original instruction:", matches);
            }
        }
        catch (error) {
            console.error("\n=== Decode Error ===");
            console.error(error);
        }
    });
});
//# sourceMappingURL=chain-wallet.test.js.map