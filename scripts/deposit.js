const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";
  const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
  const NEXAID_ADDRESS = "0xD033a003775edBe80CE0A121816d341D178C3De7";

  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const vault = await ethers.getContractAt("Vault", VAULT_ADDRESS);
  const nexa = await ethers.getContractAt("MockNexaID", NEXAID_ADDRESS);

  console.log("=== DEBUG INFO ===");
  console.log("Deployer:", deployer.address);
  
  // Check NexaID verification
  const verified = await nexa.verified(deployer.address);
  console.log("Verified in NexaID:", verified);
  
  if (!verified) {
    console.log("Setting verification...");
    await nexa.setUser(deployer.address, true, 850);
    console.log("✅ Verified!");
  }
  
  // Check USDC balance
  const balance = await usdc.balanceOf(deployer.address);
  console.log("USDC Balance:", ethers.formatUnits(balance, 6));
  
  // Check allowance
  const allowance = await usdc.allowance(deployer.address, VAULT_ADDRESS);
  console.log("Allowance:", ethers.formatUnits(allowance, 6));
  
  if (allowance === 0n) {
    console.log("Approving USDC...");
    const approveTx = await usdc.approve(VAULT_ADDRESS, ethers.MaxUint256);
    await approveTx.wait();
    console.log("✅ Approved!");
  }
  
  // Check vault state
  const paused = await vault.paused();
  console.log("Vault Paused:", paused);
  
  const aaveEnabled = await vault.aaveEnabled();
  console.log("AAVE Enabled:", aaveEnabled);
  
  // Try deposit
  const depositAmount = ethers.parseUnits("100", 6);
  console.log(`\nDepositing ${ethers.formatUnits(depositAmount, 6)} USDC...`);
  
  try {
    const tx = await vault.deposit(depositAmount);
    await tx.wait();
    console.log("✅ Deposit successful!");
    
    const newBalance = await vault.balances(deployer.address);
    console.log("Vault Balance:", ethers.formatUnits(newBalance, 6));
  } catch (error) {
    console.log("Deposit failed:", error.message);
  }
}

main().catch(console.error);