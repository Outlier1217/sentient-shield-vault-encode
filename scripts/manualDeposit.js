// scripts/manualDeposit.js
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    
    const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    
    const usdcAbi = [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ];
    
    const vaultAbi = [
        "function deposit(uint256 amount)"
    ];
    
    const usdc = await hre.ethers.getContractAt(usdcAbi, USDC_ADDRESS, signer);
    const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS, signer);
    
    const decimals = await usdc.decimals();
    const balance = await usdc.balanceOf(address);
    const allowance = await usdc.allowance(address, VAULT_ADDRESS);
    
    console.log("USDC Balance:", hre.ethers.formatUnits(balance, decimals));
    console.log("Allowance:", hre.ethers.formatUnits(allowance, decimals));
    
    // Deposit 10 USDC
    const depositAmount = hre.ethers.parseUnits("10", decimals);
    
    if (balance < depositAmount) {
        console.log(`❌ Insufficient balance! Need ${hre.ethers.formatUnits(depositAmount, decimals)} USDC`);
        console.log(`Current balance: ${hre.ethers.formatUnits(balance, decimals)} USDC`);
        return;
    }
    
    if (allowance < depositAmount) {
        console.log("❌ Insufficient allowance! Run manualApprove.js first");
        return;
    }
    
    console.log("\nDepositing 10 USDC to vault...");
    try {
        const tx = await vault.deposit(depositAmount);
        await tx.wait();
        console.log("✅ Deposit successful!");
        console.log("TX Hash:", tx.hash);
    } catch (err) {
        console.error("❌ Deposit failed:", err.message);
        
        // Try to get more details
        try {
            await vault.deposit.staticCall(depositAmount);
        } catch (staticErr) {
            console.log("Static call error:", staticErr.message);
        }
    }
}

main().catch(console.error);