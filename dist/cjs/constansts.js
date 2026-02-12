"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTRUCTION_DATA_SEED = exports.ACCOUNT_SEED = exports.getDefaultEndpoint = exports.DEFAULT_NET_WORK = void 0;
exports.DEFAULT_NET_WORK = 'Devnet';
const mainnetEndpoint = 'https://api.mainnet-beta.solana.com';
const devnetEndpoint = 'https://api.devnet.solana.com';
const testnetEndpoint = 'https://api.testnet.solana.com';
const getDefaultEndpoint = (network) => {
    let endpoint = 'https://api.mainnet-beta.solana.com';
    if (network == 'Mainnet') {
        endpoint = mainnetEndpoint;
    }
    else if (network == 'Testnet') {
        endpoint = testnetEndpoint;
    }
    else if (network == 'Devnet') {
        endpoint = devnetEndpoint;
    }
    return endpoint;
};
exports.getDefaultEndpoint = getDefaultEndpoint;
exports.ACCOUNT_SEED = "account";
exports.INSTRUCTION_DATA_SEED = "ins";
//# sourceMappingURL=constansts.js.map