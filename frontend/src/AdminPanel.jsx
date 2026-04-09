// AdminPanel.jsx - Admin Controls for AAVE & Vault Management
import { useState, useEffect } from "react";
import { ethers } from "ethers";

const VAULT_ADDRESS = "0xeFE3707183961AB72DEe353EeDE76BA252B55C8B";
const OWNER_ADDRESS = "0xAb06a17af1425F499E302B639c69f8ce29a967E0";

const vaultAbi = [
  "function aaveEnabled() view returns (bool)",
  "function setAaveEnabled(bool)",
  "function paused() view returns (bool)",
  "function pause()",
  "function unpause()",
  "function totalDeposits() view returns (uint256)",
  "function totalYield() view returns (uint256)",
  "function owner() view returns (address)",
  "function generateYield(uint256 amount)",
  "function collectYield()"
];

const usdcAbi = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const USDC_ADDRESS = "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f";

function AdminPanel() {
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [aaveEnabled, setAaveEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [totalDeposits, setTotalDeposits] = useState("0");
  const [totalYield, setTotalYield] = useState("0");
  const [vaultUSDC, setVaultUSDC] = useState("0");
  const [yieldAmount, setYieldAmount] = useState("");
  const [decimals, setDecimals] = useState(6);

  const BASE_SEPOLIA_CHAIN_ID = 84532;

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus("❌ Please install MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID) {
        setStatus("⏳ Switching to Base Sepolia...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: "Base Sepolia",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setSigner(signer);
      setAccount(address);

      const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer);
      const owner = await vault.owner();
      const isOwnerCheck = owner.toLowerCase() === address.toLowerCase();
      setIsOwner(isOwnerCheck);

      if (!isOwnerCheck) {
        setStatus("⚠️ You are not the owner! Admin features are restricted.");
      } else {
        setStatus("✅ Connected as Owner");
      }

      await loadData(signer);
    } catch (err) {
      setStatus("❌ Failed to connect: " + err.message?.slice(0, 80));
      console.error(err);
    }
  };

  const loadData = async (signerInstance) => {
    if (!signerInstance) return;

    try {
      const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signerInstance);
      const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, signerInstance);

      const usdcDecimals = await usdc.decimals();
      setDecimals(Number(usdcDecimals));

      const [aave, pausedStatus, deposits, yieldAmt, vaultBalance] = await Promise.all([
        vault.aaveEnabled(),
        vault.paused(),
        vault.totalDeposits(),
        vault.totalYield(),
        usdc.balanceOf(VAULT_ADDRESS),
      ]);

      setAaveEnabled(aave);
      setPaused(pausedStatus);
      setTotalDeposits(ethers.formatUnits(deposits, usdcDecimals));
      setTotalYield(ethers.formatUnits(yieldAmt, usdcDecimals));
      setVaultUSDC(ethers.formatUnits(vaultBalance, usdcDecimals));
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const toggleAave = async () => {
    if (!isOwner) {
      setStatus("❌ Only owner can toggle AAVE!");
      return;
    }

    try {
      setLoading(true);
      setStatus(`⏳ ${aaveEnabled ? "Disabling" : "Enabling"} AAVE...`);

      const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer);
      const tx = await vault.setAaveEnabled(!aaveEnabled);
      await tx.wait();

      setAaveEnabled(!aaveEnabled);
      setStatus(`✅ AAVE ${!aaveEnabled ? "enabled" : "disabled"} successfully!`);
      await loadData(signer);
    } catch (err) {
      console.error("Toggle AAVE error:", err);
      setStatus(`❌ Failed: ${err.message?.slice(0, 100)}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePause = async () => {
    if (!isOwner) {
      setStatus("❌ Only owner can pause/unpause!");
      return;
    }

    try {
      setLoading(true);
      const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer);

      if (paused) {
        setStatus("⏳ Unpausing contract...");
        const tx = await vault.unpause();
        await tx.wait();
        setStatus("✅ Contract unpaused!");
      } else {
        setStatus("⏳ Pausing contract...");
        const tx = await vault.pause();
        await tx.wait();
        setStatus("✅ Contract paused!");
      }

      setPaused(!paused);
      await loadData(signer);
    } catch (err) {
      console.error("Toggle pause error:", err);
      setStatus(`❌ Failed: ${err.message?.slice(0, 100)}`);
    } finally {
      setLoading(false);
    }
  };

  const generateYield = async () => {
    if (!isOwner) {
      setStatus("❌ Only owner can generate yield!");
      return;
    }

    const amount = parseFloat(yieldAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatus("❌ Please enter a valid yield amount!");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Generating yield...");

      const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, signer);
      
      const parsedAmount = ethers.parseUnits(yieldAmount, decimals);
      const vaultBalance = await usdc.balanceOf(VAULT_ADDRESS);

      if (vaultBalance < parsedAmount) {
        setStatus("⏳ Transferring USDC to vault first...");
        const transferTx = await usdc.transfer(VAULT_ADDRESS, parsedAmount);
        await transferTx.wait();
      }

      const tx = await vault.generateYield(parsedAmount);
      await tx.wait();
      
      setStatus(`✅ Generated ${yieldAmount} USDC yield!`);
      setYieldAmount("");
      await loadData(signer);
    } catch (err) {
      console.error("Generate yield error:", err);
      setStatus(`❌ Failed: ${err.message?.slice(0, 100)}`);
    } finally {
      setLoading(false);
    }
  };

  const collectYield = async () => {
    if (!isOwner) {
      setStatus("❌ Only owner can collect yield!");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Collecting AAVE yield...");

      const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer);
      const tx = await vault.collectYield();
      await tx.wait();

      setStatus("✅ AAVE yield collected successfully!");
      await loadData(signer);
    } catch (err) {
      console.error("Collect yield error:", err);
      setStatus(`❌ Failed: ${err.message?.slice(0, 100)}`);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (signer) {
      await loadData(signer);
      setStatus("✅ Data refreshed!");
    }
  };

  useEffect(() => {
    if (signer) {
      loadData(signer);
      const interval = setInterval(() => loadData(signer), 15000);
      return () => clearInterval(interval);
    }
  }, [signer]);

  const buttonStyle = {
    padding: "clamp(12px, 3vw, 14px)",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: "clamp(14px, 4vw, 16px)",
    fontWeight: "bold",
    transition: "all 0.2s ease",
    width: "100%",
    opacity: loading ? 0.6 : 1,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>
        
        <h1 style={{ color: "#8b5cf6", fontSize: "clamp(24px, 6vw, 36px)", marginBottom: 8, textAlign: "center" }}>
          🔧 Admin Panel
        </h1>
        <p style={{ color: "#9ca3af", textAlign: "center", marginBottom: 32 }}>
          Vault Management & AAVE Controls
        </p>

        {/* Wallet Connect */}
        <div style={{ background: "#111111", padding: 20, borderRadius: 12, marginBottom: 24, border: "1px solid #2a2a2a" }}>
          <button onClick={connectWallet} disabled={loading} style={{ ...buttonStyle, background: account ? "#065f46" : "#3b82f6" }}>
            {account ? `✅ ${account.slice(0,6)}...${account.slice(-4)}` : "🔗 Connect Admin Wallet"}
          </button>
          
          {!isOwner && account && (
            <p style={{ color: "#ef4444", marginTop: 12, textAlign: "center" }}>
              ⚠️ You are not the vault owner! Admin features are restricted.
            </p>
          )}
          
          {isOwner && (
            <p style={{ color: "#10b981", marginTop: 12, textAlign: "center" }}>
              👑 Owner Mode Active — Full Control
            </p>
          )}
          
          {status && (
            <p style={{ color: "#9ca3af", marginTop: 12, fontSize: 13, textAlign: "center" }}>
              {status}
            </p>
          )}
        </div>

        {isOwner && (
          <>
            {/* Vault Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "#1e3a8a", padding: 16, borderRadius: 12, border: "1px solid #3b82f6" }}>
                <p style={{ color: "#9ca3af", marginBottom: 8 }}>💰 Total Deposits</p>
                <p style={{ fontSize: 24, fontWeight: "bold", color: "#e5e5e5" }}>{parseFloat(totalDeposits).toFixed(2)} USDC</p>
              </div>
              <div style={{ background: "#5b21b6", padding: 16, borderRadius: 12, border: "1px solid #8b5cf6" }}>
                <p style={{ color: "#9ca3af", marginBottom: 8 }}>📊 Total Yield</p>
                <p style={{ fontSize: 24, fontWeight: "bold", color: "#c084fc" }}>{parseFloat(totalYield).toFixed(4)} USDC</p>
              </div>
              <div style={{ background: "#065f46", padding: 16, borderRadius: 12, border: "1px solid #10b981" }}>
                <p style={{ color: "#9ca3af", marginBottom: 8 }}>🏦 Vault USDC</p>
                <p style={{ fontSize: 24, fontWeight: "bold", color: "#34d399" }}>{parseFloat(vaultUSDC).toFixed(2)} USDC</p>
              </div>
            </div>

            {/* AAVE Control Card */}
            <div style={{ 
              background: aaveEnabled ? "linear-gradient(135deg, #064e3b 0%, #0a0a0a 100%)" : "linear-gradient(135deg, #451a03 0%, #0a0a0a 100%)",
              padding: "clamp(20px, 5vw, 28px)", 
              borderRadius: 16, 
              marginBottom: 24,
              border: `2px solid ${aaveEnabled ? "#10b981" : "#f59e0b"}`
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, color: aaveEnabled ? "#10b981" : "#f59e0b" }}>
                    🏦 AAVE Integration: {aaveEnabled ? "ENABLED" : "DISABLED"}
                  </h2>
                  <p style={{ margin: "8px 0 0 0", color: "#9ca3af" }}>
                    {aaveEnabled 
                      ? "⚠️ AAVE enabled: Real yield from AAVE pool. Deposit might fail if pool not approved."
                      : "✅ AAVE disabled: Deposit/Withdraw works smoothly. Use manual yield."}
                  </p>
                </div>
                <button 
                  onClick={toggleAave} 
                  disabled={loading}
                  style={{
                    padding: "clamp(12px, 3vw, 16px) clamp(24px, 5vw, 32px)",
                    background: aaveEnabled ? "#ef4444" : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "clamp(14px, 4vw, 16px)",
                    whiteSpace: "nowrap"
                  }}
                >
                  {loading ? "⏳ Processing..." : (aaveEnabled ? "🔴 Disable AAVE" : "🟢 Enable AAVE")}
                </button>
              </div>
            </div>

            {/* Yield Management */}
            <div style={{ background: "#111111", padding: 20, borderRadius: 12, marginBottom: 24, border: "1px solid #2a2a2a" }}>
              <h3 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>🌟 Yield Management</h3>
              
              {!aaveEnabled && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: "#9ca3af", marginBottom: 8, display: "block" }}>Manual Yield Amount (USDC)</label>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <input
                      type="number"
                      placeholder="Enter amount (e.g., 100)"
                      value={yieldAmount}
                      onChange={(e) => setYieldAmount(e.target.value)}
                      style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#e5e5e5" }}
                    />
                    <button onClick={generateYield} disabled={loading} style={{ ...buttonStyle, width: "auto", background: "#10b981", padding: "12px 24px" }}>
                      Generate Yield
                    </button>
                  </div>
                </div>
              )}
              
              {aaveEnabled && (
                <div>
                  <button onClick={collectYield} disabled={loading} style={{ ...buttonStyle, background: "#8b5cf6" }}>
                    🌾 Collect AAVE Yield
                  </button>
                  <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                    Collects accrued yield from AAVE pool and adds to totalYield
                  </p>
                </div>
              )}
            </div>

            {/* Contract Controls */}
            <div style={{ background: "#111111", padding: 20, borderRadius: 12, marginBottom: 24, border: "1px solid #2a2a2a" }}>
              <h3 style={{ margin: "0 0 16px 0", color: "#ef4444" }}>⚙️ Contract Controls</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <button onClick={togglePause} disabled={loading} style={{ ...buttonStyle, background: paused ? "#10b981" : "#ef4444" }}>
                  {paused ? "▶️ Unpause Contract" : "⏸️ Pause Contract"}
                </button>
                <button onClick={refresh} disabled={loading} style={{ ...buttonStyle, background: "#3b82f6" }}>
                  🔄 Refresh Data
                </button>
              </div>
              {paused && (
                <p style={{ color: "#ef4444", marginTop: 12, fontSize: 13, textAlign: "center" }}>
                  ⚠️ Contract is PAUSED — No deposits/withdraws allowed
                </p>
              )}
            </div>

            {/* Info Box */}
            <div style={{ background: "#1e1b4b", padding: 20, borderRadius: 12, border: "1px solid #8b5cf6" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#8b5cf6" }}>📋 Admin Guide</h3>
              <ul style={{ color: "#9ca3af", margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li><strong>Enable AAVE</strong> → Real yield from AAVE pool (may block deposits if not approved)</li>
                <li><strong>Disable AAVE</strong> → Deposit/Withdraw works smoothly, use manual yield</li>
                <li><strong>Best Practice:</strong> Disable AAVE → Deposit → Enable AAVE → Collect Yield</li>
                <li><strong>Pause Contract</strong> → Emergency stop for all user actions</li>
                <li><strong>Manual Yield</strong> → Only when AAVE is disabled</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;