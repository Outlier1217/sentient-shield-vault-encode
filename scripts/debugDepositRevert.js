// scripts/debugDepositRevert.js
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    const NEXAID_ADDRESS = "0xD033a003775edBe80CE0A121816d341D178C3De7";
    const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";
    
    // Vault ABI with all view functions
    const vaultAbi = [
        "function paused() view returns (bool)",
        "function isVerified(address) view returns (bool)",
        "function balances(address) view returns (uint256)",
        "function totalDeposits() view returns (uint256)",
        "function aaveEnabled() view returns (bool)",
        "function owner() view returns (address)"
    ];
    
    const nexaidAbi = [
        "function verify(address) view returns (bool)",
        "function getScore(address) view returns (uint256)"
    ];
    
    const usdcAbi = [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address, address) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    
    const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS, signer);
    const nexaid = await hre.ethers.getContractAt(nexaidAbi, NEXAID_ADDRESS, signer);
    const usdc = await hre.ethers.getContractAt(usdcAbi, USDC_ADDRESS, signer);
    
    const decimals = await usdc.decimals();
    
    console.log("\n========== DEBUGGING DEPOSIT FAILURE ==========\n");
    
    // Check 1: Paused status
    const paused = await vault.paused();
    console.log("1️⃣ Contract Paused:", paused);
    if (paused) console.log("   ❌ Contract is PAUSED! Unpause first.");
    else console.log("   ✅ Contract is active");
    
    // Check 2: NexaID verification
    const isVerified = await nexaid.verify(address);
    const score = await nexaid.getScore(address);
    console.log("\n2️⃣ NexaID Status:");
    console.log("   Verified:", isVerified);
    console.log("   Score:", score.toString());
    if (!isVerified) console.log("   ❌ NOT VERIFIED! This is likely the issue.");
    else console.log("   ✅ Verified");
    
    // Check 3: USDC Balance and Allowance
    const balance = await usdc.balanceOf(address);
    const allowance = await usdc.allowance(address, VAULT_ADDRESS);
    console.log("\n3️⃣ USDC Status:");
    console.log("   Balance:", hre.ethers.formatUnits(balance, decimals), "USDC");
    console.log("   Allowance to Vault:", hre.ethers.formatUnits(allowance, decimals), "USDC");
    if (balance === 0n) console.log("   ❌ No USDC balance!");
    else if (allowance === 0n) console.log("   ❌ No allowance! Approve first.");
    else console.log("   ✅ Has balance and allowance");
    
    // Check 4: Vault's own USDC balance
    const vaultUSDCBalance = await usdc.balanceOf(VAULT_ADDRESS);
    console.log("\n4️⃣ Vault USDC Balance:", hre.ethers.formatUnits(vaultUSDCBalance, decimals), "USDC");
    
    // Check 5: Try to simulate deposit to get exact revert reason
    console.log("\n5️⃣ Simulating deposit to get exact error...");
    
    const fullVaultAbi = [
        "function deposit(uint256 amount)"
    ];
    const fullVault = new hre.ethers.Contract(VAULT_ADDRESS, fullVaultAbi, signer);
    
    const depositAmount = hre.ethers.parseUnits("10", decimals);
    
    try {
        // Try static call first
        await fullVault.deposit.staticCall(depositAmount);
        console.log("   ✅ Static call succeeded! Deposit should work.");
    } catch (err) {
        console.log("   ❌ Static call failed!");
        console.log("   Error message:", err.message);
        
        // Try to extract revert reason
        if (err.message.includes("NexaID")) {
            console.log("\n   🔐 ISSUE: NexaID verification failed!");
            console.log("   Solution: Run verification script");
        } else if (err.message.includes("paused")) {
            console.log("\n   ⏸️ ISSUE: Contract is paused!");
            console.log("   Solution: Owner needs to unpause");
        } else if (err.message.includes("transfer")) {
            console.log("\n   💰 ISSUE: USDC transfer failed!");
            console.log("   Solution: Check USDC balance and allowance");
        } else {
            console.log("\n   ❓ Unknown issue. Check vault contract source.");
        }
    }
    
    console.log("\n========== RECOMMENDED ACTIONS ==========\n");
    
    if (!isVerified) {
        console.log("🔐 VERIFY WITH NEXAID FIRST:");
        console.log("   npx hardhat run scripts/manualVerify.js --network base-sepolia");
    } else if (paused) {
        console.log("⏸️ CONTRACT IS PAUSED - Owner needs to unpause:");
        console.log("   npx hardhat run scripts/unpauseVault.js --network base-sepolia");
    } else if (allowance === 0n) {
        console.log("✅ APPROVE VAULT:");
        console.log("   npx hardhat run scripts/manualApprove.js --network base-sepolia");
    } else {
        console.log("⚠️ Contact contract owner to check vault configuration");
    }
}

main().catch(console.error);