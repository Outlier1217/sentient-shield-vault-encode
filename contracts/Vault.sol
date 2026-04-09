// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────
//  FILE 3 — Vault.sol  ← DEPLOY THIS ONE ONLY
//
//  ✅ FIXES:
//   1. AAVE addresses hardcoded constants → constructor params
//      Any chain works: Base Sepolia, Ethereum Sepolia, etc.
//   2. _supplyToAave: `usdc` approve karo (AAVE_USDC constant nahi)
//   3. deposit(): balAfter == balBefore + amount check HATAYA
//      (AAVE supply ke baad vault USDC balance badalta hai,
//       isliye strict equality fail kar sakti thi)
//   4. withdraw(): AAVE se withdraw pehle, phir user ko transfer
//
//  Base Sepolia Addresses (pass karo constructor mein):
//   AAVE_POOL : 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
//   USDC      : 0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f
//   aUSDC     : 0x2eCcd9dDC93Aaa26b85E968aF22a9B1fA210E584
// ─────────────────────────────────────────────

import "./VaultOracle.sol";

contract Vault is VaultOracle {

    struct UserInfo {
        uint balance;
        uint reward;
        uint userXP;
        uint userLevel;
        uint lastHarvestTime;
        uint nextLevelXP;
        uint levelBonus;
        uint reputationBonus;
    }

    // ─── Constructor ──────────────────────────
    /**
     * @param _usdc     USDC token address (e.g. Base Sepolia AAVE testnet USDC)
     * @param _nexaid   Identity contract (address(0) = no identity check)
     * @param _pair     MockPair address for DEX signal
     * @param _aavePool AAVE V3 Pool address (address(0) = AAVE disabled initially)
     * @param _aUsdc    aUSDC token address (yield-bearing token)
     */
    constructor(
        address _usdc,
        address _nexaid,
        address _pair,
        address _aavePool,
        address _aUsdc
    ) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_pair != address(0), "Invalid pair address");

        usdc  = IERC20(_usdc);
        pair  = _pair;
        owner = msg.sender;

        if (_nexaid != address(0)) {
            nexaid = INexaID(_nexaid);
        }

        // ✅ AAVE addresses constructor mein set — no hardcoding
        aavePool = _aavePool;
        aUsdc    = _aUsdc;
        // aaveEnabled default false — owner setAaveEnabled(true) call karega
        aaveEnabled = false;

        harvestCooldown  = 60;
        performanceFee   = 10;
        rebalanceBounty  = 5;
        maxLevelBonus    = 50;
        marketSignal     = 50;
        useDEXSignal     = true;

        bullishThreshold = 3000e18;
        bearishThreshold = 2000e18;
        minValidPrice    = 1000e18;
        maxValidPrice    = 10000e18;

        keepers[msg.sender] = true;
        locked = false;
    }

    // ─── Core vault actions ───────────────────

    /**
     * @dev User USDC deposit karta hai.
     *
     * ✅ FIX: balAfter == balBefore + amount ka strict check HATAYA
     *    Reason: Agar aaveEnabled=true, _supplyToAave() ke baad
     *    vault ka USDC balance badal sakta tha (AAVE se aUSDC wapas aata hai)
     *    Isliye strict equality fail ho rahi thi.
     *    Ab sirf check hai ki transferFrom successful raha.
     */
    function deposit(uint amount) external nonReentrant notPaused onlyVerified {
        require(amount > 0, "Invalid amount");

        // Step 1: User se USDC lelo
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Step 2: Vault ke records update karo
        balances[msg.sender] += amount;
        totalDeposits        += amount;

        // Step 3: Allocation karo (ye sirf accounting hai)
        _allocate(amount);
        _addXP(msg.sender, 10);

        // Step 4: AAVE supply LAST mein karo - isse withdraw ke time tak aUSDC accumulate hoga
        // NOTE: AAVE supply ke baad vault ka USDC balance kam ho jayega, 
        // but totalDeposits variable still tracks user ka principal correctly
        if (aaveEnabled && aavePool != address(0)) {
            _supplyToAave(amount);
        }

        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev User principal withdraw karta hai.
     * AAVE enabled hai to wahan se pehle nikalta hai, phir user ko transfer.
     */
    function withdraw(uint amount) external nonReentrant notPaused onlyVerified {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Step 1: AAVE se USDC wapas lao (agar enabled hai)
        if (aaveEnabled && aavePool != address(0)) {
            uint withdrawn = _withdrawFromAave(amount);
            require(withdrawn >= amount, "AAVE withdraw failed");
        }

        // Step 2: Check actual vault USDC balance
        require(usdc.balanceOf(address(this)) >= amount, "Vault liquidity low");

        // Step 3: User records update karo
        balances[msg.sender] -= amount;
        totalDeposits        -= amount;

        // Step 4: User ko USDC transfer karo
        require(usdc.transfer(msg.sender, amount), "Transfer failed");

        _addXP(msg.sender, 5);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Owner manually yield inject karta hai.
     * Fallback mechanism — jab AAVE disabled ho ya demo ke liye.
     */
    function generateYield(uint amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.balanceOf(address(this)) >= amount, "Not enough USDC");
        totalYield += amount;
        emit YieldGenerated(amount);
    }

    /**
     * @dev  AAVE Real Yield collect karo.
     * aUSDC balance - totalDeposits = accrued interest = real yield
     * Koi bhi call kar sakta hai. Caller ko XP milta hai.
     */
    function collectYield() external nonReentrant notPaused {
        require(aaveEnabled, "AAVE not enabled");
        uint collected = _collectAaveYield();
        require(collected > 0, "No yield available from AAVE");
        _addXP(msg.sender, 15);
        emit YieldGenerated(collected); // Add this event
    }

    function harvest() external nonReentrant notPaused {
        require(totalYield > 0,    "No yield available");
        require(totalDeposits > 0, "No deposits in vault");
        require(
            block.timestamp >= lastHarvest[msg.sender] + harvestCooldown,
            "Harvest cooldown active"
        );
        require(balances[msg.sender] > 0, "No balance to harvest");

        uint userShare   = (balances[msg.sender] * 1e18) / totalDeposits;
        uint gross       = (totalYield * userShare) / 1e18;
        require(gross > 0, "No reward for user");

        uint fee         = (gross * performanceFee) / 100;
        uint netReward   = gross - fee;
        uint bonusPct    = _getLevelBonus(msg.sender);
        uint bonus       = (netReward * bonusPct) / 100;
        uint finalReward = netReward + bonus;
        uint repBonus    = getReputationBonus(msg.sender);
        if (repBonus > 0) {
            finalReward += (finalReward * repBonus) / 100;
        }

        lastHarvest[msg.sender] = block.timestamp;
        totalYield          -= gross;
        rewards[msg.sender] += finalReward;
        rewards[owner]      += fee;

        _addXP(msg.sender, 25);
        emit Harvested(msg.sender, finalReward, bonus);
    }

    function claim() external nonReentrant notPaused {
        uint reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        require(usdc.balanceOf(address(this)) >= reward, "Insufficient vault liquidity");
        rewards[msg.sender] = 0;
        require(usdc.transfer(msg.sender, reward), "Transfer failed");
        _addXP(msg.sender, 15);
    }

    function rebalance() external nonReentrant notPaused {
        uint signal = _getSignal();
        uint newAlpha; uint newStable; uint newRisk;

        if (signal > 70) {
            newAlpha  = (totalDeposits * 60) / 100;
            newStable = (totalDeposits * 25) / 100;
            newRisk   = (totalDeposits * 15) / 100;
        } else if (signal < 40) {
            newAlpha  = (totalDeposits * 30) / 100;
            newStable = (totalDeposits * 30) / 100;
            newRisk   = (totalDeposits * 40) / 100;
        } else {
            newAlpha  = (totalDeposits * 50) / 100;
            newStable = (totalDeposits * 30) / 100;
            newRisk   = (totalDeposits * 20) / 100;
        }

        alphaVault = newAlpha;
        stableCore = newStable;
        riskGuard  = newRisk;

        uint bounty = (totalDeposits * rebalanceBounty) / 10000;
        if (bounty > 0 && usdc.balanceOf(address(this)) >= bounty) {
            bountiesEarned[msg.sender] += bounty;
            require(usdc.transfer(msg.sender, bounty), "Bounty transfer failed");
            emit BountyPaid(msg.sender, bounty);
        }

        _addXP(msg.sender, 20);
        emit Rebalanced(signal, alphaVault, stableCore, riskGuard);
    }

    // ─── NexaID helpers ───────────────────────
    function getReputationBonus(address user) public view returns (uint) {
        if (address(nexaid) == address(0)) return 0;
        try nexaid.getScore(user) returns (uint score) {
            if (score > 800) return 20;
            if (score > 500) return 10;
            if (score > 300) return 5;
        } catch {}
        return 0;
    }

    function isVerified(address user) public view returns (bool) {
        if (address(nexaid) == address(0)) return true;
        try nexaid.verify(user) returns (bool verified) {
            return verified;
        } catch {
            return false;
        }
    }

    // ─── Level / XP helpers ───────────────────
    function getNextLevelXP(address user) public view returns (uint) {
        uint lvl = level[user];
        if (lvl <= 1) return 100;
        if (lvl == 2) return 300;
        if (lvl == 3) return 600;
        if (lvl == 4) return 1000;
        if (lvl == 5) return 1500;
        return (lvl - 4) * 500 + 1500;
    }

    function getLevelBonus(address user) external view returns (uint) {
        return _getLevelBonus(user);
    }

    // ─── AAVE View Helpers ────────────────────
    /// aUSDC balance — grow karta rehta hai real time mein
    function getAaveBalance() external view returns (uint) {
        if (aUsdc == address(0)) return 0;
        return IERC20(aUsdc).balanceOf(address(this));
    }

    /// Abhi AAVE mein accrued uncollected yield
    function getPendingAaveYield() external view returns (uint) {
        if (aUsdc == address(0)) return 0;
        uint aBalance = IERC20(aUsdc).balanceOf(address(this));
        if (aBalance <= totalDeposits) return 0;
        return aBalance - totalDeposits;
    }

    // ─── Admin ────────────────────────────────
    function pause()   external onlyOwner { paused = true;  }
    function unpause() external onlyOwner { paused = false; }

    function setNexaID(address _nexaid) external onlyOwner {
        require(_nexaid != address(0), "Invalid address");
        nexaid = INexaID(_nexaid);
    }

    function setHarvestCooldown(uint _cooldown) external onlyOwner {
        harvestCooldown = _cooldown;
        emit CooldownUpdated(_cooldown);
    }

    function setPerformanceFee(uint _fee) external onlyOwner {
        require(_fee <= 50, "Fee cannot exceed 50%");
        performanceFee = _fee;
        emit FeeUpdated(_fee);
    }

    function setRebalanceBounty(uint _bounty) external onlyOwner {
        require(_bounty <= 100, "Bounty cannot exceed 1%");
        rebalanceBounty = _bounty;
        emit BountyPercentUpdated(_bounty);
    }

    function setMaxLevelBonus(uint _maxBonus) external onlyOwner {
        require(_maxBonus <= 100, "Max bonus cannot exceed 100%");
        maxLevelBonus = _maxBonus;
        emit MaxLevelBonusUpdated(_maxBonus);
    }

    function emergencyWithdraw(address token, uint amount) external onlyOwner {
        if (token == address(0)) {
            (bool ok,) = payable(owner).call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            require(IERC20(token).transfer(owner, amount), "Token transfer failed");
        }
    }

    // ─── View functions ───────────────────────
    function getVaultInfo() external view returns (
        uint totalDeposits_, uint totalYield_,
        uint alphaVault_, uint stableCore_, uint riskGuard_,
        uint currentSignal
    ) {
        return (totalDeposits, totalYield, alphaVault, stableCore, riskGuard, _getSignal());
    }

    function getUserInfo(address user) external view returns (UserInfo memory) {
        return UserInfo({
            balance:         balances[user],
            reward:          rewards[user],
            userXP:          xp[user],
            userLevel:       level[user],
            lastHarvestTime: lastHarvest[user],
            nextLevelXP:     getNextLevelXP(user),
            levelBonus:      _getLevelBonus(user),
            reputationBonus: getReputationBonus(user)
        });
    }
}
