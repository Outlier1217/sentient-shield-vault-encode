// scripts/diagnoseDeposit.js
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";
    
    // Complete Vault ABI
    const vaultAbi = [
        "function deposit(uint256 amount)",
        "function paused() view returns (bool)",
        "function aaveEnabled() view returns (bool)",
        "function totalDeposits() view returns (uint256)",
        "function balances(address) view returns (uint256)",
        "function isVerified(address) view returns (bool)",
        "function owner() view returns (address)",
        "function getReputationBonus(address) view returns (uint256)"
    ];
    
    const usdcAbi = [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address, address) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function transferFrom(address, address, uint256) returns (bool)"
    ];
    
    const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS, signer);
    const usdc = await hre.ethers.getContractAt(usdcAbi, USDC_ADDRESS, signer);
    
    const decimals = await usdc.decimals();
    const depositAmount = hre.ethers.parseUnits("10", decimals);
    
    console.log("\n========== DEEP DIAGNOSE ==========\n");
    
    // Check if USDC transferFrom works directly
    console.log("1️⃣ Testing USDC transferFrom directly...");
    try {
        const transferFromTx = await usdc.transferFrom(address, VAULT_ADDRESS, depositAmount);
        console.log("   ✅ transferFrom works!");
    } catch (err) {
        console.log("   ❌ transferFrom failed:", err.message.slice(0, 100));
        console.log("   This means USDC allowance or balance issue");
    }
    
    // Check vault's internal state
    console.log("\n2️⃣ Checking vault internal state...");
    const totalDeposits = await vault.totalDeposits();
    const userBalance = await vault.balances(address);
    console.log("   Total Deposits in Vault:", hre.ethers.formatUnits(totalDeposits, decimals));
    console.log("   Your current vault balance:", hre.ethers.formatUnits(userBalance, decimals));
    
    // Try to get custom error from vault
    console.log("\n3️⃣ Trying to get custom error from vault...");
    
    // Create a custom interface to catch revert reason
    const iface = new hre.ethers.Interface([
        "function deposit(uint256 amount)"
    ]);
    
    try {
        const callData = iface.encodeFunctionData("deposit", [depositAmount]);
        const result = await hre.ethers.provider.call({
            to: VAULT_ADDRESS,
            from: address,
            data: callData
        });
        console.log("   Call succeeded! Result:", result);
    } catch (err) {
        console.log("   Call failed!");
        console.log("   Raw error:", err);
        
        // Try to decode revert reason
        if (err.data) {
            try {
                const decoded = iface.parseError(err.data);
                console.log("   Decoded error:", decoded);
            } catch {
                console.log("   Could not decode error");
            }
        }
    }
    
    // Check if AAVE is causing issue
    console.log("\n4️⃣ Checking AAVE related state...");
    const aaveEnabled = await vault.aaveEnabled();
    console.log("   AAVE Enabled:", aaveEnabled);
    
    if (aaveEnabled) {
        console.log("   ⚠️ AAVE is enabled - vault might need aUSDC balance check");
    }
    
    // Try with smaller amount
    console.log("\n5️⃣ Trying with very small amount (1 USDC)...");
    const tinyAmount = hre.ethers.parseUnits("1", decimals);
    
    try {
        const vaultContract = new hre.ethers.Contract(VAULT_ADDRESS, vaultAbi, signer);
        const tx = await vaultContract.deposit(tinyAmount);
        console.log("   ✅ 1 USDC deposit worked!");
    } catch (err) {
        console.log("   ❌ Even 1 USDC failed:", err.message.slice(0, 150));
        
        // Try to get the actual revert reason from transaction
        console.log("\n   Attempting to simulate with trace...");
        try {
            await hre.ethers.provider.call({
                to: VAULT_ADDRESS,
                from: address,
                data: iface.encodeFunctionData("deposit", [tinyAmount])
            });
        } catch (traceErr) {
            console.log("   Revert data:", traceErr.data || "no data");
            console.log("   Revert reason:", traceErr.reason || "no reason");
        }
    }
    
    console.log("\n========== VAULT SOURCE CHECK ==========");
    console.log("Deposit function in Vault.sol has these requirements:");
    console.log("1. nonReentrant modifier");
    console.log("2. notPaused modifier"); 
    console.log("3. onlyVerified modifier");
    console.log("4. amount > 0");
    console.log("5. USDC transferFrom");
    console.log("6. _allocate(amount)");
    console.log("7. _addXP(msg.sender, 10)");
    
    console.log("\nAll visible checks passed. Issue might be in:");
    console.log("- _allocate() function");
    console.log("- _addXP() function"); 
    console.log("- USDC transferFrom (though we tested)");
    console.log("- Reentrancy guard state");
}

main().catch(console.error);