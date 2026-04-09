// scripts/deployNexa.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MockNexaID...");

  const Nexa = await hre.ethers.getContractFactory("MockNexaID");
  const nexa = await Nexa.deploy();
  await nexa.waitForDeployment();

  const address = await nexa.getAddress();
  console.log("✅ NexaID deployed to:", address);
  
  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer (Owner):", deployer.address);
  
  console.log("\n📋 Usage:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Users can self-verify with:");
  console.log(`  await nexa.verifyMe();`);
  console.log("  or");
  console.log(`  await nexa.selfVerify(750);`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});