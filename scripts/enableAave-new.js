// scripts/enableAave.js
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    
    const VAULT_ADDRESS = "0x621B13fcbF7417f931B9103eE4b750fB98dB9f06";
    const OWNER_ADDRESS = "0xAb06a17af1425F499E302B639c69f8ce29a967E0";
    
    if (address.toLowerCase() !== OWNER_ADDRESS.toLowerCase()) {
        console.log("❌ Only owner can enable AAVE!");
        return;
    }
    
    const vaultAbi = [
        "function setAaveEnabled(bool)",
        "function aaveEnabled() view returns (bool)"
    ];
    
    const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS, signer);
    
    console.log("Current AAVE status:", await vault.aaveEnabled());
    console.log("Enabling AAVE...");
    
    const tx = await vault.setAaveEnabled(true);
    await tx.wait();
    
    console.log("✅ AAVE Enabled!");
    console.log("New status:", await vault.aaveEnabled());
}

main().catch(console.error);