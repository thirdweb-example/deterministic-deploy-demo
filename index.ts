import { config } from "dotenv";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Goerli, Mumbai } from "@thirdweb-dev/chains";

config();

// chains to deploy to
const chainsToDeployTo = [Goerli, Mumbai];
// the name of the published contract to deploy ex: AccountFactory for the contract https://thirdweb.com/thirdweb.eth/AccountFactory
const publishedContractToDeploy = "AccountFactory";
// The full list of constructor arguments for the published contract (for AccountFactory we just need the Entrypoint address)
const publishedContractConstructorArguments = [
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
];

const main = async () => {
  if (!process.env.WALLET_PRIVATE_KEY) {
    throw new Error("No private key found");
  }

  try {
    for (const chain of chainsToDeployTo) {
      const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.WALLET_PRIVATE_KEY,
        chain,
        {
          secretKey: process.env.THIRDWEB_SECRET_KEY,
        }
      );
      // shows how to predict the address of any published contract
      const predictedAddress = await sdk.deployer.predictAddressDeterministic(
        publishedContractToDeploy,
        publishedContractConstructorArguments
      );
      console.log("deploying on", chain.slug, "at address:", predictedAddress);

      // shows how to deploy a published contract at a deterministic address
      const deployedAddress =
        await sdk.deployer.deployPublishedContractDeterministic(
          publishedContractToDeploy,
          publishedContractConstructorArguments
        );
      console.log(
        "--> succesfully deployed on",
        chain.slug,
        "at address:",
        deployedAddress
      );
    }
  } catch (e) {
    console.error("Something went wrong: ", e);
  }
};

main();
