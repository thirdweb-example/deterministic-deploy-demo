import { config } from "dotenv";
import {
  createThirdwebClient,
  defineChain,
  sendAndConfirmTransaction,
} from "thirdweb";
import { getWalletBalance, privateKeyToAccount } from "thirdweb/wallets";
import {
  computePublishedContractAddress,
  prepareDeterministicDeployTransaction,
} from "thirdweb/deploys";
import { isContractDeployed } from "thirdweb/utils";

config();

const SUPPORTED_TESTNETS: number[] = [
  97, // binance-testnet
  11155111, // sepolia
  80002, // polygon-amoy
  84532, // base-sepolia
  11155420, // optimism-sepolia
  421614, // arbitrum-sepolia
  59141, // linea-sepolia
  44787, // celo-alfajores-testnet
  37714555429, // xai-sepolia
  43113, // avalanche-fuji
  10200, // chiado-testnet
  534351, // scroll-sepolia-testnet
  167009, // taiko-hekla-l2
  999999999, // zora-sepolia-testnet
  919, // mode-testnet
  2522, // frax-testnet
  4202, // lisk-testnet
  28122024, // ancient8-testnet
  335, // dfk-testnet
  1001, // klaytn-baobab
  168587773, // blast-sepolia
  132902, // form-testnet
  111557560, // cyber-testnet
  90354, // camp-network
  978657, // treasure-ruby
  17069, // garnet-holesky (redstone testnet)
  1993, // b3-sepolia
  161221135, // plume-testnet
  5003, // mantle-sepolia-testnet
];

const SUPPORTED_MAINNETS: number[] = [
  1, // ethereum
  137, // polygon
  42161, // arbitrum
  10, // optimism
  42220, // celo
  8453, // base
  59144, // linea
  43114, // avalanche
  534352, // scroll
  100, // gnosis
  56, // binance
  660279, // xai
  7777777, // zora
  34443, // mode
  252, // frax
  42170, // arbitrum nova
  888888888, // ancient8
  53935, // dfk
  8217, // klaytn-cypress
  204, // opbnb
  22222, // nautilus
  122, // fuse
  252, // fraxtal
  7887, // kinto
  957, // lyra
  5000, // mantle
  666666666, // degen
  7560, // cyber
  690, // redstone
];

// chains to deploy to
const chainsToDeployTo = [...SUPPORTED_MAINNETS, ...SUPPORTED_TESTNETS].map(
  (id) => defineChain(id)
);

if (!process.env.WALLET_PRIVATE_KEY) {
  throw new Error("No private key found");
}

if (!process.env.THIRDWEB_SECRET_KEY) {
  throw new Error("No thirdweb secret key found");
}

const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

const account = privateKeyToAccount({
  client,
  privateKey: process.env.WALLET_PRIVATE_KEY!,
});

const TW_DEPLOYER_WALLET = "0xdd99b75f095d0c4d5112aCe938e4e6ed962fb024";

const main = async () => {
  console.log("Deploying contracts with account:", account.address);
  for (const chain of chainsToDeployTo) {
    const params = {
      client,
      chain,
      // the name of the published contract to deploy ex: AccountFactory for the contract https://thirdweb.com/thirdweb.eth/AccountFactory
      contractId: "AccountFactory",
      // The full list of constructor arguments for the published contract (for AccountFactory we just need the admin and Entrypoint address)
      constructorParams: [
        TW_DEPLOYER_WALLET, // admin
        "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // entrypoint address
      ],
    };

    console.log("----------");
    console.log(
      "Checking contract deployment on chain:",
      chain.name || chain.id
    );
    const balance = await getWalletBalance({
      client,
      address: account.address,
      chain,
    });
    console.log("Balance:", balance.displayValue, balance.symbol);
    // predict the address before deployement
    const predictedAddress = await computePublishedContractAddress(params);

    const isDeployed = await isContractDeployed({
      chain,
      client,
      address: predictedAddress,
    });

    if (isDeployed) {
      console.log("Already deployed at address:", predictedAddress);
      continue;
    }

    console.log(
      "Deploying on",
      chain.name || chain.id,
      "at address:",
      predictedAddress
    );

    try {
      // prepare the deterministic deploy transaction
      const transaction = prepareDeterministicDeployTransaction(params);
      // send the transaction
      const result = await sendAndConfirmTransaction({
        account,
        transaction,
      });
      console.log(">>> Succesfully deployed at address:", predictedAddress);
      console.log(">>> Transaction hash:", result.transactionHash);
    } catch (e) {
      console.error("Something went wrong, skipping chain", e);
    }
  }
};

main();
