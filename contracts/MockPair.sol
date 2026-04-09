// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────
//  MockPair.sol  —  DEX Price Oracle Simulator
//  Uniswap V2 compatible interface simulate karta hai.
//  Reserves setReserves() se manually update hote hain.
//  Real price signal → signal engine → capital allocation.
// ─────────────────────────────────────────────

contract MockPair {

    address public token0;
    address public token1;

    uint112 public reserve0;
    uint112 public reserve1;

    constructor(address _usdc) {
        token0 = _usdc;
        token1 = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // fake ETH / second token
    }

    // Owner/deployer reserves set karta hai price simulate karne ke liye
    // reserve0 = USDC amount (6 decimals)
    // reserve1 = ETH  amount (18 decimals)
    // Price = reserve0 / reserve1 * 1e18
    function setReserves(uint112 _r0, uint112 _r1) external {
        reserve0 = _r0;
        reserve1 = _r1;
    }

    function getReserves() external view returns (
        uint112,
        uint112,
        uint32
    ) {
        return (reserve0, reserve1, uint32(block.timestamp));
    }
}
