export type NET_WORK = 'Mainnet' | 'Devnet' | 'Testnet';

export const DEFAULT_NET_WORK: NET_WORK = 'Mainnet';

const mainnetEndpoint = 'https://api.mainnet-beta.solana.com'
const devnetEndpoint = 'https://api.devnet.solana.com'
const testnetEndpoint = 'https://api.testnet.solana.com'

export const getDefaultEndpoint = (network: NET_WORK) => {
    let endpoint = 'https://api.mainnet-beta.solana.com'
    if (network == 'Mainnet') {
        endpoint = mainnetEndpoint;
    } else if (network == 'Testnet') {
        endpoint = testnetEndpoint
    } else if (network == 'Devnet') {
        endpoint = devnetEndpoint
    }
    return endpoint;
}


export const ACCOUNT_SEED = "account"

export type AccountStatus =
    | { normal: {} }
    | { delay: { "0": number } }
    | { locked: {} };