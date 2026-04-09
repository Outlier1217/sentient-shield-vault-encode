// scripts/approveVaultToAave.js
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    
    const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    const AAVE_POOL = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";
    const OWNER_ADDRESS = "0xAb06a17af1425F499E302B639c69f8ce29a967E0";
    
    const usdcAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    
    const vaultAbi = [
        "function deposit(uint256 amount)",
        "function aaveEnabled() view returns (bool)"
    ];
    
    const usdc = await hre.ethers.getContractAt(usdcAbi, USDC_ADDRESS, signer);
    const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS, signer);
    
    const decimals = await usdc.decimals();
    const vaultBalance = await usdc.balanceOf(VAULT_ADDRESS);
    
    console.log("\n========== AAVE APPROVAL FIX ==========\n");
    console.log("AAVE Enabled:", await vault.aaveEnabled());
    console.log("Vault USDC Balance:", hre.ethers.formatUnits(vaultBalance, decimals));
    
    // IMPORTANT: Vault ko approve karna hai AAVE pool ko spend karne ke liye
    // Vault ke paas USDC hai, ab vault AAVE pool ko approve karega
    console.log("\n1️⃣ Approving Vault to spend USDC on AAVE Pool...");
    
    // Vault contract ko call karna padega - iske liye vault mein function hona chahiye
    // Alternative: Directly approve from vault (requires owner to call on behalf of vault)
    
    // Method 1: Agar vault mein approveAave function hai
    const vaultWithApprove = [
        "function approveAavePool(uint256 amount) external",
        "function setAaveEnabled(bool enabled)"
    ];
    
    try {
        const fullVault = await hre.ethers.getContractAt(vaultWithApprove, VAULT_ADDRESS, signer);
        
        // Check if function exists
        if (fullVault.approveAavePool) {
            console.log("Calling vault.approveAavePool()...");
            const tx = await fullVault.approveAavePool(hre.ethers.parseUnits("100000", decimals));
            await tx.wait();
            console.log("✅ Vault approved AAVE pool!");
        } else {
            console.log("⚠️ approveAavePool function not found in vault");
            throw new Error("Function not found");
        }
    } catch (err) {
        console.log("Method 1 failed, trying Method 2...");
        
        // Method 2: Direct USDC approval from vault (requires impersonation)
        console.log("\n⚠️ Need to approve AAVE pool from vault address");
        console.log("This requires owner to execute or vault upgrade");
        
        // Method 3: Temporarily disable AAVE, deposit, then re-enable
        console.log("\n🔄 Alternative: Disable AAVE temporarily");
        
        if (address.toLowerCase() === OWNER_ADDRESS.toLowerCase()) {
            console.log("You are owner! Disabling AAVE temporarily...");
            const vaultSimple = await hre.ethers.getContractAt(["function setAaveEnabled(bool)"], VAULT_ADDRESS, signer);
            const disableTx = await vaultSimple.setAaveEnabled(false);
            await disableTx.wait();
            console.log("✅ AAVE disabled temporarily");
            
            // Now deposit
            console.log("\n2️⃣ Depositing without AAVE...");
            const depositAmount = hre.ethers.parseUnits("10", decimals);
            const vaultDeposit = await hre.ethers.getContractAt(["function deposit(uint256)"], VAULT_ADDRESS, signer);
            const depositTx = await vaultDeposit.deposit(depositAmount);
            await depositTx.wait();
            console.log("✅ Deposit successful!");
            
            // Re-enable AAVE
            console.log("\n3️⃣ Re-enabling AAVE...");
            const enableTx = await vaultSimple.setAaveEnabled(true);
            await enableTx.wait();
            console.log("✅ AAVE re-enabled!");
            
            console.log("\n🎉 Done! AAVE is enabled AND you have deposited!");
        } else {
            console.log("\n❌ Need owner to run this script or fix AAVE pool approval.");
            console.log("Owner address:", OWNER_ADDRESS);
        }
    }
}

main().catch(console.error);