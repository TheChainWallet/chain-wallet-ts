import {ChainWalletClient} from "../chain-wallet";
import {Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction} from "@solana/web3.js";
import {BorshCoder} from "@coral-xyz/anchor";
import {AnchorProvider} from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {bs58} from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import devWalletIdl from "../idl/devnet/chain_wallet.json";
import {ChainWallet} from "../idl/chain_wallet";
import {
    Rule,
    FilterType,
    TriggerType,
    TransactionParamsRule,
    TransactionInvokeTimesRule,
    TransferAmountRule,
    TransferFreqRule,
    TransferFreqTimesRule
} from "../rule-type";
import stringify from "safe-stable-stringify";

require("dotenv").config();

describe("risk rule encoding", () => {
    const client = new ChainWalletClient({
        network: "Devnet",
        endpoint: process.env.ENDPOINT,
    });

    const coder = new BorshCoder(devWalletIdl as ChainWallet);

    const chainWallet = new PublicKey(process.env.CHAIN_WALLET!);
    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
    const nodeWallet = new NodeWallet(keypair);
    const nodeWallet2 = new NodeWallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY2!)));
    const custody = new PublicKey(process.env.CUSTODY!);
    const provider = new AnchorProvider(client.connect, nodeWallet);
    const provider2 = new AnchorProvider(client.connect, nodeWallet2);

    const defaultFilter: FilterType = {wallet: {}};
    const defaultTrigger: TriggerType = {approval: {}};

    const buildAllRules = (): Rule[] => {
        const transferAmount: TransferAmountRule = {
            amount: BigInt(Number(1 * LAMPORTS_PER_SOL))
        };
        const transferFreq: TransferFreqRule = {
            interval: 60,
            timeSlot: 3600,
            amount: BigInt(10_000_000),
            thresholdAmount: BigInt(100_000_000)
        };
        const transferFreqTimes: TransferFreqTimesRule = {
            interval: 60,
            timeSlot: 3600,
            amount: BigInt(10_000_000),
            thresholdAmount: BigInt(100_000_000)
        };
        const txParams: TransactionParamsRule = {
            from: 0,
            to: 3,
            isHitTrigger: true,
            byteRule: {
                equal: [1, 2, 3, 4]
            }
        };
        const txInvokeTimes: TransactionInvokeTimesRule = {
            interval: 60,
            timeSlot: 600,
            amount: BigInt(1_000_000),
            thresholdAmount: BigInt(10_000_000)
        };

        return [
            client.createEffectRole(defaultFilter, defaultTrigger),
            client.createTransferAmountRule(defaultFilter, defaultTrigger, transferAmount.amount),
            client.createTransferFreqRule(defaultFilter, defaultTrigger, transferFreq),
            client.createTransferFreqTimesRule(defaultFilter, defaultTrigger, transferFreqTimes),
            client.createTransactionParamsRule(defaultFilter, defaultTrigger, txParams),
            client.createTransactionInvokeTimesRule(defaultFilter, defaultTrigger, txInvokeTimes),
        ];
    };

    it("build all rule types", () => {
        const rules = buildAllRules();

        for (const rule of rules) {
            console.log(rule);
        }

        expect(rules).toHaveLength(6);
        expect(rules[0].ruleType).toHaveProperty("effect");
        expect(rules[1].ruleType).toHaveProperty("transferAmount");
        expect(rules[2].ruleType).toHaveProperty("transferFreq");
        expect(rules[3].ruleType).toHaveProperty("transferTimes");
        expect(rules[4].ruleType).toHaveProperty("transactionParams");
        expect(rules[5].ruleType).toHaveProperty("transactionTimes");
    });

    it("rule add instruction encodes", async () => {
        const rules = buildAllRules();
        const ix = await client.managerRuleAddInstruction(chainWallet, rules);
        const decoded = coder.instruction.decode(ix.data);

        console.log(decoded);

        expect(decoded?.name).toBe("rule_add");
    });

    it("rule change instruction encodes", async () => {
        const rules = buildAllRules();
        const ix = await client.managerRuleChangeInstruction(chainWallet, rules);
        const decoded = coder.instruction.decode(ix.data);

        console.log(decoded);

        expect(decoded?.name).toBe("rule_change");
    });

    it("rule delete instruction encodes", async () => {
        const ix = await client.managerRuleDeleteInstruction(chainWallet, [0, 2]);
        const decoded = coder.instruction.decode(ix.data);

        console.log(decoded);

        expect(decoded?.name).toBe("rule_delete");
    });

    it("multisig push/execute conversion for rule add", async () => {
        const rules = buildAllRules();
        const addIx = await client.managerRuleAddInstruction(chainWallet, rules);
        const pushIx = await client.multisigPushInstruction(addIx, chainWallet, keypair.publicKey, "risk rule add", 0);
        const execIx = await client.multisigPushToMultisigExecute(pushIx, chainWallet, 0n);

        console.log(pushIx);

        expect(pushIx.programId.equals(addIx.programId)).toBe(true);
        expect(execIx).not.toBeNull();

        if (execIx) {
            const decoded = coder.instruction.decode(execIx.data);
            expect(decoded?.name).toBe("multisig_execute");
        }
    });

    it("risk multisig add rule on-chain", async () => {
        // 检查钱包是否存在
        let custodyAccount;
        try {
            custodyAccount = await client.walletProgram.account.custodyAccount.fetch(custody);
        } catch (e: any) {
            if (e.message.includes('Account does not exist')) {
                console.error("\n❌ 链上钱包不存在！");
                console.error("请先运行 'create wallet' 测试创建钱包");
                console.error("\n当前配置:");
                console.error("  CHAIN_WALLET:", process.env.CHAIN_WALLET);
                console.error("  CUSTODY:", process.env.CUSTODY);
                throw new Error("Chain wallet does not exist. Please create it first using chain-wallet-setup.test.ts");
            }
            throw e;
        }

        const walletPubkey = custodyAccount.wallet as PublicKey;
        console.log("custody", custodyAccount);

        const nonceNumber = custodyAccount.approvalNonce.toNumber();
        const nonce = BigInt(nonceNumber);

        const rules = [client.createEffectRole(defaultFilter, defaultTrigger)];
        const addRuleIns = await client.managerRuleAddInstruction(
            walletPubkey, rules
        );
        const addRuleTx = new Transaction().add(addRuleIns);
        console.log("addRuleTx:", stringify(addRuleTx, null, 2));

        const pushIx = await client.multisigPushInstruction(
            addRuleIns,
            walletPubkey,
            keypair.publicKey,
            "risk rule add",
            nonceNumber
        );

        const pushTx = new Transaction().add(pushIx);
        console.log("pushTx:", pushTx);
        const pushSig = await provider.sendAndConfirm(pushTx, [nodeWallet.payer], {skipPreflight: true});
        console.log("pushSig:", pushSig);

        if (custodyAccount.threshold > 1) {
            console.log("Threshold > 1, 需要其他 manager 批准...");
            const approveIx = await client.multisigApprovalRejectInstruction(
                nonce,
                walletPubkey,
                nodeWallet2.publicKey,
                "approve"
            );
            const approveTx = new Transaction().add(approveIx);
            const approveSig = await provider2.sendAndConfirm(approveTx, [nodeWallet2.payer], {skipPreflight: true});
            console.log("approveSig:", approveSig);
        }

        const executeIx = await client.multisigExecuteInstruction(
            addRuleIns,
            nonce,
            walletPubkey,
            nodeWallet.publicKey
        );
        const executeTx = new Transaction().add(executeIx);
        const executeSig = await provider.sendAndConfirm(executeTx, [nodeWallet.payer], {skipPreflight: true});
        console.log("executeSig:", executeSig);

        const updatedCustody = await client.walletProgram.account.custodyAccount.fetch(custody);
        console.log("添加规则后 custody:", updatedCustody);
        console.log("rules count:", updatedCustody.rules.length);
    }, 120000);
});

