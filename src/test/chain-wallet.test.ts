import {ChainWalletClient} from "../chain-wallet/chain-wallet";
import {Keypair, PublicKey, SystemProgram, Transaction} from "@solana/web3.js";
import {bs58} from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {AnchorProvider} from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

require("dotenv").config();


describe("test chain wallet", () => {


    const chainWalletClient = new ChainWalletClient({
        network: "Devnet",
        endpoint: process.env.ENDPOINT
    });

    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));

    const chainWallet = new PublicKey(process.env.CHAIN_WALLET);

    const nodeWallet = new NodeWallet(keypair);

    const provider = new AnchorProvider(chainWalletClient.connect, nodeWallet);

    it("create wallet", async () => {
        const transaction = await chainWalletClient.createWallet(
            "Test wallet",
            keypair.publicKey,
            1,
            [keypair.publicKey],
            [keypair.publicKey]
        );
        const tx = await provider.sendAndConfirm(transaction, [keypair]);
        console.log(tx);
    })
    it("executor transfer", async () => {
        const transferTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: nodeWallet.publicKey,
                toPubkey: chainWallet,
                lamports: 2e9
            }),
            SystemProgram.transfer({
                fromPubkey: chainWallet,
                toPubkey: nodeWallet.publicKey,
                lamports: 1e9
            }),
            SystemProgram.transfer({
                fromPubkey: chainWallet,
                toPubkey: nodeWallet.publicKey,
                lamports: 0.5 * 1e9
            })
        );
        const convertTx = await chainWalletClient.executorTxConvert(transferTx, chainWallet, nodeWallet.publicKey);
        const txSignature = await chainWalletClient.connect.sendTransaction(convertTx, [nodeWallet.payer]);
        console.log(txSignature);
    })

    it("init fee", async () => {
        const transferTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: nodeWallet.publicKey,
                toPubkey: new PublicKey("ANSUPKasMgpWaAzg4JVQcryr6n9cU1Ts5KSRMowyRu3i"),
                lamports: await chainWalletClient.connect.getMinimumBalanceForRentExemption(0)
            }),
        );
        const txSignature = await chainWalletClient.connect.sendTransaction(transferTx, [nodeWallet.payer]);
        console.log(txSignature);
    })
})