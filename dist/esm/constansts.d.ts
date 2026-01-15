export type NET_WORK = 'Mainnet' | 'Devnet' | 'Testnet';
export declare const DEFAULT_NET_WORK: NET_WORK;
export declare const getDefaultEndpoint: (network: NET_WORK) => string;
export declare const ACCOUNT_SEED = "account";
export declare const INSTRUCTION_DATA_SEED = "ins";
export type AccountStatus = {
    normal: {};
} | {
    delay: {
        "0": number;
    };
} | {
    locked: {};
};
//# sourceMappingURL=constansts.d.ts.map