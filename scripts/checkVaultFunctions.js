// scripts/checkVaultFunctions.js
const hre = require("hardhat");

async function main() {
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    
    // Get contract interface
    const vaultInterface = new hre.ethers.Interface([
        "function aaveEnabled() view returns (bool)",
        "function setAaveEnabled(bool)",
        "function deposit(uint256)",
        "function withdraw(uint256)"
    ]);
    
    // Check if function exists by trying to encode it
    try {
        const data = vaultInterface.encodeFunctionData("setAaveEnabled", [true]);
        console.log("✅ setAaveEnabled function exists!");
        console.log("Encoded data:", data);
    } catch (err) {
        console.log("❌ setAaveEnabled function NOT found!");
        console.log("Error:", err.message);
    }
    
    // Try to call it directly
    const [signer] = await hre.ethers.getSigners();
    const vault = await hre.ethers.getContractAt([
        "function aaveEnabled() view returns (bool)",
        "function setAaveEnabled(bool)"
    ], VAULT_ADDRESS, signer);
    
    try {
        const current = await vault.aaveEnabled();
        console.log("\nCurrent aaveEnabled:", current);
        
        // Try to call
        console.log("\nTrying to call setAaveEnabled...");
        const tx = await vault.setAaveEnabled(true);
        await tx.wait();
        
        const newStatus = await vault.aaveEnabled();
        console.log("New aaveEnabled:", newStatus);
    } catch (err) {
        console.log("\nError calling setAaveEnabled:", err.message);
        
        // Try to get the revert reason
        if (err.data) {
            console.log("Revert data:", err.data);
        }
    }
}

main().catch(console.error);