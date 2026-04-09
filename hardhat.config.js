require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    baseSepolia: {
      url: ALCHEMY_KEY
        ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
        : "https://sepolia.base.org",
      accounts: PRIVATE_KEY !== "" ? [PRIVATE_KEY] : [],
      chainId: 84532,
      // ✅ Add this to fix checksum issues
      gasPrice: 1500000000, // 1 Gwei
    },

    sepolia: {
      url: ALCHEMY_KEY
        ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
        : "https://rpc.sepolia.org",
      accounts: PRIVATE_KEY !== "" ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },

    hashkey: {
      url: process.env.RPC_URL || "",
      accounts: PRIVATE_KEY !== "" ? [PRIVATE_KEY] : [],
      chainId: 133,
    },
  },

  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASESCAN_API_KEY || "no-key",
      sepolia: process.env.ETHERSCAN_API_KEY || "no-key",
      hashkey: "no-api-key-required",
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "hashkey",
        chainId: 133,
        urls: {
          apiURL: "https://explorer.testnet.hashkeychain.com/api",
          browserURL: "https://explorer.testnet.hashkeychain.com",
        },
      },
    ],
  },
};