// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────
//   FILE 2 — VaultOracle.sol
// ─────────────────────────────────────────────

import "./VaultBase.sol";

abstract contract VaultOracle is VaultBase {

    // ─── Keeper management ────────────────────
    function setKeeper(address _keeper, bool _status) external onlyOwner {
        require(_keeper != address(0), "Invalid keeper address");
        keepers[_keeper] = _status;
        emit KeeperUpdated(_keeper, _status);
    }

    // ─── Signal management ────────────────────
    function setSignal(uint _signal) external onlyKeeper {
        require(!useDEXSignal, "DEX signal mode is enabled");
        require(_signal <= 100, "Signal must be between 0 and 100");
        require(block.timestamp > lastUpdate + 60, "Cooldown active");
        marketSignal = _signal;
        lastUpdate   = block.timestamp;
        emit SignalUpdated(_signal, msg.sender);
    }

    function setUseDEXSignal(bool _useDEX) external onlyOwner {
        useDEXSignal = _useDEX;
        emit DEXSignalModeUpdated(_useDEX);
    }

    function setPair(address _pair) external onlyOwner {
        require(_pair != address(0), "Invalid pair address");
        pair = _pair;
        emit PairUpdated(_pair);
    }

    function setThresholds(uint _bullish, uint _bearish) external onlyOwner {
        require(_bullish > _bearish, "Bullish must be greater than bearish");
        bullishThreshold = _bullish;
        bearishThreshold = _bearish;
        emit ThresholdsUpdated(_bullish, _bearish);
    }

    function setPriceBounds(uint _minPrice, uint _maxPrice) external onlyOwner {
        require(_minPrice > 0 && _minPrice < _maxPrice, "Invalid price bounds");
        minValidPrice = _minPrice;
        maxValidPrice = _maxPrice;
        emit PriceBoundsUpdated(_minPrice, _maxPrice);
    }

    // ─── AAVE config (onlyOwner) ──────────────
    function setAaveEnabled(bool _enabled) external onlyOwner {
        aaveEnabled = _enabled;
        emit AaveEnabledUpdated(_enabled);
    }

    /**
     * ✅ NEW: Owner AAVE addresses update kar sakta hai
     *    Ye Base Sepolia, Ethereum Sepolia, ya kisi bhi chain ke liye kaam karta hai
     *    Deploy ke baad call karo: setAaveAddresses(poolAddr, aUsdcAddr)
     */
    function setAaveAddresses(address _pool, address _aUsdc) external onlyOwner {
        require(_pool  != address(0), "Invalid pool address");
        require(_aUsdc != address(0), "Invalid aUsdc address");
        aavePool = _pool;
        aUsdc    = _aUsdc;
        emit AaveAddressesUpdated(_pool, _aUsdc);
    }

    // ─── Price oracle ─────────────────────────
    function getPrice() public view returns (uint) {
        if (pair == address(0)) return 0;
        (uint112 reserve0, uint112 reserve1, ) = IUniswapV2Pair(pair).getReserves();
        require(reserve0 > 0 && reserve1 > 0, "Invalid reserves");
        address token0 = IUniswapV2Pair(pair).token0();
        uint price;
        if (token0 == address(usdc)) {
            price = (uint(reserve0) * PRICE_DECIMALS) / uint(reserve1);
        } else {
            price = (uint(reserve1) * PRICE_DECIMALS) / uint(reserve0);
        }
        require(price >= minValidPrice && price <= maxValidPrice, "Price anomaly detected");
        return price;
    }

    function getSignalFromDEX() public view returns (uint) {
        uint price;
        try this.getPrice() returns (uint _price) {
            price = _price;
        } catch {
            return marketSignal;
        }
        uint mid = (bullishThreshold + bearishThreshold) / 2;
        if      (price > bullishThreshold) return 80;
        else if (price > mid)              return 65;
        else if (price < bearishThreshold) return 30;
        else if (price < mid)              return 40;
        else                               return 50;
    }

    function _signalFromDEX() internal view override returns (uint) {
        return getSignalFromDEX();
    }

    function getCurrentSignal() external view returns (uint) {
        return _getSignal();
    }

    function getDEXInfo() external view returns (
        uint currentPrice,
        uint currentSignal,
        uint bullishThreshold_,
        uint bearishThreshold_,
        bool usingDEX,
        uint minPrice,
        uint maxPrice
    ) {
        uint price;
        try this.getPrice() returns (uint _price) { price = _price; } catch { price = 0; }
        return (price, getSignalFromDEX(), bullishThreshold, bearishThreshold, useDEXSignal, minValidPrice, maxValidPrice);
    }
}
