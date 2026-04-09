// scripts/alternativeApprove.js
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    
    const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    
    // Try with different ABI that includes increaseAllowance
    const usdcAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function increaseAllowance(address spender, uint256 addedValue) returns (bool)",
        "function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    
    const usdc = await hre.ethers.getContractAt(usdcAbi, USDC_ADDRESS, signer);
    
    const decimals = await usdc.decimals();
    const balance = await usdc.balanceOf(address);
    
    console.log("Balance:", hre.ethers.formatUnits(balance, decimals));
    
    // Use increaseAllowance instead of approve
    console.log("\nUsing increaseAllowance...");
    const increaseAmount = hre.ethers.parseUnits("10000", decimals);
    
    try {
        const tx = await usdc.increaseAllowance(VAULT_ADDRESS, increaseAmount);
        await tx.wait();
        console.log("✅ Allowance increased!");
        
        const newAllowance = await usdc.allowance(address, VAULT_ADDRESS);
        console.log("New Allowance:", hre.ethers.formatUnits(newAllowance, decimals));
        
        // Now try deposit
        const vaultAbi = ["function deposit(uint256 amount)"];
        const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS, signer);
        
        const depositAmount = hre.ethers.parseUnits("10", decimals);
        const depositTx = await vault.deposit(depositAmount);
        await depositTx.wait();
        
        console.log("✅ Deposit successful!");
        
    } catch (err) {
        console.error("Failed:", err.message);
    }
}

main().catch(console.error);