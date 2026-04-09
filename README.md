# 🔥 Sentient Shield Vault (SSV)

> **Self-Operating DeFi Engine — Real Yield via AAVE · On-Chain Identity · Gamified Rewards · Pre-Transaction Security**
>
> Submitted for the **Encode Club DeFi Mini Hack** · April 2026  
> Deployed on **Base Sepolia** | Integrated with **AAVE V3**

---

## 🚀 Overview

**Sentient Shield Vault (SSV)** is a fully on-chain DeFi protocol that solves five fundamental problems with traditional yield vaults — all in a single, composable system.

SSV integrates **AAVE V3** for real, verifiable yield, an **on-chain identity layer** that eliminates Sybil attacks, a **signal-based capital allocation engine** that responds to market conditions, a **gamification system** that incentivizes long-term participation, and a **pre-transaction risk filter** that protects users before they sign.

Every piece is live. Every function is callable. Real yield is flowing through AAVE on Base Sepolia right now.

---

## ❗ Problem

Standard DeFi vaults share five structural weaknesses that SSV addresses directly:

**No identity layer** — Bots farm rewards, Sybil wallets drain liquidity, and there is no cost to abuse the system.  
**Yield has no source** — Most demo vaults simply mint fake yield. There is no real protocol generating returns.  
**Static allocation** — Capital sits in fixed ratios regardless of whether the market is bullish or bearish.  
**No engagement model** — Users deposit once and leave. There is no reason to stay, contribute, or return.  
**No pre-execution safety** — Users submit transactions without knowing whether conditions are safe.

---

## 💡 Solution — Five Modules, One Protocol

| Problem | SSV Module | How It Works |
|---|---|---|
| No identity | **NexaID** | On-chain verification + reputation-weighted yield bonuses |
| Fake yield | **AAVE V3 Integration** | Deposits auto-supplied to AAVE; aUSDC grows in real time |
| Static strategy | **Signal Engine** | DEX price feeds drive allocation across three buckets |
| No engagement | **XP & Level System** | Every action earns XP, unlocking yield multipliers up to +50% |
| No safety | **ShieldBot** | Risk score check before every deposit, withdraw, and harvest |

---

## 🏦 AAVE V3 Integration — Real Yield, Not Minted Numbers

This is the core technical differentiator.

When a user deposits USDC, the vault immediately supplies those funds to **AAVE V3 on Base Sepolia**. AAVE mints **aUSDC** back to the vault — an interest-bearing token that grows every block. The vault tracks `aUSDC balance − totalDeposits` as the real, accumulated yield.

```
User deposits 100 USDC
       ↓
Vault supplies 100 USDC to AAVE Pool
       ↓
Vault receives 100 aUSDC (grows to 100.003 aUSDC after a few hours)
       ↓
collectYield() harvests 0.003 USDC → goes into totalYield
       ↓
Users harvest their proportional share with XP + reputation bonuses
```

The yield is not synthetic. It comes from AAVE's lending market. Anyone can verify it on-chain by reading `getAaveBalance()` and watching it increase block by block.

**Base Sepolia AAVE V3 addresses used:**

| Contract | Address |
|---|---|
| AAVE V3 Pool | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` |
| Testnet USDC | `0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f` |
| aUSDC (yield token) | `0x0a1d576f3efef75b330424287a95a366e8281d54` |

---

## 🔐 NexaID — Why Identity Changes Everything in DeFi

Every major DeFi exploit, reward drain, and Sybil attack shares a common root: **the protocol cannot distinguish a human from a bot, or a single actor controlling a thousand wallets**.

NexaID is SSV's answer to this problem.

It is an on-chain identity and reputation registry. Users verify once. The vault reads their score on every interaction. Higher-reputation users earn higher yield — not because they deposited more, but because the protocol trusts them more.

**This creates a new primitive: trust-weighted yield.**

A user with a NexaID score above 800 earns +20% on top of their harvest. A score above 500 earns +10%. A score above 300 earns +5%. Combined with the level bonus system, a highly-engaged, verified user can earn up to **+70% more yield** than an anonymous depositor with the same principal.

The economic consequences are significant:
- Bots cannot farm yield at scale — they cannot acquire reputation
- Long-term users are rewarded, not just large depositors
- The protocol becomes naturally resistant to Sybil attacks without any centralized gatekeeping

For this hackathon deployment, `MockNexaID` implements the interface directly on-chain. The architecture is designed to be swapped out for **Worldcoin, Polygon ID, or any ERC-compliant identity protocol** without changing a single line of the vault logic. The identity layer is modular by design.

```solidity
// NexaID reputation bonus — called inside harvest()
function getReputationBonus(address user) public view returns (uint) {
    try nexaid.getScore(user) returns (uint score) {
        if (score > 800) return 20;  // +20% yield bonus
        if (score > 500) return 10;  // +10% yield bonus
        if (score > 300) return 5;   // +5%  yield bonus
    } catch {}
    return 0;
}
```

---

## 🏗️ Architecture

```
User → React Frontend (Ethers.js v6)
           │
           ├─ NexaID Verification Gate (onlyVerified modifier)
           ├─ ShieldBot Risk Check (pre-tx, frontend)
           │
           ▼
      Vault.sol
           │
           ├─ VaultOracle.sol  (DEX signal engine, keeper management, AAVE config)
           └─ VaultBase.sol    (storage, events, modifiers, XP/level logic, AAVE internal)
           │
           ├─ AAVE V3 Pool  ← real external protocol
           ├─ MockNexaID    ← identity registry
           └─ MockPair      ← DEX price oracle
           │
           ▼
    Base Sepolia Testnet
```

### Contract Inheritance

```
VaultBase.sol     ← storage, events, modifiers, XP logic, AAVE internal functions
    └── VaultOracle.sol  ← DEX price oracle, signal engine, AAVE address config
            └── Vault.sol      ← deposit, withdraw, harvest, claim, rebalance, collectYield
```

**Deploy only `Vault.sol`** — it inherits everything automatically.

---

## 📦 Deployed Contracts — Base Sepolia

| Contract | Address |
|---|---|
| 🔐 MockNexaID | `0xdD62fC9c75aE7DDE486635d4C3dFB5ECd72c80C5` |
| 🔗 MockPair | `0xe9cEF1A7788657171592e64da274EB9D021a96f8` |
| 🏦 Vault | `0x63092E7BDd4D1a425BdB6264035dD3F6b775BB4d` |
| 🌐 AAVE V3 Pool | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` |
| 💰 USDC (testnet) | `0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f` |
| 📈 aUSDC (yield) | `0x0a1d576f3efef75b330424287a95a366e8281d54` |

**Network:** Base Sepolia — Chain ID `84532` — RPC: `https://sepolia.base.org`  
**Explorer:** `https://sepolia.basescan.org`

---

## ⚙️ Core Protocol Features

### 💰 Deposit & Withdraw
- Only NexaID-verified users can interact
- Funds are immediately supplied to AAVE V3 on deposit (when enabled)
- Dynamic allocation across three sub-strategies based on live market signal
- Reentrancy-protected on all state-modifying functions

### 🏦 Real Yield via AAVE V3
- `collectYield()` — anyone can call it; harvests aUSDC interest into `totalYield`
- `getAaveBalance()` — returns live aUSDC balance (grows every block — verifiable on-chain)
- `getPendingAaveYield()` — returns uncollected interest sitting in AAVE right now
- `aaveEnabled` flag — owner can toggle; system degrades gracefully to `generateYield()` fallback

### 🌾 Harvest & Claim
- Users call `harvest()` to accrue their proportional share of `totalYield`
- Final reward = base share + level bonus (up to +50%) + reputation bonus (up to +20%)
- 60-second cooldown enforced on-chain
- `claim()` transfers accrued rewards to wallet

### 🔄 Rebalance (Permissionless)
- Anyone can call `rebalance()` at any time
- Caller earns a bounty of 0.05% of total deposits
- Allocation shifts based on current DEX price signal
- No keepers required — economically incentivized by the bounty

---

## 🧠 Capital Allocation Engine

Funds are split across three internal buckets based on a live market signal derived from the DEX price oracle:

| Signal | AlphaVault | StableCore | RiskGuard |
|---|---|---|---|
| Bullish (> 70) | 60% | 25% | 15% |
| Neutral (40–70) | 50% | 30% | 20% |
| Bearish (< 40) | 30% | 30% | 40% |

Price is read from `MockPair` (Uniswap V2-compatible interface). Flash loan protection is enforced — prices outside the `[minValidPrice, maxValidPrice]` range revert with `"Price anomaly detected"`.

---

## 🎮 Gamification System

Every on-chain action earns XP. XP unlocks levels. Levels unlock yield multipliers.

| Action | XP |
|---|---|
| Deposit | +10 |
| Withdraw | +5 |
| Harvest / collectYield | +25 |
| Claim | +15 |
| Rebalance | +20 |

| Level | XP Required | Yield Bonus |
|---|---|---|
| 1 | 0 | +5% |
| 2 | 100 | +10% |
| 3 | 300 | +15% |
| 4 | 600 | +20% |
| 5 | 1,000 | +25% |
| 6+ | 1,500 + (n×500) | up to +50% |

---

## 🛡️ Security

**On-chain:** `nonReentrant` guard on all state-modifying functions · `notPaused` emergency halt · `onlyVerified` NexaID gate · flash loan price protection · performance fee capped at 50% · bounty capped at 1% · signal update cooldown (60s)

**Frontend (ShieldBot):** Risk score computed before every deposit, withdraw, and harvest. Score ≥ 70 blocks the transaction and shows a warning modal with the risk value and reason.

---

## 🖥️ Frontend

Built with **React + Vite + Ethers.js v6**.

**Pages:** `/` — Vault dashboard · `/admin` — Admin panel

**Features:** MetaMask auto-switch to Base Sepolia · NexaID verification flow · Real-time balance refresh every 10 seconds · aUSDC live balance display · XP progress bar and level card · ShieldBot modal · Fully responsive

---

## 🛠️ Setup & Run

```bash
git clone https://github.com/Outlier1217/sentient-shield-vault
cd sentient-shield-vault
npm install
cd frontend && npm install
```

**Configure `.env`:**
```env
PRIVATE_KEY=your_private_key_here
ALCHEMY_KEY=your_alchemy_key_here
VAULT_ADDRESS=  # fill after deploy
```

**Compile & Deploy:**
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network baseSepolia
```

**Enable AAVE real yield:**
```bash
# After getting USDC from app.aave.com → Testnet → Faucet
npx hardhat run scripts/enableAave.js --network baseSepolia
```

**Run frontend:**
```bash
cd frontend && npm run dev
```

---

## 🧪 Demo Flow

1. Connect MetaMask → auto-switches to Base Sepolia
2. Click **Verify with NexaID** → `verifyMe()` → score 750 set on-chain
3. Get USDC from `app.aave.com → Testnet → Faucet`
4. **Approve** → authorize vault to spend USDC
5. **Deposit** → USDC goes to vault → immediately supplied to AAVE → +10 XP
6. Watch **aUSDC Balance** card increase in real time (refreshes every 10s)
7. **Collect AAVE Yield** → harvests AAVE interest into `totalYield` → +15 XP
8. **Harvest** → accrue rewards with level + NexaID bonuses → +25 XP
9. **Claim** → rewards transferred to wallet → +15 XP
10. **Rebalance** → realign allocations → earn bounty → +20 XP

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity ^0.8.24, Hardhat |
| Frontend | React (Vite), Ethers.js v6 |
| Yield Protocol | AAVE V3 (Base Sepolia) |
| Blockchain | Base Sepolia (Chain ID 84532) |
| Identity | MockNexaID (modular — swappable with Worldcoin/Polygon ID) |
| Oracle | Uniswap V2-compatible MockPair |

---

## 🚀 Roadmap

- Chainlink / Pyth price feed integration (replace MockPair)
- Worldcoin or Polygon ID integration (replace MockNexaID)
- DAO governance for fee and strategy parameters
- NFT-based reputation and level badges (Level 5+ unlocks NFT)
- Multi-asset vault support (WETH, DAI) with per-asset strategy buckets

---

## 🔗 Links

| Resource | Link |
|---|---|
| 📦 GitHub | [github.com/Outlier1217/sentient-shield-vault](https://github.com/Outlier1217/sentient-shield-vault) |
| 📺 Demo Video | [youtu.be/VxmpqMxuk7E](https://youtu.be/VxmpqMxuk7E) |
| 🌐 Live Prototype | [mprot.store](https://mprot.store/) |

---

## 👨‍💻 Author

**Mustak Aalam** — Web3 Developer · DeFi Builder

Submitted for the **Encode Club DeFi Mini Hack** · April 2026

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

> 🔥 *Sentient Shield Vault — DeFi that doesn't wait, it acts.*