const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const myAddress = deployer.address;
  
  console.log("============================================");
  console.log("Getting AAVE USDC on Sepolia");
  console.log("============================================");
  console.log("Wallet:", myAddress);
  
  // AAVE USDC address (official)
  const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
  
  // Method 1: Try to get from AAVE Pool
  const POOL_ADDRESS = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
  const poolAbi = ["function faucet(address asset, uint256 amount) external"];
  
  try {
    const pool = new ethers.Contract(POOL_ADDRESS, poolAbi, deployer);
    const amount = ethers.parseUnits("10000", 6);
    console.log("\nTrying AAVE Pool faucet...");
    const tx = await pool.faucet(USDC_ADDRESS, amount);
    await tx.wait();
    console.log("✅ Got 10000 USDC from AAVE Pool!");
    
    // Check balance
    const usdcAbi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
    const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, deployer);
    const balance = await usdc.balanceOf(myAddress);
    const decimals = await usdc.decimals();
    console.log(`Balance: ${ethers.formatUnits(balance, decimals)} USDC`);
    
  } catch (error) {
    console.log("AAVE Pool faucet failed:", error.message);
    console.log("\n⚠️ AAVE testnet faucet is currently broken.");
    console.log("Recommendation: Use Base Sepolia instead.");
  }
}

main().catch(console.error);