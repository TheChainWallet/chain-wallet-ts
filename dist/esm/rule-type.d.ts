export type Pubkey = string;
export type Bytes = number[];
export interface RuleChangeParams {
    rules: Rule[];
}
export type RuleType = {
    effect: {};
} | {
    transferAmount: TransferAmountRule;
} | {
    transferFreq: TransferFreqRule;
} | {
    transferTimes: TransferFreqTimesRule;
} | {
    transactionParams: TransactionParamsRule;
} | {
    transactionTimes: TransactionInvokeTimesRule;
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
    amount: bigint;
}
export interface TransferFreqRule {
    interval: number;
    timeSlot: number;
    amount: bigint;
    thresholdAmount: bigint;
}
export interface TransferFreqTimesRule {
    interval: number;
    timeSlot: number;
    amount: bigint;
    thresholdAmount: bigint;
}
export type TriggerType = {
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
} | {
    none: {};
};
export declare enum InOrNot {
    IN = 0,
    NOT_IN = 1
}
export type TokenFilter = {
    inList: Pubkey[];
} | {
    notInList: Pubkey[];
};
export type CallProgramFilter = {
    inList: Pubkey[];
} | {
    notInList: Pubkey[];
};
export type AccountPassFilter = {
    inList: Pubkey[];
} | {
    notInList: Pubkey[];
};
export interface AccountPassTokenFilter {
    inOrNot: InOrNot;
    list: Pubkey[];
    token: Pubkey;
}
export type FilterType = {
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
    fillter: FilterType;
    ruleType: RuleType;
    triggerType: TriggerType;
}
//# sourceMappingURL=rule-type.d.ts.map