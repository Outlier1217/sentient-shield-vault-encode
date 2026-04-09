// scripts/fixAllowanceAndDeposit.js
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    
    const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    
    const usdcAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)"
    ];
    
    const vaultAbi = [
        "function deposit(uint256 amount)"
    ];
    
    const usdc = await hre.ethers.getContractAt(usdcAbi, USDC_ADDRESS, signer);
    const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS, signer);
    
    const decimals = await usdc.decimals();
    const balance = await usdc.balanceOf(address);
    const currentAllowance = await usdc.allowance(address, VAULT_ADDRESS);
    
    console.log("\n========== CURRENT STATE ==========");
    console.log("Your USDC Balance:", hre.ethers.formatUnits(balance, decimals));
    console.log("Current Allowance:", hre.ethers.formatUnits(currentAllowance, decimals));
    
    // Reset allowance to 0 first
    console.log("\n1️⃣ Resetting allowance to 0...");
    const resetTx = await usdc.approve(VAULT_ADDRESS, 0);
    await resetTx.wait();
    console.log("✅ Allowance reset to 0");
    
    // Approve a larger amount
    const approveAmount = hre.ethers.parseUnits("10000", decimals);
    console.log("\n2️⃣ Approving 10000 USDC...");
    const approveTx = await usdc.approve(VAULT_ADDRESS, approveAmount);
    await approveTx.wait();
    console.log("✅ Approved!");
    
    // Verify new allowance
    const newAllowance = await usdc.allowance(address, VAULT_ADDRESS);
    console.log("New Allowance:", hre.ethers.formatUnits(newAllowance, decimals));
    
    // Test transferFrom directly
    console.log("\n3️⃣ Testing transferFrom directly...");
    const testAmount = hre.ethers.parseUnits("10", decimals);
    
    try {
        const testTransfer = await usdc.transferFrom(address, VAULT_ADDRESS, testAmount);
        await testTransfer.wait();
        console.log("✅ transferFrom works!");
        
        // Now try deposit
        console.log("\n4️⃣ Trying deposit...");
        const depositTx = await vault.deposit(testAmount);
        await depositTx.wait();
        console.log("✅ Deposit successful!");
        
        const newBalance = await usdc.balanceOf(address);
        const vaultBalance = await vault.balances(address);
        console.log("\n========== FINAL STATE ==========");
        console.log("Remaining USDC:", hre.ethers.formatUnits(newBalance, decimals));
        console.log("Vault Balance:", hre.ethers.formatUnits(vaultBalance, decimals));
        
    } catch (err) {
        console.error("❌ Still failing:", err.message);
        
        // Try to approve max uint256
        console.log("\n🔄 Trying with max uint256 approval...");
        const maxUint256 = hre.ethers.MaxUint256;
        const maxApproveTx = await usdc.approve(VAULT_ADDRESS, maxUint256);
        await maxApproveTx.wait();
        
        const maxAllowance = await usdc.allowance(address, VAULT_ADDRESS);
        console.log("Max Allowance:", maxAllowance.toString());
        
        // Try deposit again
        try {
            const depositTx2 = await vault.deposit(testAmount);
            await depositTx2.wait();
            console.log("✅ Deposit successful with max approval!");
        } catch (err2) {
            console.error("❌ Still failing:", err2.message);
        }
    }
}

main().catch(console.error);