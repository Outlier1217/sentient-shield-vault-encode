// scripts/deploy.js - AUTO NONCE VERSION
const { ethers } = require("hardhat");

const BASE_SEPOLIA = {
  AAVE_POOL: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  USDC: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f",
  A_USDC: "0x0a1d576f3efef75b330424287a95a366e8281d54",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Get current nonce automatically.
  let nonce = await deployer.getNonce();
  
  console.log("\n============================================");
  console.log("  🚀 Sentient Shield Vault Deployment");
  console.log("  Network: Base Sepolia (84532)");
  console.log("============================================");
  console.log("📡 Deployer:", deployer.address);
  console.log("🔢 Starting Nonce:", nonce);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

  const gasPrice = ethers.parseUnits("1.5", "gwei");
  const gasLimit = 3000000;

  // 1. Deploy MockNexaID
  console.log("1️⃣ Deploying MockNexaID...");
  const NexaID = await ethers.getContractFactory("MockNexaID");
  const nexa = await NexaID.deploy({ gasPrice, gasLimit, nonce: nonce++ });
  await nexa.waitForDeployment();
  const nexaAddress = await nexa.getAddress();
  console.log("   ✅", nexaAddress);
  console.log("   Nonce used:", nonce - 1);

  // 2. Deploy MockPair
  console.log("\n2️⃣ Deploying MockPair...");
  const Pair = await ethers.getContractFactory("MockPair");
  const pair = await Pair.deploy(BASE_SEPOLIA.USDC, { gasPrice, gasLimit, nonce: nonce++ });
  await pair.waitForDeployment();
  const pairAddress = await pair.getAddress();
  console.log("   ✅", pairAddress);
  console.log("   Nonce used:", nonce - 1);
  
  // Set reserves
  const reserve0 = ethers.parseUnits("2500", 6);
  const reserve1 = ethers.parseUnits("1", 18);
  const setReservesTx = await pair.setReserves(reserve0, reserve1, { 
    gasPrice, 
    gasLimit: gasLimit, 
    nonce: nonce++ 
  });
  await setReservesTx.wait();
  console.log("   ✅ Reserves set (nonce:", nonce - 1, ")");

  // 3. Deploy Vault
  console.log("\n3️⃣ Deploying Vault (Fixed Version)...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    BASE_SEPOLIA.USDC,
    nexaAddress,
    pairAddress,
    BASE_SEPOLIA.AAVE_POOL,
    BASE_SEPOLIA.A_USDC,
    { gasPrice, gasLimit: 5000000, nonce: nonce++ }
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("   ✅ Vault deployed at:", vaultAddress);
  console.log("   Nonce used:", nonce - 1);

  // 4. Setup: Verify deployer
  console.log("\n4️⃣ Setting up NexaID...");
  const setUserTx = await nexa.setUser(deployer.address, true, 850, { 
    gasPrice, 
    gasLimit, 
    nonce: nonce++ 
  });
  await setUserTx.wait();
  console.log("   ✅ Deployer verified (nonce:", nonce - 1, ")");

  // 5. Enable AAVE
  console.log("\n5️⃣ Enabling AAVE integration...");
  const enableTx = await vault.setAaveEnabled(true, { 
    gasPrice, 
    gasLimit, 
    nonce: nonce++ 
  });
  await enableTx.wait();
  console.log("   ✅ AAVE real yield ENABLED! (nonce:", nonce - 1, ")");

  // Final summary
  console.log("\n============================================");
  console.log("  ✅ DEPLOYMENT COMPLETE!");
  console.log("============================================");
  console.log("📦 Contract Addresses:");
  console.log(`   MockNexaID: ${nexaAddress}`);
  console.log(`   MockPair  : ${pairAddress}`);
  console.log(`   Vault     : ${vaultAddress}`);
  console.log("\n🔧 Configuration:");
  console.log(`   USDC      : ${BASE_SEPOLIA.USDC}`);
  console.log(`   AAVE Pool : ${BASE_SEPOLIA.AAVE_POOL}`);
  console.log(`   aUSDC     : ${BASE_SEPOLIA.A_USDC}`);
  
  console.log("\n📝 Update your App.jsx with these addresses:");
  console.log("============================================");
  console.log(`const usdcAddress   = "${BASE_SEPOLIA.USDC}";`);
  console.log(`const nexaidAddress = "${nexaAddress}";`);
  console.log(`const pairAddress   = "${pairAddress}";`);
  console.log(`const vaultAddress  = "${vaultAddress}";`);
  console.log("============================================\n");
}

main().catch((error) => {
  console.error("\n❌ Deployment failed!");
  console.error("Error:", error.message);
  if (error.message.includes("nonce")) {
    console.log("\n💡 Tip: Run this command to reset nonce:");
    console.log("   npx hardhat console --network baseSepolia");
    console.log("   Then: await (await ethers.provider.send('eth_getTransactionCount', ['YOUR_ADDRESS', 'pending']))");
  }
  process.exitCode = 1;
});