// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────
//  FILE 1 — VaultBase.sol
// ─────────────────────────────────────────────

interface IERC20 {
    function transferFrom(address from, address to, uint amount) external returns (bool);
    function transfer(address to, uint amount) external returns (bool);
    function balanceOf(address account) external view returns (uint);
    function approve(address spender, uint amount) external returns (bool);
}

interface INexaID {
    function verify(address user) external view returns (bool);
    function getScore(address user) external view returns (uint);
}

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112, uint112, uint32);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

abstract contract VaultBase {

    IERC20  public usdc;
    INexaID public nexaid;

    address public pair;
    uint public constant PRICE_DECIMALS = 1e18;

    uint public minValidPrice;
    uint public maxValidPrice;
    uint public marketSignal;
    uint public lastUpdate;
    bool public useDEXSignal;

    mapping(address => uint) public balances;
    mapping(address => uint) public lastHarvest;
    mapping(address => uint) public rewards;
    mapping(address => uint) public xp;
    mapping(address => uint) public level;
    mapping(address => uint) public bountiesEarned;

    uint public totalDeposits;
    uint public totalYield;
    uint public alphaVault;
    uint public stableCore;
    uint public riskGuard;
    uint public harvestCooldown;
    uint public performanceFee;
    uint public rebalanceBounty;
    uint public maxLevelBonus;
    uint public bullishThreshold;
    uint public bearishThreshold;

    address public owner;
    bool    public paused;
    bool    internal locked;

    mapping(address => bool) public keepers;

    // ─── AAVE Integration ─────────────────────
    // ✅ FIX 1: Constants ki jagah mutable state variables
    //    Kisi bhi chain ke addresses kaam karenge
    //    Constructor mein set hota hai, owner update kar sakta hai
    address public aavePool;    // e.g. Base Sepolia: 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
    address public aUsdc;       // e.g. Base Sepolia: 0x2eCcd9dDC93Aaa26b85E968aF22a9B1fA210E584
    bool    public aaveEnabled; // default false, owner setAaveEnabled(true) call karega

    // ─── Events ───────────────────────────────
    event Deposited(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
    event Harvested(address indexed user, uint reward, uint bonus);
    event YieldGenerated(uint amount);
    event Rebalanced(uint signal, uint alpha, uint stable, uint risk);
    event XPEarned(address indexed user, uint amount, uint newXP);
    event LevelUp(address indexed user, uint newLevel);
    event BountyPaid(address indexed user, uint amount);
    event SignalUpdated(uint newSignal, address indexed updater);
    event CooldownUpdated(uint newCooldown);
    event FeeUpdated(uint newFee);
    event BountyPercentUpdated(uint newBounty);
    event MaxLevelBonusUpdated(uint newMaxBonus);
    event DEXSignalModeUpdated(bool useDEX);
    event ThresholdsUpdated(uint bullish, uint bearish);
    event PriceBoundsUpdated(uint minPrice, uint maxPrice);
    event PairUpdated(address newPair);
    event KeeperUpdated(address indexed keeper, bool status);
    event AaveYieldCollected(uint yieldAmount);
    event AaveEnabledUpdated(bool enabled);
    event AaveAddressesUpdated(address pool, address aToken);

    // ─── Modifiers ────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyKeeper() {
        require(keepers[msg.sender], "Not keeper");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call detected");
        locked = true;
        _;
        locked = false;
    }

    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier onlyVerified() {
        if (address(nexaid) != address(0)) {
            require(nexaid.verify(msg.sender), "NexaID: Identity not verified");
        }
        _;
    }

    // ─── XP & Level ───────────────────────────
    function _addXP(address user, uint amount) internal {
        xp[user] += amount;
        uint newLvl = _calculateLevel(xp[user]);
        if (newLvl > level[user]) {
            level[user] = newLvl;
            emit LevelUp(user, newLvl);
        }
        emit XPEarned(user, amount, xp[user]);
    }

    function _calculateLevel(uint xpAmount) internal pure returns (uint) {
        if (xpAmount < 100)  return 1;
        if (xpAmount < 300)  return 2;
        if (xpAmount < 600)  return 3;
        if (xpAmount < 1000) return 4;
        if (xpAmount < 1500) return 5;
        return 5 + (xpAmount - 1500) / 500;
    }

    function _getLevelBonus(address user) internal view returns (uint) {
        uint bonus = level[user] * 5;
        return bonus > maxLevelBonus ? maxLevelBonus : bonus;
    }

    // ─── Signal ───────────────────────────────
    function _getSignal() internal view returns (uint) {
        return useDEXSignal ? _signalFromDEX() : marketSignal;
    }

    function _signalFromDEX() internal view virtual returns (uint) {
        return marketSignal;
    }

    // ─── Allocation ───────────────────────────
    function _allocate(uint amount) internal {
        uint signal = _getSignal();
        if (signal > 70) {
            alphaVault += (amount * 60) / 100;
            stableCore += (amount * 25) / 100;
            riskGuard  += (amount * 15) / 100;
        } else if (signal < 40) {
            alphaVault += (amount * 30) / 100;
            stableCore += (amount * 30) / 100;
            riskGuard  += (amount * 40) / 100;
        } else {
            alphaVault += (amount * 50) / 100;
            stableCore += (amount * 30) / 100;
            riskGuard  += (amount * 20) / 100;
        }
        emit Rebalanced(signal, alphaVault, stableCore, riskGuard);
    }

    // ─── AAVE Internal Functions ──────────────

    /**
     * ✅ FIX 2: `usdc` (vault ka actual token) approve karo
     *    AAVE_USDC hardcoded constant NAHI — woh galat address ho sakta tha
     *    Double approval pattern: pehle 0 pe reset, phir actual amount
     */
    function _supplyToAave(uint amount) internal {
        if (!aaveEnabled || amount == 0 || aavePool == address(0)) return;
        // Vault ka actual USDC token approve karo AAVE pool ke liye
        usdc.approve(aavePool, 0);        // reset pehle (safe approval pattern)
        usdc.approve(aavePool, amount);   // phir actual amount
        // AAVE ko supply karo — vault ko aUSDC milta hai jo auto-badhta hai
        IAavePool(aavePool).supply(address(usdc), amount, address(this), 0);
    }

    /**
     * ✅ FIX 3: `usdc` address use karo withdraw mein bhi (consistent)
     */
    function _withdrawFromAave(uint amount) internal returns (uint) {
        if (!aaveEnabled || amount == 0 || aavePool == address(0)) return 0;
        return IAavePool(aavePool).withdraw(address(usdc), amount, address(this));
    }

    /**
     * aUSDC balance - totalDeposits = real accumulated yield from AAVE
     */
    function _collectAaveYield() internal returns (uint yieldAmount) {
        if (!aaveEnabled || aUsdc == address(0)) return 0;
        uint aBalance = IERC20(aUsdc).balanceOf(address(this));
        if (aBalance <= totalDeposits) return 0;
        yieldAmount = aBalance - totalDeposits;
        IAavePool(aavePool).withdraw(address(usdc), yieldAmount, address(this));
        totalYield += yieldAmount;
        emit AaveYieldCollected(yieldAmount);
    }
}
