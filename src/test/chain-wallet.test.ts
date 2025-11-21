import {ChainWalletClient} from "../chain-wallet/chain-wallet";
require("dotenv").config();


describe("test chain wallet", () => {


    const chainWalletClient = new ChainWalletClient({
        network: "Devnet",
        endpoint: process.env.ENDPOINT
    });

    it("create wallet",async ()=>{
    })
})