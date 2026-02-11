import {ChainWalletClient} from "../chain-wallet";
import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {BorshCoder} from "@coral-xyz/anchor";
import devWalletIdl from "../idl/devnet/chain_wallet.json";
import {ChainWallet} from "../idl/chain_wallet";
import {Rule, WalletFilter} from "../rule-type";

require("dotenv").config();

describe("risk rule encoding", () => {
    const client = new ChainWalletClient({
        network: "Devnet",
        endpoint: process.env.ENDPOINT,
    });

    it("test ruleAdd", async () => {
        const wallet = new PublicKey(process.env.CHAIN_WALLET!);

        const rules: Rule[] = [
            client.createEffectRole(
                {wallet: {}},
                {approval: {}}
            ),
            client.createTransferAmountRule(
                {wallet: {}},
                {approval: {}},
                BigInt(Number(1 * LAMPORTS_PER_SOL))
            ),
        ];

        const ix = await client.managerRuleAddInstruction(wallet, rules);

        const coder = new BorshCoder(devWalletIdl as ChainWallet);
        const decoded = coder.instruction.decode(ix.data);

        console.log("name:", decoded?.name);
        console.log("data:", decoded?.data);
    });
});