export type Pubkey = string;
export type Bytes = number[];
export interface RuleChangeParams {
    rules: Rule[];
}
export type RuleType = {
    effect: {};
} | {
    transferAmount: {
        transferAmountRule: TransferAmountRule;
    };
} | {
    transferFreq: {
        transferFreqRule: TransferFreqRule;
    };
} | {
    transferTimes: {
        transferFreqTimesRule: TransferFreqTimesRule;
    };
} | {
    transactionParams: {
        transactionParamsRule: TransactionParamsRule;
    };
} | {
    transactionTimes: {
        transactionInvokeTimesRule: TransactionInvokeTimesRule;
    };
};
export type TransactionByteRule = {
    equal: Bytes;
} | {
    between: [Bytes, Bytes];
};
export interface TransactionInvokeTimesRule {
    interval: number;
    timeSlot: number;
    amount: bigint;
    thresholdAmount: bigint;
}
export interface TransactionParamsRule {
    from: number;
    to: number;
    isHitTrigger: boolean;
    byteRule: TransactionByteRule;
}
export interface TransferAmountRule {
    balanceType: BalanceType;
    amount: bigint;
    transferDirection: TransferType;
}
export interface TransferFreqRule {
    balanceType: BalanceType;
    transferDirection: TransferType;
    interval: number;
    timeSlot: number;
    amount: bigint;
    thresholdAmount: bigint;
}
export interface TransferFreqTimesRule {
    balanceType: BalanceType;
    transferDirection: TransferType;
    interval: number;
    timeSlot: number;
    amount: bigint;
    thresholdAmount: bigint;
}
export type TransferType = {
    from: {};
} | {
    to: {};
};
export type TriggerType = {
    delay: number;
} | {
    lock: {};
} | {
    approval: {};
} | {
    reject: {};
};
export interface WalletFilter {
}
export type BalanceType = {
    lamports: {};
} | {
    token: {};
};
export type InOrNot = {
    in: {};
} | {
    notIn: {};
};
export interface WalletFilter {
}
export type TokenFilter = {
    inList: Pubkey[];
} | {
    notInList: Pubkey[];
};
export interface CallProgramFilter {
    programIds: Pubkey[];
    inOrNot: InOrNot;
}
export interface AccountPassFilter {
    accounts: Pubkey[];
    inOrNot: InOrNot;
}
export interface AccountPassTokenFilter {
    tokenAccounts: Pubkey[];
    inOrNot: InOrNot;
}
export type FillterType = {
    wallet: WalletFilter;
} | {
    token: TokenFilter;
} | {
    callProgram: CallProgramFilter;
} | {
    accountPass: AccountPassFilter;
} | {
    accountPassToken: AccountPassTokenFilter;
};
export interface Rule {
    fillter: FillterType;
    ruleType: RuleType;
    triggerType: TriggerType;
}
