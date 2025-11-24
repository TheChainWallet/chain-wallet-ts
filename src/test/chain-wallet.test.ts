import {ChainWalletClient} from "../chain-wallet/chain-wallet";
import {Keypair, Transaction} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {AnchorProvider} from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
require("dotenv").config();


describe("test chain wallet", () => {


    const chainWalletClient = new ChainWalletClient({
        network: "Devnet",
        endpoint: process.env.ENDPOINT
    });

    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));

    const nodeWallet = new NodeWallet(keypair);

    const provider = new AnchorProvider(chainWalletClient.connect, nodeWallet);

    it("create wallet",async ()=>{
        const instruction = await chainWalletClient.createWallet(
            "Test wallet",
            keypair.publicKey,
            1,
            [keypair.publicKey],
            [keypair.publicKey]
        );
        const transaction = new Transaction().add(instruction);
        const tx = await provider.sendAndConfirm(transaction,[keypair]);
        console.log(tx);
    })
})