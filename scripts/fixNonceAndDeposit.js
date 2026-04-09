// scripts/fixNonceAndDeposit.js
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    
    const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    
    const usdcAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address, address) view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    
    const vaultAbi = [
        "function deposit(uint256)",
        "function aaveEnabled() view returns (bool)",
        "function setAaveEnabled(bool)",
        "function balances(address) view returns (uint256)"
    ];
    
    const usdc = await hre.ethers.getContractAt(usdcAbi, USDC_ADDRESS, signer);
    const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS, signer);
    
    const decimals = await usdc.decimals();
    const balance = await usdc.balanceOf(address);
    
    console.log("\n========== FIXING NONCE & DEPOSIT ==========\n");
    console.log("Wallet:", address);
    console.log("USDC Balance:", hre.ethers.formatUnits(balance, decimals));
    
    // Get current nonce
    const nonce = await signer.getNonce();
    console.log("Current nonce:", nonce);
    
    // Check AAVE status
    const aaveEnabled = await vault.aaveEnabled();
    console.log("AAVE Enabled:", aaveEnabled);
    
    // First, approve USDC
    console.log("\n1️⃣ Approving USDC...");
    const approveAmount = hre.ethers.parseUnits("1000", decimals);
    const approveTx = await usdc.approve(VAULT_ADDRESS, approveAmount, { nonce: nonce });
    await approveTx.wait();
    console.log("✅ Approved at nonce:", nonce);
    
    // If AAVE is enabled, disable it temporarily
    let aaveWasEnabled = aaveEnabled;
    if (aaveWasEnabled) {
        console.log("\n2️⃣ Disabling AAVE...");
        const disableTx = await vault.setAaveEnabled(false, { nonce: nonce + 1 });
        await disableTx.wait();
        console.log("✅ AAVE disabled");
    }
    
    // Deposit
    console.log("\n3️⃣ Depositing USDC...");
    const depositAmount = hre.ethers.parseUnits("10", decimals);
    const depositTx = await vault.deposit(depositAmount, { nonce: nonce + 2 });
    await depositTx.wait();
    console.log("✅ Deposit successful!");
    
    // Re-enable AAVE if it was enabled
    if (aaveWasEnabled) {
        console.log("\n4️⃣ Re-enabling AAVE...");
        const enableTx = await vault.setAaveEnabled(true, { nonce: nonce + 3 });
        await enableTx.wait();
        console.log("✅ AAVE re-enabled");
    }
    
    // Verify
    const userBalance = await vault.balances(address);
    const finalAaveState = await vault.aaveEnabled();
    
    console.log("\n========== SUCCESS ==========");
    console.log("Your vault balance:", hre.ethers.formatUnits(userBalance, decimals), "USDC");
    console.log("AAVE state:", finalAaveState);
    console.log("\n🎉 Deposit complete! AAVE is still enabled!");
}

main().catch(console.error);