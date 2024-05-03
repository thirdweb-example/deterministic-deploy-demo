import { config } from "dotenv";
import { createThirdwebClient, sendTransaction } from "thirdweb";
import { getWalletBalance, privateKeyToAccount } from "thirdweb/wallets";
import {
  computePublishedContractAddress,
  prepareDeterministicDeployTransaction,
} from "thirdweb/deploys";
import { isContractDeployed } from "thirdweb/utils";
import { sepolia, baseSepolia, optimismSepolia } from "thirdweb/chains";

config();

// chains to deploy to
const chainsToDeployTo = [sepolia, baseSepolia, optimismSepolia];

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
        account.address, // admin
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
      const result = await sendTransaction({
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
