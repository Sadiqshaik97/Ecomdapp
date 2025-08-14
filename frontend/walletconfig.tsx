import { PetraWallet } from "petra-plugin-wallet-adapter";
import { Network } from "@aptos-labs/ts-sdk";

const wallet = new PetraWallet();

export const wallets = [wallet];

export const APTOS_TESTNET_NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
export const APTOS_TESTNET_FAUCET_URL = "https://faucet.testnet.aptoslabs.com";

export const network = Network.TESTNET;