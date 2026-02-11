// ========================
// 📘 Anchor IDL TypeScript
// ========================


export type Pubkey = string;
export type Bytes = number[];

// ---------- Enums & Structs ----------

export interface RuleChangeParams {
  rules: Rule[];
}

export type RuleType =
  | { effect: {} }
  | { transferAmount:  TransferAmountRule }
  | { transferFreq: TransferFreqRule }
  | { transferTimes: TransferFreqTimesRule }
  | { transactionParams: TransactionParamsRule }
  | { transactionTimes: TransactionInvokeTimesRule };


// ----------------------------
// 🔹 transactionByteRule
// ----------------------------
export type TransactionByteRule =
  | { equal: Bytes }
  | { between: [Bytes, Bytes] };

// ----------------------------
// 🔹 transactionInvokeTimesRule
// ----------------------------
export interface TransactionInvokeTimesRule {
  interval: number;         // i64
  timeSlot: number;         // i64
  amount: bigint;           // u64
  thresholdAmount: bigint;  // u64
}

// ----------------------------
// 🔹 transactionParamsRule
// ----------------------------
export interface TransactionParamsRule {
  from: number; // u32
  to: number;   // u32
  isHitTrigger: boolean;
  byteRule: TransactionByteRule;
}

// ----------------------------
// 🔹 transferAmountRule
// ----------------------------
export interface TransferAmountRule {
  //balanceType: BalanceType;
  //transferDirection: TransferType;
  amount: bigint; // u64
}

// ----------------------------
// 🔹 transferFreqRule
// ----------------------------
export interface TransferFreqRule {
  //balanceType: BalanceType;
  //transferDirection: TransferType;
  interval: number;         // i64
  timeSlot: number;         // i64
  amount: bigint;           // u128
  thresholdAmount: bigint;  // u128
}

// ----------------------------
// 🔹 transferFreqTimesRule
// ----------------------------
export interface TransferFreqTimesRule {
  //balanceType: BalanceType;
  //transferDirection: TransferType;
  interval: number;         // i64
  timeSlot: number;         // i64
  amount: bigint;           // u64
  thresholdAmount: bigint;  // u64
}

// ----------------------------
// 🔹 transferType
// ----------------------------
/*export type TransferType =
  | { from: {} }
  | { to: {} };*/

// ----------------------------
// 🔹 triggerType
// ----------------------------
export type TriggerType =
  //| { delay: number }  // i64
  | { lock: {} }
  | { approval: {} }
  | { reject: {} };

// ----------------------------
// 🔹 walletFilter
// ----------------------------
export interface WalletFilter {}

// ----------------------------
// 🔹 balanceType
// ----------------------------
export type BalanceType =
  | { lamports: {} }
  | { token: {} }
  | { none: {} };

 // ---------- inOrNot ----------
export type InOrNot =
  | { in: {} }
  | { notIn: {} };

// ---------- tokenFilter ----------
export type TokenFilter =
  | { inList: Pubkey[] }
  | { notInList: Pubkey[] };

// ---------- callProgramFilter ----------
export type CallProgramFilter =
  | { inList: Pubkey[] }
  | { notInList: Pubkey[] };

// ---------- accountPassFilter ----------
export type AccountPassFilter =
  | { inList: Pubkey[] }
  | { notInList: Pubkey[] };

// ---------- accountPassTokenFilter ----------
export interface AccountPassTokenFilter {
  //tokenAccounts: Pubkey[];
  inOrNot: InOrNot;
  list: Pubkey[];
  token: Pubkey;
}

// ---------- fillterType ----------
export type FillterType =
  | { wallet: WalletFilter }
  | { token: TokenFilter }
  | { callProgram: CallProgramFilter }
  | { accountPass: AccountPassFilter }
  | { accountPassToken: AccountPassTokenFilter };

// ----------------------------
// 🔹 Rule
// ----------------------------
export interface Rule {
  fillter: FillterType;
  ruleType: RuleType;
  triggerType: TriggerType;
}