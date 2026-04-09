require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Private key from .env file
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,  // Helps with large contracts
    },
  },

  networks: {
    // Local Hardhat network for testing
    hardhat: {
      chainId: 31337,
    },
    
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // Base Sepolia (main deployment network)
    baseSepolia: {
      url: ALCHEMY_KEY
        ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
        : "https://sepolia.base.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: 1000000000, // 1 Gwei
      timeout: 120000,      // 2 minutes timeout
    },

    // Ethereum Sepolia (backup)
    sepolia: {
      url: ALCHEMY_KEY
        ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
        : "https://rpc.sepolia.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 2000000000, // 2 Gwei
    },
  },

  // Etherscan verification
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },

  // Gas reporting
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};