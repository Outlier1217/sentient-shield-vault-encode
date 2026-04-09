// scripts/deployFixedVault.js - FINAL WORKING VERSION
const { ethers } = require("hardhat");

// ✅ Base Sepolia Addresses (lowercase)
const BASE_SEPOLIA = {
  AAVE_POOL: "0xa238dd80c259a72e81d7e4664a9801593f98d1c5",
  USDC: "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f",
  A_USDC: "0x0a1d576f3efef75b330424287a95a366e8281d54",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // ✅ Get current nonce and reset if needed
  let nonce = await deployer.getNonce();
  console.log("Current nonce:", nonce);
  
  console.log("\n============================================");
  console.log("  Sentient Shield Vault — Deploying...");
  console.log("  Network: Base Sepolia (84532)");
  console.log("============================================");
  console.log("Deployer :", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance  :", ethers.formatEther(balance), "ETH\n");

  // ✅ Gas settings
  const gasPrice = ethers.parseUnits("1.5", "gwei"); // 1.5 Gwei
  const gasLimit = 3000000;

  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "Gwei");
  console.log("Starting nonce:", nonce);

  // 1. Deploy MockNexaID
  console.log("\n1️⃣  Deploying MockNexaID...");
  const NexaID = await ethers.getContractFactory("MockNexaID");
  const nexa = await NexaID.deploy({
    nonce: nonce++,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  });
  await nexa.waitForDeployment();
  const nexaAddr = await nexa.getAddress();
  console.log("   ✅ NexaID:", nexaAddr);

  // 2. Deploy MockPair
  console.log("\n2️⃣  Deploying MockPair...");
  const Pair = await ethers.getContractFactory("MockPair");
  const pair = await Pair.deploy(BASE_SEPOLIA.USDC, {
    nonce: nonce++,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  });
  await pair.waitForDeployment();
  const pairAddr = await pair.getAddress();
  console.log("   ✅ MockPair:", pairAddr);

  // Set reserves
  const setReservesTx = await pair.setReserves(2_500_000_000n, 1_000_000_000_000_000_000n, {
    nonce: nonce++,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  });
  await setReservesTx.wait();
  console.log("   ✅ Reserves set");

  // 3. Deploy Vault — 5 constructor params
  console.log("\n3️⃣  Deploying Vault...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    BASE_SEPOLIA.USDC,       // _usdc
    nexaAddr,                // _nexaid
    pairAddr,                // _pair
    BASE_SEPOLIA.AAVE_POOL,  // _aavePool
    BASE_SEPOLIA.A_USDC,     // _aUsdc
    {
      nonce: nonce++,
      gasPrice: gasPrice,
      gasLimit: 5000000, // Higher gas for vault
    }
  );
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   ✅ Vault:", vaultAddr);

  // 4. Verify deployer in NexaID
  console.log("\n4️⃣  Verifying deployer...");
  const setUserTx = await nexa.setUser(deployer.address, true, 850, {
    nonce: nonce++,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  });
  await setUserTx.wait();
  console.log("   ✅ Deployer verified (score 850)");

  // 5. Enable AAVE
  console.log("\n5️⃣  Enabling AAVE...");
  const enableTx = await vault.setAaveEnabled(true, {
    nonce: nonce++,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  });
  await enableTx.wait();
  console.log("   ✅ AAVE enabled!");

  // 6. Summary
  console.log("\n============================================");
  console.log("  DEPLOYMENT SUMMARY — Base Sepolia");
  console.log("============================================");
  console.log("NexaID   :", nexaAddr);
  console.log("MockPair :", pairAddr);
  console.log("Vault    :", vaultAddr);
  console.log("AAVE Pool:", BASE_SEPOLIA.AAVE_POOL);
  console.log("USDC     :", BASE_SEPOLIA.USDC);
  console.log("aUSDC    :", BASE_SEPOLIA.A_USDC);
  console.log("============================================");
  console.log("\n📝 App.jsx mein update karo:");
  console.log(`const usdcAddress   = "${BASE_SEPOLIA.USDC}";`);
  console.log(`const nexaidAddress = "${nexaAddr}";`);
  console.log(`const pairAddress   = "${pairAddr}";`);
  console.log(`const vaultAddress  = "${vaultAddr}";`);
  console.log("\n✅ Deployment complete!\n");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});