"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chain_wallet_1 = require("../chain-wallet/chain-wallet");
describe("test example", () => {
    const chainWalletClient = new chain_wallet_1.ChainWalletClient({});
    it("it is a example test", async () => {
        console.log("hello world");
    });
});
