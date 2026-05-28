import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";

const BNB_MAINNET_CHAIN_ID = "0x38";
const BNB_MAINNET_NAME = "BNB Smart Chain";

const ARMY_CONTRACT_ADDRESS = "0x274F9F99237a15e346de226D171c607Fb5E8ca3E";
const VAULT_FACTORY_ADDRESS = "0x4cc87327A76430fF09Fa6879BF85BE09e03d1CBA";

// 主网测试币，不是正式 $EMOJI
const TEST_TOKEN_ADDRESS = "0x1cfe9717be9d02370e3001717e5da157d35e7777";
const BURN_CONTRACT_ADDRESS = "0xd534Af3200adA27829EC116368C24356D6E46211";
const TREASURY_ADDRESS = "0x27e6a487eab81915e428cb41c18511600b1eceea";
const EMOJI_WAR_VAULT_ADDRESS = "0x8b55FA7273c790F1caD86cf96917AcD0469Fc515";
const REWARD_POOL_ADDRESS = "0x5E77b0208cf94EEdd4F038f15DBdC711BF3b7484";

const links = {
  flap: "https://gmgn.ai/bsc/token/0x1cfe9717be9d02370e3001717e5da157d35e7777",
  twitter: "#",
  telegram: "#",
  contract: TEST_TOKEN_ADDRESS
};

const ARMY_ABI = [
  "function currentSeason() view returns (uint256)",
  "function joinArmy(uint8 armyId)",
  "function getUserArmy(uint256 seasonId, address user) view returns (uint8)",
  "function getArmyMembers(uint256 seasonId, uint8 armyId) view returns (uint256)"
];

const TOKEN_ABI = [
  "function balanceOf(address user) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const BURN_ABI = [
  "function burn(uint256 amount)",
  "function getUserBurned(uint256 seasonId, address user) view returns (uint256)",
  "function getArmyBurned(uint256 seasonId, uint8 armyId) view returns (uint256)",
  "function getCurrentSeason() view returns (uint256)",
  "function totalBurned() view returns (uint256)"
];

const VAULT_ABI = [
  "function getVaultBalance() view returns (uint256)",
  "function totalReceived() view returns (uint256)",
  "function totalWithdrawn() view returns (uint256)",
  "function currentSeason() view returns (uint256)",
  "function treasury() view returns (address)",
  "function getSeasonReceived(uint256 seasonId) view returns (uint256)",
  "function getSeasonWithdrawn(uint256 seasonId) view returns (uint256)"
];

const REWARD_POOL_ABI = [
  "function getPoolBalance() view returns (uint256)",
  "function getClaimable(uint256 seasonId, address user) view returns (uint256)",
  "function claimed(uint256 seasonId, address user) view returns (uint256)",
  "function claimable(uint256 seasonId, address user) view returns (uint256)",
  "function seasonDeposited(uint256 seasonId) view returns (uint256)",
  "function seasonClaimed(uint256 seasonId) view returns (uint256)",
  "function totalDeposited() view returns (uint256)",
  "function totalClaimed() view returns (uint256)",
  "function activeDepositSeason() view returns (uint256)",
  "function claim(uint256 seasonId)"
];

const armies = [
  { id: 1, emoji: "🥷", cn: "忍者军团", en: "Ninja Army", slogan: "隐于黑暗，燃烧出击。", desc: "隐忍、突袭、反超。真正的忍者不喊单，只在榜上出现。" },
  { id: 2, emoji: "🚀", cn: "火箭军团", en: "Rocket Army", slogan: "现在集结，之后起飞。", desc: "点火、FOMO、冲向月球。每一次燃烧都是一次点火。" },
  { id: 3, emoji: "💎", cn: "钻石军团", en: "Diamond Army", slogan: "钻石手永不投降。", desc: "信仰、持有、坚定共识。不是谁喊得响，谁赢。" },
  { id: 4, emoji: "🦋", cn: "蝴蝶军团", en: "Butterfly Army", slogan: "每一次燃烧，都是一次进化。", desc: "蜕变、进化、扩散。微小情绪，也能掀起风暴。" },
  { id: 5, emoji: "🔶", cn: "币安军团", en: "Binance Army", slogan: "金色共识，燃烧集结。", desc: "社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。" }
];

function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return window.BinanceChain || window.ethereum || null;
}

function chainIdToHex(id) {
  if (!id) return "";
  if (typeof id === "number") return `0x${id.toString(16)}`;
  if (typeof id === "bigint") return `0x${id.toString(16)}`;
  if (typeof id === "string") return id.startsWith("0x") ? id.toLowerCase() : `0x${Number(id).toString(16)}`;
  return "";
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAmount(value, decimals = 18) {
  try {
    const n = Number(formatUnits(BigInt(value || "0"), decimals));
    if (n >= 1_000_000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
  } catch {
    return "0";
  }
}

function formatBNB(value) {
  try {
    const n = Number(formatUnits(BigInt(value || "0"), 18));
    return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return "0";
  }
}

function armyById(id) {
  return armies.find((army) => army.id === Number(id));
}

function localArmyKey(wallet) {
  return `emoji-war-mainnet-army-${wallet?.toLowerCase()}`;
}

export default function App() {
  const [wallet, setWallet] = useState("");
  const [chainId, setChainId] = useState("");
  const [currentSeason, setCurrentSeason] = useState("1");
  const [selectedArmyId, setSelectedArmyId] = useState(0);
  const [armyMembers, setArmyMembers] = useState({});
  const [armyBurns, setArmyBurns] = useState({});
  const [tokenBalance, setTokenBalance] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [myBurned, setMyBurned] = useState("0");
  const [totalBurned, setTotalBurned] = useState("0");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [vaultTotalReceived, setVaultTotalReceived] = useState("0");
  const [vaultTotalWithdrawn, setVaultTotalWithdrawn] = useState("0");
  const [vaultSeasonReceived, setVaultSeasonReceived] = useState("0");
  const [vaultSeasonWithdrawn, setVaultSeasonWithdrawn] = useState("0");
  const [vaultTreasury, setVaultTreasury] = useState(TREASURY_ADDRESS);
  const [rewardPoolBalance, setRewardPoolBalance] = useState("0");
  const [rewardTotalDeposited, setRewardTotalDeposited] = useState("0");
  const [rewardTotalClaimed, setRewardTotalClaimed] = useState("0");
  const [rewardSeasonDeposited, setRewardSeasonDeposited] = useState("0");
  const [rewardSeasonClaimed, setRewardSeasonClaimed] = useState("0");
  const [myClaimableReward, setMyClaimableReward] = useState("0");
  const [myClaimedReward, setMyClaimedReward] = useState("0");
  const [myTotalAllocation, setMyTotalAllocation] = useState("0");
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSymbol, setTokenSymbol] = useState("EWTEST");
  const [burnAmount, setBurnAmount] = useState("1000");
  const [status, setStatus] = useState("V6.1 主网测试燃烧版已准备。当前使用 EWTEST 测试币。");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const isMainnet = chainId?.toLowerCase() === BNB_MAINNET_CHAIN_ID;
  const selectedArmy = useMemo(() => armyById(selectedArmyId), [selectedArmyId]);

  const burnAmountWei = useMemo(() => {
    try {
      return parseUnits(burnAmount || "0", tokenDecimals);
    } catch {
      return 0n;
    }
  }, [burnAmount, tokenDecimals]);

  const needsApprove = burnAmountWei > BigInt(allowance || "0");

  const rankedArmyBurns = useMemo(() => {
    return [...armies].sort((a, b) => Number(BigInt(armyBurns[b.id] || "0") - BigInt(armyBurns[a.id] || "0")));
  }, [armyBurns]);

  const rankedArmyMembers = useMemo(() => {
    return [...armies].sort((a, b) => Number(BigInt(armyMembers[b.id] || "0") - BigInt(armyMembers[a.id] || "0")));
  }, [armyMembers]);

  useEffect(() => {
    const injected = getInjectedProvider();
    if (!injected) return;

    const init = async () => {
      try {
        const accounts = await injected.request?.({ method: "eth_accounts" });
        const id = await getCurrentChainId();
        setChainId(id);
        if (accounts?.[0]) {
          setWallet(accounts[0]);
          if (id === BNB_MAINNET_CHAIN_ID) await loadAllData(accounts[0]);
          else loadLocalArmyFallback(accounts[0]);
        }
      } catch {}
    };
    init();

    const handleAccountsChanged = (accounts) => {
      const account = accounts?.[0] || "";
      setWallet(account);
      setSelectedArmyId(0);
      if (account) loadLocalArmyFallback(account);
    };

    const handleChainChanged = async (id) => {
      const normalized = chainIdToHex(id);
      setChainId(normalized);
      if (wallet && normalized === BNB_MAINNET_CHAIN_ID) await loadAllData(wallet);
    };

    injected.on?.("accountsChanged", handleAccountsChanged);
    injected.on?.("chainChanged", handleChainChanged);

    return () => {
      injected.removeListener?.("accountsChanged", handleAccountsChanged);
      injected.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [wallet]);

  async function getCurrentChainId() {
    const injected = getInjectedProvider();
    if (!injected) return "";
    try {
      const raw = await injected.request({ method: "eth_chainId" });
      return chainIdToHex(raw);
    } catch {
      try {
        const provider = new BrowserProvider(injected);
        const network = await provider.getNetwork();
        return chainIdToHex(network.chainId);
      } catch {
        return "";
      }
    }
  }

  async function getContract(address, abi, withSigner = false) {
    const injected = getInjectedProvider();
    if (!injected) throw new Error("没有检测到钱包插件。");
    const provider = new BrowserProvider(injected);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(address, abi, signer);
    }
    return new Contract(address, abi, provider);
  }

  function loadLocalArmyFallback(account) {
    if (!account) return;
    const saved = localStorage.getItem(localArmyKey(account));
    if (saved) setSelectedArmyId(Number(saved));
  }

  async function connectWallet() {
    const injected = getInjectedProvider();
    if (!injected) {
      setStatus("没有检测到钱包插件。请先安装 Binance Wallet 或 MetaMask。");
      return;
    }

    try {
      setIsLoading(true);
      const accounts = await injected.request({ method: "eth_requestAccounts" });
      const account = accounts?.[0];
      const id = await getCurrentChainId();

      if (account) setWallet(account);
      setChainId(id);

      if (id !== BNB_MAINNET_CHAIN_ID) {
        setStatus("钱包已连接，但当前不是 BNB Smart Chain 主网。请点击切换主网。");
        loadLocalArmyFallback(account);
      } else if (account) {
        await loadAllData(account);
        setStatus("钱包连接成功，主网数据已刷新。");
      }
    } catch (error) {
      setStatus(error?.message || "钱包连接失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function switchToBnbMainnet() {
    const injected = getInjectedProvider();
    if (!injected) return;

    try {
      setIsLoading(true);
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BNB_MAINNET_CHAIN_ID }]
      });
      setChainId(BNB_MAINNET_CHAIN_ID);
      setStatus("已切换到 BNB Smart Chain，请刷新主网数据。");
      if (wallet) await loadAllData(wallet);
    } catch (switchError) {
      if (switchError?.code === 4902) {
        await injected.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BNB_MAINNET_CHAIN_ID,
            chainName: BNB_MAINNET_NAME,
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com/"]
          }]
        });
        setChainId(BNB_MAINNET_CHAIN_ID);
      } else {
        setStatus(switchError?.message || "切换主网失败。");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAllData(account = wallet) {
    if (!account) return setStatus("请先连接钱包。");

    try {
      setIsLoading(true);
      const id = await getCurrentChainId();
      setChainId(id);

      if (id !== BNB_MAINNET_CHAIN_ID) {
        setStatus("当前不是 BNB Smart Chain 主网，无法读取主网合约。");
        loadLocalArmyFallback(account);
        return;
      }

      const armyContract = await getContract(ARMY_CONTRACT_ADDRESS, ARMY_ABI);
      const tokenContract = await getContract(TEST_TOKEN_ADDRESS, TOKEN_ABI);
      const burnContract = await getContract(BURN_CONTRACT_ADDRESS, BURN_ABI);
      const vaultContract = await getContract(EMOJI_WAR_VAULT_ADDRESS, VAULT_ABI);
      const rewardPoolContract = await getContract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI);

      let decimals = 18;
      let symbol = "EWTEST";
      try { decimals = Number(await tokenContract.decimals()); } catch {}
      try { symbol = await tokenContract.symbol(); } catch {}
      setTokenDecimals(decimals);
      setTokenSymbol(symbol);

      const seasonId = await armyContract.currentSeason();
      setCurrentSeason(seasonId.toString());

      const myArmy = await armyContract.getUserArmy(seasonId, account);
      const onChainArmy = Number(myArmy);
      const savedArmy = Number(localStorage.getItem(localArmyKey(account)) || "0");
      setSelectedArmyId(onChainArmy || savedArmy || 0);

      const [balance, approved, burned, total] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.allowance(account, BURN_CONTRACT_ADDRESS),
        burnContract.getUserBurned(seasonId, account),
        burnContract.totalBurned()
      ]);

      setTokenBalance(balance.toString());
      setAllowance(approved.toString());
      setMyBurned(burned.toString());
      setTotalBurned(total.toString());

      try {
        const [
          vaultBal,
          vaultReceived,
          vaultWithdrawn,
          vaultSeasonIn,
          vaultSeasonOut,
          vaultTreasuryAddress
        ] = await Promise.all([
          vaultContract.getVaultBalance(),
          vaultContract.totalReceived(),
          vaultContract.totalWithdrawn(),
          vaultContract.getSeasonReceived(seasonId),
          vaultContract.getSeasonWithdrawn(seasonId),
          vaultContract.treasury()
        ]);

        setVaultBalance(vaultBal.toString());
        setVaultTotalReceived(vaultReceived.toString());
        setVaultTotalWithdrawn(vaultWithdrawn.toString());
        setVaultSeasonReceived(vaultSeasonIn.toString());
        setVaultSeasonWithdrawn(vaultSeasonOut.toString());
        setVaultTreasury(vaultTreasuryAddress);
      } catch {
        setVaultBalance("0");
        setVaultTotalReceived("0");
        setVaultTotalWithdrawn("0");
        setVaultSeasonReceived("0");
        setVaultSeasonWithdrawn("0");
      }

      try {
        const [
          poolBal,
          totalDeposit,
          totalClaimedAmount,
          seasonDeposit,
          seasonClaimedAmount,
          userClaimable,
          userClaimed,
          userAllocation
        ] = await Promise.all([
          rewardPoolContract.getPoolBalance(),
          rewardPoolContract.totalDeposited(),
          rewardPoolContract.totalClaimed(),
          rewardPoolContract.seasonDeposited(seasonId),
          rewardPoolContract.seasonClaimed(seasonId),
          rewardPoolContract.getClaimable(seasonId, account),
          rewardPoolContract.claimed(seasonId, account),
          rewardPoolContract.claimable(seasonId, account)
        ]);

        setRewardPoolBalance(poolBal.toString());
        setRewardTotalDeposited(totalDeposit.toString());
        setRewardTotalClaimed(totalClaimedAmount.toString());
        setRewardSeasonDeposited(seasonDeposit.toString());
        setRewardSeasonClaimed(seasonClaimedAmount.toString());
        setMyClaimableReward(userClaimable.toString());
        setMyClaimedReward(userClaimed.toString());
        setMyTotalAllocation(userAllocation.toString());
      } catch {
        setRewardPoolBalance("0");
        setRewardTotalDeposited("0");
        setRewardTotalClaimed("0");
        setRewardSeasonDeposited("0");
        setRewardSeasonClaimed("0");
        setMyClaimableReward("0");
        setMyClaimedReward("0");
        setMyTotalAllocation("0");
      }

      const memberData = {};
      const burnData = {};
      for (const army of armies) {
        const [members, burns] = await Promise.all([
          armyContract.getArmyMembers(seasonId, army.id),
          burnContract.getArmyBurned(seasonId, army.id)
        ]);
        memberData[army.id] = members.toString();
        burnData[army.id] = burns.toString();
      }
      setArmyMembers(memberData);
      setArmyBurns(burnData);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setStatus(error?.shortMessage || error?.message || "读取主网数据失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function joinArmyOnChain(armyId) {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isMainnet) return setStatus("请先切换到 BNB Smart Chain 主网。");

    const army = armyById(armyId);

    try {
      setIsLoading(true);
      const contract = await getContract(ARMY_CONTRACT_ADDRESS, ARMY_ABI, true);
      setStatus(`正在加入 ${army.emoji} ${army.cn}，请在钱包确认主网交易。`);
      const tx = await contract.joinArmy(armyId);
      await tx.wait();

      localStorage.setItem(localArmyKey(wallet), String(armyId));
      setSelectedArmyId(armyId);
      setStatus(`主网加入成功：${army.emoji} ${army.cn}`);
      await loadAllData(wallet);
    } catch (error) {
      const msg = error?.reason || error?.shortMessage || error?.message || "交易失败。";
      setStatus(msg.includes("Already joined") ? "你本赛季已经加入过军团，不能重复选择。" : msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function approveBurnContract() {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isMainnet) return setStatus("请先切换到 BNB Smart Chain 主网。");
    if (burnAmountWei <= 0n) return setStatus("请输入大于 0 的燃烧数量。");

    try {
      setIsLoading(true);
      const token = await getContract(TEST_TOKEN_ADDRESS, TOKEN_ABI, true);
      setStatus(`正在授权 ${burnAmount} ${tokenSymbol} 给 Burn 合约，请在钱包确认。`);
      const tx = await token.approve(BURN_CONTRACT_ADDRESS, burnAmountWei);
      await tx.wait();
      setStatus(`授权成功：${burnAmount} ${tokenSymbol}`);
      await loadAllData(wallet);
    } catch (error) {
      setStatus(error?.shortMessage || error?.message || "授权失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function burnForArmy() {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!selectedArmyId) return setStatus("请先链上选择军团。");
    if (!isMainnet) return setStatus("请先切换到 BNB Smart Chain 主网。");
    if (burnAmountWei <= 0n) return setStatus("请输入大于 0 的燃烧数量。");
    if (needsApprove) return setStatus("授权额度不足，请先点击 Approve。");

    try {
      setIsLoading(true);
      const burn = await getContract(BURN_CONTRACT_ADDRESS, BURN_ABI, true);
      setStatus(`正在燃烧 ${burnAmount} ${tokenSymbol}，请在钱包确认。`);
      const tx = await burn.burn(burnAmountWei);
      await tx.wait();
      setStatus(`燃烧成功：${burnAmount} ${tokenSymbol} 已计入 ${selectedArmy?.emoji} ${selectedArmy?.cn}`);
      await loadAllData(wallet);
    } catch (error) {
      const msg = error?.reason || error?.shortMessage || error?.message || "燃烧失败。";
      setStatus(msg.includes("allowance") ? "授权额度不足，请先点击 Approve 授权。" : msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function claimReward() {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isMainnet) return setStatus("请先切换到 BNB Smart Chain 主网。");
    if (BigInt(myClaimableReward || "0") <= 0n) return setStatus("当前没有可领取分红。");

    try {
      setIsLoading(true);
      const rewardPool = await getContract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI, true);
      setStatus(`正在领取 Season ${currentSeason} 分红，请在钱包确认。`);
      const tx = await rewardPool.claim(BigInt(currentSeason));
      await tx.wait();
      setStatus("领取成功，BNB 已发送到你的钱包。");
      await loadAllData(wallet);
    } catch (error) {
      setStatus(error?.shortMessage || error?.reason || error?.message || "领取失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <section className="hero" id="top">
        <div className="nav">
          <div className="brand"><div className="logo tokenLogo"><img src="/token-avatar.png" alt="Emoji War avatar" /></div><div><b>Emoji War</b><span>EWTEST</span></div></div>
          <div className="navLinks">
            <a href="#join">加入军团</a>
            <a href="#burn">燃烧测试</a>
            <a href="#rewards">领取分红</a>
            <a href="#panel">排行榜</a>
            <a href="#vault">合约</a>
          </div>
          <button className="smallBtn" onClick={connectWallet}>{wallet ? shortAddress(wallet) : "Connect Wallet"}</button>
        </div>

        <div className="heroGrid">
          <div className="heroText">
            <p className="pill"><span></span>V6.1 Mainnet Test · EWTEST</p>
            <h1>Emoji War</h1>
            <h2>主网燃烧测试版</h2>
            <p className="lead">
              当前版本使用主网测试币 EWTEST 彩排正式流程。你可以测试：买币、选择军团、授权、燃烧、军团燃烧榜更新、税收金库读取。
            </p>
            <div className="actions">
              <button className="primaryBtn buttonReset" onClick={connectWallet}>{wallet ? "Wallet Connected" : "Connect Wallet"}</button>
              <a className="secondaryBtn" href={links.flap} target="_blank" rel="noreferrer">Buy EWTEST</a>
              <button className="secondaryBtn buttonReset" onClick={() => loadAllData(wallet)} disabled={!wallet || isLoading}>刷新主网数据</button>
            </div>
            <p className="note">
              这是主网测试币版本，不是正式 $EMOJI。最后刷新：{lastUpdated || "未刷新"}
            </p>
          </div>

          <div className="warCard">
            <div className="screenTitle"><span>MAINNET BURN TEST</span><b>Season {currentSeason}</b></div>
            <div className="armyGrid">
              {armies.map((army) => (
                <div className={`miniArmy ${selectedArmyId === army.id ? "activeMini" : ""}`} key={army.cn}>
                  <div>{army.emoji}</div>
                  <b>{army.cn}</b>
                  <span>{formatAmount(armyBurns[army.id] || "0", tokenDecimals)} burned</span>
                </div>
              ))}
            </div>
            <div className="flywheel">买 EWTEST → 选择军团 → Approve → Burn → 排行榜更新</div>
          </div>
        </div>
      </section>

      <section id="join" className="section joinSection">
        <div className="sectionHead">
          <p>Step 1</p>
          <h2>主网选择你的军团</h2>
          <span>Army 合约已部署在 BNB Smart Chain 主网。每个钱包每个赛季只能选择一次军团。</span>
        </div>

        <div className="walletPanel">
          <div className="walletStatus">
            <div className="statusTop"><span>Wallet Status</span><b>{wallet ? "Connected" : "Not Connected"}</b></div>
            <h3>{wallet ? shortAddress(wallet) : "Connect Wallet"}</h3>
            <p>Network: {isMainnet ? "BNB Smart Chain" : chainId ? `Wrong Network (${chainId})` : "Not connected"}</p>
            <p>Army: {selectedArmy ? `${selectedArmy.emoji} ${selectedArmy.cn}` : "Not selected on-chain"}</p>
            <p>Balance: {formatAmount(tokenBalance, tokenDecimals)} {tokenSymbol}</p>
            <p>My Burn: {formatAmount(myBurned, tokenDecimals)} {tokenSymbol}</p>
            <p>Current Season: {currentSeason}</p>
            {status && <div className="statusMessage">{status}</div>}
            <div className="walletActions">
              <button className="primaryBtn buttonReset" onClick={connectWallet} disabled={isLoading}>{isLoading ? "Processing..." : "Connect / Refresh"}</button>
              <button className="secondaryBtn buttonReset" onClick={switchToBnbMainnet} disabled={isLoading}>Switch to BNB Mainnet</button>
            </div>
          </div>

          <div className="chooseArmyBox">
            <h3>选择军团</h3>
            <div className="chooseGrid">
              {armies.map((army) => (
                <button key={army.id} onClick={() => joinArmyOnChain(army.id)} className={selectedArmyId === army.id ? "chosen" : ""} disabled={isLoading || Number(selectedArmyId) !== 0}>
                  <span>{army.emoji}</span><b>{army.cn}</b><small>{army.en}</small>
                </button>
              ))}
            </div>
            <p className="chooseHint">如果你已经在主网选过军团，本赛季不能更换。</p>
          </div>
        </div>
      </section>

      <section id="burn" className="section burnSection">
        <div className="sectionHead">
          <p>Step 2</p>
          <h2>燃烧 EWTEST 冲榜</h2>
          <span>先 Approve 授权 Burn 合约，再 Burn 燃烧。燃烧后自动计入个人燃烧量和军团燃烧量。</span>
        </div>

        <div className="burnPanel">
          <div className="burnBox">
            <h3>Burn to Fight</h3>
            <label>燃烧数量</label>
            <input value={burnAmount} onChange={(e) => setBurnAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="1000" />
            <div className="burnStats">
              <div><p>授权额度</p><b>{formatAmount(allowance, tokenDecimals)} {tokenSymbol}</b></div>
              <div><p>全赛季总燃烧</p><b>{formatAmount(totalBurned, tokenDecimals)} {tokenSymbol}</b></div>
            </div>
            <div className="walletActions">
              <button className="secondaryBtn buttonReset" onClick={approveBurnContract} disabled={isLoading || burnAmountWei <= 0n}>Approve</button>
              <button className="primaryBtn buttonReset" onClick={burnForArmy} disabled={isLoading || burnAmountWei <= 0n || needsApprove}>Burn</button>
            </div>
            <p className="chooseHint">{needsApprove ? "当前授权额度不足，请先点击 Approve。" : "授权额度足够，可以点击 Burn。"}</p>
          </div>

          <div className="burnBox">
            <h3>测试币说明</h3>
            <p>当前接入的是 EWTEST 主网测试币，用来彩排正式 $EMOJI 流程。</p>
            <p>正式上线时，这里的 EWTEST 会替换成 $EMOJI。</p>
            <a className="secondaryBtn inlineLink" href={links.flap} target="_blank" rel="noreferrer">Buy EWTEST</a>
          </div>
        </div>
      </section>

      <section id="panel" className="section panelSection">
        <div className="sectionHead">
          <p>War Dashboard</p>
          <h2>Season {currentSeason} 燃烧排行榜</h2>
          <span>军团成员数和燃烧数据均从 BNB Smart Chain 主网合约读取。</span>
        </div>

        <div className="rankingGrid">
          <div className="rankingCard">
            <div className="rankingHead"><h3>军团燃烧榜</h3><span>Army Burn Ranking</span></div>
            {rankedArmyBurns.map((army, index) => (
              <div className="armyRow" key={army.cn}>
                <div className="rankBadge">{index + 1}</div>
                <div className="armyName"><span>{army.emoji}</span><div><b>{army.cn}</b><p>{army.en}</p></div></div>
                <div className="armyBurn"><b>{formatAmount(armyBurns[army.id] || "0", tokenDecimals)}</b><p>{tokenSymbol} burned</p></div>
              </div>
            ))}
          </div>

          <div className="rankingCard">
            <div className="rankingHead"><h3>军团成员榜</h3><span>Army Members</span></div>
            {rankedArmyMembers.map((army, index) => (
              <div className="armyRow" key={army.cn}>
                <div className="rankBadge">{index + 1}</div>
                <div className="armyName"><span>{army.emoji}</span><div><b>{army.cn}</b><p>{army.en}</p></div></div>
                <div className="armyBurn"><b>{armyMembers[army.id] || "0"}</b><p>members</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rewards" className="section rewardSection">
        <div className="sectionHead">
          <p>RewardPool</p>
          <h2>税收分红领取</h2>
          <span>这里读取 EmojiWarRewardPool。项目方/Operator 设置你的可领取额度后，你可以点击 Claim 领取 BNB。</span>
        </div>

        <div className="rewardPanel">
          <div className="rewardClaimBox">
            <div className="rewardIcon">💰</div>
            <h3>Claim Season {currentSeason} Reward</h3>
            <p>可领取 BNB：</p>
            <b>{formatBNB(myClaimableReward)} BNB</b>
            <div className="walletActions">
              <button className="primaryBtn buttonReset" onClick={claimReward} disabled={isLoading || BigInt(myClaimableReward || "0") <= 0n}>Claim</button>
              <button className="secondaryBtn buttonReset" onClick={() => loadAllData(wallet)} disabled={!wallet || isLoading}>刷新分红数据</button>
            </div>
            <p className="chooseHint">如果显示 0，说明当前钱包还没有被设置可领取额度，或已经领取完。</p>
          </div>

          <div className="rewardStatsGrid">
            <div className="rewardStat highlight"><span>Pool Balance</span><b>{formatBNB(rewardPoolBalance)} BNB</b><p>RewardPool 当前余额</p></div>
            <div className="rewardStat"><span>My Allocation</span><b>{formatBNB(myTotalAllocation)} BNB</b><p>本赛季总分配额度</p></div>
            <div className="rewardStat"><span>My Claimed</span><b>{formatBNB(myClaimedReward)} BNB</b><p>我已领取金额</p></div>
            <div className="rewardStat"><span>Season Deposited</span><b>{formatBNB(rewardSeasonDeposited)} BNB</b><p>当前赛季注入分红池</p></div>
            <div className="rewardStat"><span>Season Claimed</span><b>{formatBNB(rewardSeasonClaimed)} BNB</b><p>当前赛季已领取</p></div>
            <div className="rewardStat"><span>Total Deposited</span><b>{formatBNB(rewardTotalDeposited)} BNB</b><p>累计注入分红池</p></div>
            <div className="rewardStat"><span>Total Claimed</span><b>{formatBNB(rewardTotalClaimed)} BNB</b><p>累计领取</p></div>
            <div className="rewardStat"><span>RewardPool</span><b>{shortAddress(REWARD_POOL_ADDRESS)}</b><p>{REWARD_POOL_ADDRESS}</p></div>
          </div>
        </div>
      </section>

      <section id="vault" className="section vaultSection">
        <div className="sectionHead">
          <p>EmojiWarVault</p>
          <h2>税收金库实时数据</h2>
          <span>这里读取 Flap 创建出来的 EmojiWarVault。买卖 EWTEST 产生的税收会进入这个金库。</span>
        </div>

        <div className="vaultStatsGrid">
          <div className="vaultStat highlight"><span>Vault Balance</span><b>{formatBNB(vaultBalance)} BNB</b><p>当前金库余额</p></div>
          <div className="vaultStat"><span>Total Received</span><b>{formatBNB(vaultTotalReceived)} BNB</b><p>累计收到税收</p></div>
          <div className="vaultStat"><span>Total Withdrawn</span><b>{formatBNB(vaultTotalWithdrawn)} BNB</b><p>累计提现</p></div>
          <div className="vaultStat"><span>Season Received</span><b>{formatBNB(vaultSeasonReceived)} BNB</b><p>当前赛季收入</p></div>
          <div className="vaultStat"><span>Season Withdrawn</span><b>{formatBNB(vaultSeasonWithdrawn)} BNB</b><p>当前赛季提现</p></div>
        </div>

        <div className="vaultGrid">
          <div className="vaultBox ready"><span>EmojiWarVault</span><b>{shortAddress(EMOJI_WAR_VAULT_ADDRESS)}</b><p>{EMOJI_WAR_VAULT_ADDRESS}</p></div>
          <div className="vaultBox ready"><span>Vault Treasury</span><b>{shortAddress(vaultTreasury)}</b><p>{vaultTreasury}</p></div>
          <div className="vaultBox ready"><span>EWTEST Token</span><b>{shortAddress(TEST_TOKEN_ADDRESS)}</b><p>{TEST_TOKEN_ADDRESS}</p></div>
          <div className="vaultBox ready"><span>Burn Contract</span><b>{shortAddress(BURN_CONTRACT_ADDRESS)}</b><p>{BURN_CONTRACT_ADDRESS}</p></div>
          <div className="vaultBox ready"><span>VaultFactory</span><b>{shortAddress(VAULT_FACTORY_ADDRESS)}</b><p>{VAULT_FACTORY_ADDRESS}</p></div>
          <div className="vaultBox ready"><span>RewardPool</span><b>{shortAddress(REWARD_POOL_ADDRESS)}</b><p>{REWARD_POOL_ADDRESS}</p></div>
        </div>
      </section>

      <section id="armies" className="section dark">
        <div className="sectionHead"><p>Five Armies</p><h2>五大 Emoji 军团</h2><span>选择你的情绪身份，燃烧冲击排行榜。</span></div>
        <div className="cards">
          {armies.map((army) => (
            <article className={`card ${selectedArmyId === army.id ? "selectedCard" : ""}`} key={army.cn}>
              <div className="bigEmoji">{army.emoji}</div><h3>{army.cn}</h3><p className="en">{army.en}</p><b>{army.slogan}</b><span>{army.desc}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="rules" className="section dark">
        <div className="sectionHead"><p>Rules</p><h2>主网测试规则</h2><span>这是正式上线前的主网彩排版本。</span></div>
        <div className="rulesList">
          <div><b>01</b><p>连接钱包并切换到 BNB Smart Chain 主网。</p></div>
          <div><b>02</b><p>在 Flap / GMGN 页面买入少量 EWTEST 测试币。</p></div>
          <div><b>03</b><p>链上选择一个 Emoji 军团，每个赛季只能选择一次。</p></div>
          <div><b>04</b><p>Approve 授权 Burn 合约后，点击 Burn 燃烧 EWTEST。</p></div>
          <div><b>05</b><p>Operator 设置分红额度后，用户可点击 Claim 领取 BNB。</p></div>
          <div><b>06</b><p>测试通过后，正式上线时替换为 $EMOJI。</p></div>
        </div>
        <div className="quote"><h2>不是谁喊得响，谁赢。是谁烧得多，谁赢。</h2><p>情绪上链，燃烧开战。</p></div>
      </section>

      <footer>
        <div>
          <b>Emoji War / EWTEST</b>
          <p>Mainnet test version. Not official $EMOJI.</p>
          <p>Token: {TEST_TOKEN_ADDRESS}</p>
          <p>Burn: {BURN_CONTRACT_ADDRESS}</p>
          <p>Vault: {EMOJI_WAR_VAULT_ADDRESS}</p>
          <p>RewardPool: {REWARD_POOL_ADDRESS}</p>
        </div>
        <div className="footerLinks">
          <a href={links.twitter}>X / Twitter</a>
          <a href={links.telegram}>Telegram</a>
          <a href={links.flap} target="_blank" rel="noreferrer">Buy EWTEST</a>
        </div>
      </footer>
    </main>
  );
}
