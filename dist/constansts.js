export const DEFAULT_NET_WORK = 'Mainnet';
const mainnetEndpoint = 'https://api.mainnet-beta.solana.com';
const devnetEndpoint = 'https://api.devnet.solana.com';
const testnetEndpoint = 'https://api.testnet.solana.com';
export const getDefaultEndpoint = (network) => {
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
export const ACCOUNR_SEED = "account";
