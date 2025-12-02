/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/chain_wallet.json`.
 */
export type ChainWallet = {
  "address": "EY97THtfbhmcHDD7b5h8GgVvD6vk3eHUXEPUwaBUDqwG",
  "metadata": {
    "name": "chainWallet",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "approval",
      "discriminator": [
        230,
        210,
        15,
        235,
        90,
        219,
        237,
        191
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  112,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "proxyProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "approvalParams"
            }
          }
        }
      ]
    },
    {
      "name": "configInit",
      "discriminator": [
        13,
        236,
        164,
        173,
        106,
        253,
        164,
        185
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "delayExecutor"
        },
        {
          "name": "lockPubkey"
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  112,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "withdrawConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "configInitParams"
            }
          }
        }
      ]
    },
    {
      "name": "create",
      "discriminator": [
        24,
        30,
        200,
        40,
        5,
        28,
        7,
        119
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  112,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createParams"
            }
          }
        }
      ]
    },
    {
      "name": "delayExecute",
      "discriminator": [
        121,
        45,
        160,
        248,
        173,
        63,
        156,
        116
      ],
      "accounts": [
        {
          "name": "executor",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  112,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "proxyProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "execute",
      "discriminator": [
        130,
        221,
        242,
        154,
        13,
        193,
        189,
        29
      ],
      "accounts": [
        {
          "name": "executor",
          "signer": true
        },
        {
          "name": "custodyAccount"
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  112,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "proxyProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "executorAdd",
      "discriminator": [
        114,
        34,
        11,
        155,
        193,
        89,
        101,
        127
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "executorChangeParams"
            }
          }
        }
      ]
    },
    {
      "name": "executorChange",
      "discriminator": [
        68,
        54,
        255,
        94,
        170,
        63,
        84,
        238
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "executorChangeParams"
            }
          }
        }
      ]
    },
    {
      "name": "executorDelete",
      "discriminator": [
        146,
        225,
        195,
        29,
        144,
        131,
        33,
        154
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "vec": "u32"
          }
        }
      ]
    },
    {
      "name": "lock",
      "discriminator": [
        21,
        19,
        208,
        43,
        237,
        62,
        255,
        87
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  112,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "proxyProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "managerAdd",
      "discriminator": [
        123,
        110,
        158,
        145,
        189,
        183,
        234,
        69
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "managerChangeParams"
            }
          }
        }
      ]
    },
    {
      "name": "managerChange",
      "discriminator": [
        29,
        179,
        122,
        60,
        204,
        82,
        109,
        110
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "managerChangeParams"
            }
          }
        }
      ]
    },
    {
      "name": "managerDelete",
      "discriminator": [
        249,
        99,
        112,
        237,
        117,
        73,
        58,
        136
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "vec": "u32"
          }
        }
      ]
    },
    {
      "name": "ruleAdd",
      "discriminator": [
        250,
        137,
        172,
        148,
        5,
        85,
        21,
        204
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "ruleChangeParams"
            }
          }
        }
      ]
    },
    {
      "name": "ruleChange",
      "discriminator": [
        198,
        133,
        20,
        153,
        134,
        79,
        108,
        207
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "ruleChangeParams"
            }
          }
        }
      ]
    },
    {
      "name": "ruleDelete",
      "discriminator": [
        11,
        131,
        211,
        70,
        210,
        239,
        242,
        254
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "vec": "u32"
          }
        }
      ]
    },
    {
      "name": "statusChange",
      "discriminator": [
        51,
        5,
        36,
        80,
        107,
        95,
        220,
        167
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "changeStatusParams"
            }
          }
        }
      ]
    },
    {
      "name": "thresholdChange",
      "discriminator": [
        177,
        194,
        49,
        12,
        133,
        103,
        210,
        111
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "custodyAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "withdrawer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  112,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "withdrawConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "configState",
      "discriminator": [
        193,
        77,
        160,
        128,
        208,
        254,
        180,
        135
      ]
    },
    {
      "name": "custodyAccount",
      "discriminator": [
        6,
        34,
        189,
        110,
        69,
        211,
        16,
        27
      ]
    },
    {
      "name": "withdrawerConfig",
      "discriminator": [
        136,
        110,
        35,
        225,
        43,
        26,
        201,
        136
      ]
    }
  ],
  "events": [
    {
      "name": "addExecutorsEvent",
      "discriminator": [
        1,
        85,
        207,
        173,
        65,
        251,
        248,
        67
      ]
    },
    {
      "name": "addManagersEvent",
      "discriminator": [
        168,
        230,
        250,
        112,
        24,
        159,
        36,
        88
      ]
    },
    {
      "name": "addRuleEvent",
      "discriminator": [
        223,
        162,
        56,
        204,
        87,
        131,
        246,
        95
      ]
    },
    {
      "name": "changeAutoLockEvent",
      "discriminator": [
        105,
        101,
        87,
        181,
        39,
        72,
        215,
        240
      ]
    },
    {
      "name": "changeExecutorsEvent",
      "discriminator": [
        98,
        250,
        240,
        32,
        157,
        29,
        155,
        102
      ]
    },
    {
      "name": "changeManagersEvent",
      "discriminator": [
        47,
        156,
        56,
        10,
        127,
        254,
        118,
        239
      ]
    },
    {
      "name": "changeRuleEvent",
      "discriminator": [
        73,
        110,
        247,
        83,
        175,
        241,
        169,
        226
      ]
    },
    {
      "name": "changeStatusEvent",
      "discriminator": [
        50,
        41,
        130,
        153,
        207,
        107,
        22,
        141
      ]
    },
    {
      "name": "changeThresholdEvent",
      "discriminator": [
        103,
        107,
        231,
        238,
        83,
        168,
        180,
        227
      ]
    },
    {
      "name": "createEvent",
      "discriminator": [
        27,
        114,
        169,
        77,
        222,
        235,
        99,
        118
      ]
    },
    {
      "name": "delExecutorsEvent",
      "discriminator": [
        193,
        122,
        8,
        83,
        200,
        97,
        125,
        85
      ]
    },
    {
      "name": "delManagersEvent",
      "discriminator": [
        252,
        131,
        156,
        136,
        195,
        65,
        166,
        250
      ]
    },
    {
      "name": "delRuleEvent",
      "discriminator": [
        178,
        97,
        68,
        90,
        30,
        5,
        160,
        172
      ]
    },
    {
      "name": "delayPushEvent",
      "discriminator": [
        4,
        76,
        98,
        197,
        54,
        212,
        220,
        94
      ]
    },
    {
      "name": "executeApprovalFailEvent",
      "discriminator": [
        90,
        160,
        229,
        160,
        176,
        220,
        199,
        249
      ]
    },
    {
      "name": "executeApprovalSuccessEvent",
      "discriminator": [
        109,
        101,
        24,
        9,
        4,
        112,
        221,
        77
      ]
    },
    {
      "name": "executeDelayFailEvent",
      "discriminator": [
        104,
        167,
        210,
        5,
        103,
        244,
        153,
        200
      ]
    },
    {
      "name": "executeDelaySuccessEvent",
      "discriminator": [
        181,
        173,
        187,
        29,
        100,
        48,
        131,
        81
      ]
    },
    {
      "name": "riskApprovalPushEvent",
      "discriminator": [
        191,
        175,
        124,
        80,
        77,
        96,
        44,
        78
      ]
    },
    {
      "name": "riskLockEvent",
      "discriminator": [
        207,
        224,
        26,
        12,
        212,
        240,
        240,
        45
      ]
    },
    {
      "name": "riskRejectEvent",
      "discriminator": [
        171,
        79,
        59,
        64,
        191,
        55,
        30,
        59
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "authNotAllowed",
      "msg": "No authority"
    },
    {
      "code": 6001,
      "name": "paramsError",
      "msg": "Params error"
    },
    {
      "code": 6002,
      "name": "insufficeientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6003,
      "name": "cacluteError",
      "msg": "Caclute error"
    },
    {
      "code": 6004,
      "name": "feeWithdrawerWrong",
      "msg": "Feewithdrawer wrong"
    },
    {
      "code": 6005,
      "name": "proxyExecuteError",
      "msg": "Proxy execute error"
    },
    {
      "code": 6006,
      "name": "outOfLength",
      "msg": "Index out of length"
    },
    {
      "code": 6007,
      "name": "cannotChangeOwner",
      "msg": "Can not change owner"
    },
    {
      "code": 6008,
      "name": "hashNotEqual",
      "msg": "Hash not equal"
    },
    {
      "code": 6009,
      "name": "notEnoughSignatures",
      "msg": "Not enough signatures"
    },
    {
      "code": 6010,
      "name": "signatureError",
      "msg": "Signatures error"
    },
    {
      "code": 6011,
      "name": "transactionNoWallet",
      "msg": "Transaction should have wallet account"
    },
    {
      "code": 6012,
      "name": "nonceWrong",
      "msg": "Wrong nonce"
    },
    {
      "code": 6013,
      "name": "managerNotBeEmpty",
      "msg": "Managers can not be empty"
    },
    {
      "code": 6014,
      "name": "lockAccountNotExecutable",
      "msg": "Lock account exector can executable"
    }
  ],
  "types": [
    {
      "name": "accountPassFilter",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "inList",
            "fields": [
              {
                "vec": "pubkey"
              }
            ]
          },
          {
            "name": "notInList",
            "fields": [
              {
                "vec": "pubkey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "accountPassTokenFilter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "inOrNot",
            "type": {
              "defined": {
                "name": "inOrNot"
              }
            }
          },
          {
            "name": "list",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "token",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "accountStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "normal"
          },
          {
            "name": "delay",
            "fields": [
              "u32"
            ]
          },
          {
            "name": "locked"
          }
        ]
      }
    },
    {
      "name": "addExecutorsEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "executors",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "addManagersEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "managers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "addRuleEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "rules",
            "type": {
              "vec": {
                "defined": {
                  "name": "rule"
                }
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "approvalParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": "bytes"
          },
          {
            "name": "hashs",
            "type": {
              "vec": {
                "array": [
                  "u8",
                  64
                ]
              }
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "balanceType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "lamports"
          },
          {
            "name": "token"
          }
        ]
      }
    },
    {
      "name": "callProgramFilter",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "inList",
            "fields": [
              {
                "vec": "pubkey"
              }
            ]
          },
          {
            "name": "notInList",
            "fields": [
              {
                "vec": "pubkey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "changeAutoLockEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "enableAutoLock",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "changeExecutorsEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "executors",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "changeManagersEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "managers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "changeRuleEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "rules",
            "type": {
              "vec": {
                "defined": {
                  "name": "rule"
                }
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "changeStatusEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "accountStatus"
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "changeStatusParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "accountStatus"
              }
            }
          }
        ]
      }
    },
    {
      "name": "changeThresholdEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "configInitParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeTransaction",
            "type": "u64"
          },
          {
            "name": "feeCreate",
            "type": "u64"
          },
          {
            "name": "withdrawers",
            "type": {
              "vec": {
                "defined": {
                  "name": "feeWithdrawer"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "configState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeTransaction",
            "type": "u64"
          },
          {
            "name": "feeCreate",
            "type": "u64"
          },
          {
            "name": "delayExecutor",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "lockPubkey",
            "docs": [
              "use to lock account when execute with trigger lock"
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "createEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "custody",
            "type": "pubkey"
          },
          {
            "name": "executors",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "managers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "accountStatus"
              }
            }
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "name",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "createParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "accountStatus"
              }
            }
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "enableAutoLock",
            "type": "bool"
          },
          {
            "name": "executorNum",
            "type": "u8"
          },
          {
            "name": "userAdminsNum",
            "type": "u8"
          },
          {
            "name": "name",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "custodyAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rules",
            "type": {
              "vec": {
                "defined": {
                  "name": "rule"
                }
              }
            }
          },
          {
            "name": "executors",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "managers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "delayTransactions",
            "type": {
              "vec": {
                "defined": {
                  "name": "delayTransaction"
                }
              }
            }
          },
          {
            "name": "needApprovalTransactions",
            "type": {
              "vec": {
                "defined": {
                  "name": "needApprovalTransaction"
                }
              }
            }
          },
          {
            "name": "approvalNonce",
            "type": {
              "array": [
                "u64",
                5
              ]
            }
          },
          {
            "name": "delayNonce",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "accountStatus"
              }
            }
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "enableAutoLock",
            "type": "bool"
          },
          {
            "name": "seedsNonce",
            "type": "u64"
          },
          {
            "name": "bumps",
            "type": "u8"
          },
          {
            "name": "walletBumps",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "delExecutorsEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "executors",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "delManagersEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "managers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "delRuleEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "rules",
            "type": {
              "vec": {
                "defined": {
                  "name": "rule"
                }
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "delayPushEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "executeAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "delayTransaction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "executeAt",
            "type": "i64"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "executeApprovalFailEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": {
              "array": [
                "u64",
                5
              ]
            }
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "executeApprovalSuccessEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": {
              "array": [
                "u64",
                5
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "executeDelayFailEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "errorCode",
            "type": "u64"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "executeDelaySuccessEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "executorChangeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "executorNum",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feeWithdrawer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rate",
            "type": "u64"
          },
          {
            "name": "withdrawer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "fillterType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "wallet",
            "fields": [
              {
                "defined": {
                  "name": "walletFilter"
                }
              }
            ]
          },
          {
            "name": "token",
            "fields": [
              {
                "defined": {
                  "name": "tokenFilter"
                }
              }
            ]
          },
          {
            "name": "callProgram",
            "fields": [
              {
                "defined": {
                  "name": "callProgramFilter"
                }
              }
            ]
          },
          {
            "name": "accountPass",
            "fields": [
              {
                "defined": {
                  "name": "accountPassFilter"
                }
              }
            ]
          },
          {
            "name": "accountPassToken",
            "fields": [
              {
                "defined": {
                  "name": "accountPassTokenFilter"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "inOrNot",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "in"
          },
          {
            "name": "notIn"
          }
        ]
      }
    },
    {
      "name": "managerChangeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "managerNum",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "needApprovalTransaction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "riskApprovalPushEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "riskLockEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "riskRejectEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "rule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fillter",
            "type": {
              "defined": {
                "name": "fillterType"
              }
            }
          },
          {
            "name": "ruleType",
            "type": {
              "defined": {
                "name": "ruleType"
              }
            }
          },
          {
            "name": "triggerType",
            "type": {
              "defined": {
                "name": "triggerType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "ruleChangeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rules",
            "type": {
              "vec": {
                "defined": {
                  "name": "rule"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "ruleType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "effect"
          },
          {
            "name": "transferAmount",
            "fields": [
              {
                "defined": {
                  "name": "transferAmountRule"
                }
              }
            ]
          },
          {
            "name": "transferFreq",
            "fields": [
              {
                "defined": {
                  "name": "transferFreqRule"
                }
              }
            ]
          },
          {
            "name": "transferTimes",
            "fields": [
              {
                "defined": {
                  "name": "transferFreqTimesRule"
                }
              }
            ]
          },
          {
            "name": "transactionParams",
            "fields": [
              {
                "defined": {
                  "name": "transactionParamsRule"
                }
              }
            ]
          },
          {
            "name": "transactionTimes",
            "fields": [
              {
                "defined": {
                  "name": "transactionInvokeTimesRule"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "tokenFilter",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "inList",
            "fields": [
              {
                "vec": "pubkey"
              }
            ]
          },
          {
            "name": "notInList",
            "fields": [
              {
                "vec": "pubkey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "transactionByteRule",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "equal",
            "fields": [
              "bytes"
            ]
          },
          {
            "name": "between",
            "fields": [
              "bytes",
              "bytes"
            ]
          }
        ]
      }
    },
    {
      "name": "transactionInvokeTimesRule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "interval",
            "type": "i64"
          },
          {
            "name": "timeSlot",
            "type": "i64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "thresholdAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "transactionParamsRule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "u32"
          },
          {
            "name": "to",
            "type": "u32"
          },
          {
            "name": "isHitTrigger",
            "type": "bool"
          },
          {
            "name": "byteRule",
            "type": {
              "defined": {
                "name": "transactionByteRule"
              }
            }
          }
        ]
      }
    },
    {
      "name": "transferAmountRule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "balanceType",
            "type": {
              "defined": {
                "name": "balanceType"
              }
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "transferDirection",
            "type": {
              "defined": {
                "name": "transferType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "transferFreqRule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "balanceType",
            "type": {
              "defined": {
                "name": "balanceType"
              }
            }
          },
          {
            "name": "transferDirection",
            "type": {
              "defined": {
                "name": "transferType"
              }
            }
          },
          {
            "name": "interval",
            "type": "i64"
          },
          {
            "name": "timeSlot",
            "type": "i64"
          },
          {
            "name": "amount",
            "type": "u128"
          },
          {
            "name": "thresholdAmount",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "transferFreqTimesRule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "balanceType",
            "type": {
              "defined": {
                "name": "balanceType"
              }
            }
          },
          {
            "name": "transferDirection",
            "type": {
              "defined": {
                "name": "transferType"
              }
            }
          },
          {
            "name": "interval",
            "type": "i64"
          },
          {
            "name": "timeSlot",
            "type": "i64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "thresholdAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "transferType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "from"
          },
          {
            "name": "to"
          }
        ]
      }
    },
    {
      "name": "triggerType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "lock"
          },
          {
            "name": "approval"
          },
          {
            "name": "reject"
          }
        ]
      }
    },
    {
      "name": "walletFilter",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "withdrawerConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeWithdrawer",
            "type": {
              "vec": {
                "defined": {
                  "name": "feeWithdrawer"
                }
              }
            }
          }
        ]
      }
    }
  ]
};
