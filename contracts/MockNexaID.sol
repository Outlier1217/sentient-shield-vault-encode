// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────
//  MockNexaID.sol  —  On-Chain Identity Layer
//  (Custom identity registry — production mein
//   Worldcoin / Polygon ID se replace hoga)
// ─────────────────────────────────────────────

contract MockNexaID {

    address public owner;

    mapping(address => bool) public verified;
    mapping(address => uint) public score;

    event UserVerified(address indexed user, uint score);
    event UserSetByOwner(address indexed user, bool verified, uint score);

    constructor() {
        owner = msg.sender;
    }

    // Owner can set any user
    function setUser(address user, bool _verified, uint _score) external {
        require(msg.sender == owner, "Not owner");
        verified[user] = _verified;
        score[user]    = _score;
        emit UserSetByOwner(user, _verified, _score);
    }

    // Self-verify with custom score (100-1000)
    function selfVerify(uint _score) external {
        require(_score >= 100 && _score <= 1000, "Score must be between 100 and 1000");
        require(!verified[msg.sender], "User already verified");
        verified[msg.sender] = true;
        score[msg.sender]    = _score;
        emit UserVerified(msg.sender, _score);
    }

    // Self-verify with default score 750
    function verifyMe() external {
        require(!verified[msg.sender], "User already verified");
        verified[msg.sender] = true;
        score[msg.sender]    = 750;
        emit UserVerified(msg.sender, 750);
    }

    function verify(address user) external view returns (bool) {
        return verified[user];
    }

    function getScore(address user) external view returns (uint) {
        return score[user];
    }

    function getUserStatus(address user) external view returns (bool, uint) {
        return (verified[user], score[user]);
    }

    function resetUser(address user) external {
        require(msg.sender == owner, "Not owner");
        verified[user] = false;
        score[user]    = 0;
    }

    function getOwner() external view returns (address) {
        return owner;
    }
}
