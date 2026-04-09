const { ethers } = require("hardhat");
require("dotenv").config();

// VAULT_ADDRESS - .env se le raha hai, ya default value
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "YOUR_VAULT_ADDRESS_HERE";

// 🔥 BASE SEPOLIA USDC ADDRESS (faucet wala)
const AAVE_USDC = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";

const erc20Abi = [
  "function approve(address spender, uint amount) returns (bool)",
  "function balanceOf(address account) view returns (uint)",
  "function decimals() view returns (uint8)"
];

const vaultAbi = [
  "function setAaveEnabled(bool _enabled) external",
  "function aaveEnabled() view returns (bool)",
  "function totalDeposits() view returns (uint)",
];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n============================================");
  console.log("  Enabling AAVE Integration on Base Sepolia...");
  console.log("============================================");
  console.log("Wallet :", deployer.address);

  // Check if VAULT_ADDRESS is set properly
  if (VAULT_ADDRESS === "YOUR_VAULT_ADDRESS_HERE") {
    console.error("❌ VAULT_ADDRESS set nahi hai!");
    console.error("   .env mein VAULT_ADDRESS=0x... add karo");
    console.error("   Current VAULT_ADDRESS:", VAULT_ADDRESS);
    process.exit(1);
  }

  console.log("Vault Address :", VAULT_ADDRESS);

  const usdc  = new ethers.Contract(AAVE_USDC, erc20Abi, deployer);
  const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, deployer);

  // Check USDC balance
  const bal = await usdc.balanceOf(deployer.address);
  const dec = await usdc.decimals();
  console.log("USDC Balance :", ethers.formatUnits(bal, dec), "USDC");

  if (bal === 0n) {
    console.error("❌ USDC balance zero!");
    console.error("   Get USDC from: https://app.aave.com/faucet/ (Select Base Sepolia)");
    process.exit(1);
  }

  // Step 1: Vault ko USDC approve karo
  console.log("\n1️⃣  Approving Vault to spend USDC...");
  const approveTx = await usdc.approve(VAULT_ADDRESS, ethers.MaxUint256);
  await approveTx.wait();
  console.log("   ✅ Vault approved for USDC spending");

  // Step 2: AAVE enable karo
  console.log("\n2️⃣  Enabling AAVE integration...");
  const enableTx = await vault.setAaveEnabled(true);
  await enableTx.wait();
  console.log("   ✅ AAVE integration enabled!");

  // Verify
  const isEnabled = await vault.aaveEnabled();
  console.log("\n   aaveEnabled =", isEnabled);
  console.log("\n============================================");
  console.log("  AAVE is now ACTIVE on Base Sepolia!");
  console.log("  Ab deposits automatically AAVE mein supply");
  console.log("  honge aur real yield generate hoga.");
  console.log("============================================\n");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});