// Your deployment script for the new VRF v2 contract
const hre = require("hardhat");
const {ethers} = require("hardhat");

async function main() {
  // Sepolia VRF v2 configuration
  const LINK_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia LINK address
  const VRF_WRAPPER = "0xab18414CD93297B0d12ac29E63Ca20f515b3DB46"; // Sepolia VRF v2 Wrapper address
  
  console.log("Deploying contract with the following parameters:");
  console.log(`LINK_TOKEN: ${LINK_TOKEN}`);
  console.log(`VRF_WRAPPER: ${VRF_WRAPPER}`);

  // Get the contract factory and deploy the contract
  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(LINK_TOKEN, VRF_WRAPPER);

  // Wait for the deployment to be mined
  await lottery.waitForDeployment();

  console.log(`Lottery contract deployed to: ${lottery.target}`);
}

// Call the main function and catch any errors
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });