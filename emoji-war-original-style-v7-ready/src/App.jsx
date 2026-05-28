import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";

const BNB_MAINNET_CHAIN_ID = "0x38";
const BNB_MAINNET_NAME = "BNB Smart Chain";

const ARMY_CONTRACT_ADDRESS = "0xeB472e8863bce01C3D108477A036A7D24Fd34B38";
const VAULT_FACTORY_ADDRESS = "0x4cc87327A76430fF09Fa6879BF85BE09e03d1CBA";

// 主网测试币，不是正式 $EMOJI
const TEST_TOKEN_ADDRESS = "0x1cfe9717be9d02370e3001717e5da157d35e7777";
const BURN_CONTRACT_ADDRESS = "0x7eB94A7E2fa35d9491d1043a230B201A70052CFA";
const TREASURY_ADDRESS = "0x27e6a487eab81915e428cb41c18511600b1eceea";
const EMOJI_WAR_VAULT_ADDRESS = "0x8b55FA7273c790F1caD86cf96917AcD0469Fc515";
const REWARD_POOL_ADDRESS = "0xf354AC72248458011e5B5A28b61018B3E11908d6";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MIN_HOLD_TEXT = "500,000";

const links = {
  flap: "https://gmgn.ai/bsc/token/0x1cfe9717be9d02370e3001717e5da157d35e7777",
  twitter: "#",
  telegram: "#",
  contract: TEST_TOKEN_ADDRESS
};

const ARMY_ABI = [
  "function currentSeason() view returns (uint256)",
  "function currentSeasonStart() view returns (uint256)",
  "function currentSeasonEnd() view returns (uint256)",
  "function seasonStartTime(uint256 seasonId) view returns (uint256)",
  "function seasonEndTime(uint256 seasonId) view returns (uint256)",
  "function isSeasonEnded(uint256 seasonId) view returns (bool)",
  "function secondsUntilCurrentSeasonEnds() view returns (uint256)",
  "function joinArmy(uint8 armyId)",
  "function getUserArmy(uint256 seasonId, address user) view returns (uint8)",
  "function getArmyMembers(uint256 seasonId, uint8 armyId) view returns (uint256)",
  "function getArmyName(uint8 armyId) pure returns (string)"
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
  "function minimumRewardBurnAmount() view returns (uint256)",
  "function totalBurnedAllSeasons() view returns (uint256)",
  "function seasonTotalBurned(uint256 seasonId) view returns (uint256)",
  "function seasonEligibleBurned(uint256 seasonId) view returns (uint256)",
  "function userBurned(uint256 seasonId, address user) view returns (uint256)",
  "function armyBurned(uint256 seasonId, uint8 armyId) view returns (uint256)",
  "function armyEligibleBurned(uint256 seasonId, uint8 armyId) view returns (uint256)",
  "function getTopUser(uint256 seasonId, uint8 rank) view returns (address)",
  "function getTopAmount(uint256 seasonId, uint8 rank) view returns (uint256)",
  "function getWinningArmy(uint256 seasonId) view returns (uint8 winningArmy, uint256 winningAmount)",
  "function getCurrentSeason() view returns (uint256)"
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
  "function minHoldAmount() view returns (uint256)",
  "function hasMinHold(address user) view returns (bool)",
  "function activeDepositSeason() view returns (uint256)",
  "function getPoolBalance() view returns (uint256)",
  "function getRealtimeClaimable(address user) view returns (uint256)",
  "function getSeasonBonusClaimable(uint256 seasonId, address user) view returns (uint256)",
  "function getSeasonInfo(uint256 seasonId) view returns (bool finalized,bool ended,uint256 deposited,uint256 bonusDeposited,uint256 bonusClaimed,uint256 totalBurned,uint256 eligibleBurned,uint8 winningArmy,address top1,address top2,address top3)",
  "function claimRealtime()",
  "function claimSeasonBonus(uint256 seasonId)",
  "function claimAll(uint256[] seasonIds, bool includeRealtime)"
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

function formatCountdown(sec) {
  const s = Math.max(0, Number(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h}h ${m}m ${r}s`;
}

function armyById(id) {
  return armies.find((army) => army.id === Number(id));
}

function localArmyKey(wallet) {
  return `emoji-war-mainnet-army-${wallet?.toLowerCase()}`;
}

async function safeRead(fn, fallback) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default function App() {
  const [wallet, setWallet] = useState("");
  const [chainId, setChainId] = useState("");
  const [currentSeason, setCurrentSeason] = useState("1");
  const [secondsLeft, setSecondsLeft] = useState("0");
  const [selectedArmyId, setSelectedArmyId] = useState(0);
  const [armyMembers, setArmyMembers] = useState({});
  const [armyBurns, setArmyBurns] = useState({});
  const [tokenBalance, setTokenBalance] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [myBurned, setMyBurned] = useState("0");
  const [totalBurned, setTotalBurned] = useState("0");
  const [eligibleBurned, setEligibleBurned] = useState("0");
  const [winningArmyId, setWinningArmyId] = useState(0);
  const [winningArmyBurn, setWinningArmyBurn] = useState("0");
  const [topUsers, setTopUsers] = useState([]);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [vaultTotalReceived, setVaultTotalReceived] = useState("0");
  const [vaultTotalWithdrawn, setVaultTotalWithdrawn] = useState("0");
  const [vaultSeasonReceived, setVaultSeasonReceived] = useState("0");
  const [vaultSeasonWithdrawn, setVaultSeasonWithdrawn] = useState("0");
  const [vaultTreasury, setVaultTreasury] = useState(TREASURY_ADDRESS);
  const [rewardPoolBalance, setRewardPoolBalance] = useState("0");
  const [activeDepositSeason, setActiveDepositSeason] = useState("0");
  const [realtimeClaimable, setRealtimeClaimable] = useState("0");
  const [seasonBonusClaimable, setSeasonBonusClaimable] = useState("0");
  const [hasMinHold, setHasMinHold] = useState(false);
  const [minHoldAmount, setMinHoldAmount] = useState("500000000000000000000000");
  const [seasonBonusDeposited, setSeasonBonusDeposited] = useState("0");
  const [seasonBonusClaimed, setSeasonBonusClaimed] = useState("0");
  const [seasonFinalized, setSeasonFinalized] = useState(false);
  const [seasonEnded, setSeasonEnded] = useState(false);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSymbol, setTokenSymbol] = useState("EWTEST");
  const [burnAmount, setBurnAmount] = useState("1000");
  const [status, setStatus] = useState("V7 主网测试版已准备。当前使用 EWTEST 测试币。");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const isMainnet = chainId?.toLowerCase() === BNB_MAINNET_CHAIN_ID;
  const selectedArmy = useMemo(() => armyById(selectedArmyId), [selectedArmyId]);
  const winningArmy = useMemo(() => armyById(winningArmyId), [winningArmyId]);

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

  const activeTopUsers = useMemo(() => {
    return topUsers.filter((row) => row.user && row.user !== ZERO_ADDRESS && BigInt(row.amount || "0") > 0n);
  }, [topUsers]);

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
        setStatus("钱包连接成功，V7 主网数据已刷新。");
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
      setStatus("已切换到 BNB Smart Chain，请刷新 V7 主网数据。");
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
        setStatus("当前不是 BNB Smart Chain 主网，无法读取 V7 主网合约。");
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

      const myArmy = await safeRead(() => armyContract.getUserArmy(seasonId, account), 0n);
      const onChainArmy = Number(myArmy);
      const savedArmy = Number(localStorage.getItem(localArmyKey(account)) || "0");
      setSelectedArmyId(onChainArmy || savedArmy || 0);

      const [balance, approved, burned, allBurned, seasonBurned, seasonEligible, seconds] = await Promise.all([
        safeRead(() => tokenContract.balanceOf(account), 0n),
        safeRead(() => tokenContract.allowance(account, BURN_CONTRACT_ADDRESS), 0n),
        safeRead(() => burnContract.userBurned(seasonId, account), 0n),
        safeRead(() => burnContract.totalBurnedAllSeasons(), 0n),
        safeRead(() => burnContract.seasonTotalBurned(seasonId), 0n),
        safeRead(() => burnContract.seasonEligibleBurned(seasonId), 0n),
        safeRead(() => armyContract.secondsUntilCurrentSeasonEnds(), 0n)
      ]);

      setTokenBalance(balance.toString());
      setAllowance(approved.toString());
      setMyBurned(burned.toString());
      setTotalBurned((allBurned || seasonBurned).toString());
      setEligibleBurned(seasonEligible.toString());
      setSecondsLeft(seconds.toString());

      const [winningId, winningAmount] = await safeRead(() => burnContract.getWinningArmy(seasonId), [0n, 0n]);
      setWinningArmyId(Number(winningId));
      setWinningArmyBurn(winningAmount.toString());

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
          realtime,
          seasonBonus,
          holdOk,
          minHold,
          activeSeason,
          info
        ] = await Promise.all([
          rewardPoolContract.getPoolBalance(),
          rewardPoolContract.getRealtimeClaimable(account),
          rewardPoolContract.getSeasonBonusClaimable(seasonId, account),
          rewardPoolContract.hasMinHold(account),
          rewardPoolContract.minHoldAmount(),
          rewardPoolContract.activeDepositSeason(),
          rewardPoolContract.getSeasonInfo(seasonId)
        ]);

        setRewardPoolBalance(poolBal.toString());
        setRealtimeClaimable(realtime.toString());
        setSeasonBonusClaimable(seasonBonus.toString());
        setHasMinHold(Boolean(holdOk));
        setMinHoldAmount(minHold.toString());
        setActiveDepositSeason(activeSeason.toString());
        setSeasonFinalized(Boolean(info?.[0]));
        setSeasonEnded(Boolean(info?.[1]));
        setSeasonBonusDeposited((info?.[3] || 0n).toString());
        setSeasonBonusClaimed((info?.[4] || 0n).toString());
      } catch {
        setRewardPoolBalance("0");
        setRealtimeClaimable("0");
        setSeasonBonusClaimable("0");
        setHasMinHold(false);
        setActiveDepositSeason("0");
        setSeasonBonusDeposited("0");
        setSeasonBonusClaimed("0");
      }

      const memberData = {};
      const burnData = {};
      for (const army of armies) {
        const [members, burns] = await Promise.all([
          safeRead(() => armyContract.getArmyMembers(seasonId, army.id), 0n),
          safeRead(() => burnContract.armyBurned(seasonId, army.id), 0n)
        ]);
        memberData[army.id] = members.toString();
        burnData[army.id] = burns.toString();
      }
      setArmyMembers(memberData);
      setArmyBurns(burnData);

      const top = [];
      for (let rank = 1; rank <= 10; rank++) {
        const [user, amount] = await Promise.all([
          safeRead(() => burnContract.getTopUser(seasonId, rank), ZERO_ADDRESS),
          safeRead(() => burnContract.getTopAmount(seasonId, rank), 0n)
        ]);
        top.push({ rank, user, amount: amount.toString() });
      }
      setTopUsers(top);

      setLastUpdated(new Date().toLocaleTimeString());
      setStatus("V7 主网数据已刷新。");
    } catch (error) {
      setStatus(error?.shortMessage || error?.message || "读取 V7 主网数据失败。");
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
      setStatus(`正在加入 ${army.emoji} ${army.cn}，请在钱包确认 V7 主网交易。`);
      const tx = await contract.joinArmy(armyId);
      await tx.wait();

      localStorage.setItem(localArmyKey(wallet), String(armyId));
      setSelectedArmyId(armyId);
      setStatus(`V7 主网加入成功：${army.emoji} ${army.cn}`);
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
      setStatus(`正在授权 ${burnAmount} ${tokenSymbol} 给 V7 Burn 合约，请在钱包确认。`);
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

  async function claimRealtimeReward() {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isMainnet) return setStatus("请先切换到 BNB Smart Chain 主网。");
    if (!hasMinHold) return setStatus(`Claim 时必须持有至少 ${MIN_HOLD_TEXT} ${tokenSymbol}。`);
    if (BigInt(realtimeClaimable || "0") <= 0n) return setStatus("当前没有实时可领取分红。");

    try {
      setIsLoading(true);
      const rewardPool = await getContract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI, true);
      setStatus("正在领取实时燃烧分红，请在钱包确认。");
      const tx = await rewardPool.claimRealtime();
      await tx.wait();
      setStatus("实时分红领取成功，BNB 已发送到你的钱包。");
      await loadAllData(wallet);
    } catch (error) {
      setStatus(error?.shortMessage || error?.reason || error?.message || "实时分红领取失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function claimSeasonBonusReward() {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isMainnet) return setStatus("请先切换到 BNB Smart Chain 主网。");
    if (!hasMinHold) return setStatus(`Claim 时必须持有至少 ${MIN_HOLD_TEXT} ${tokenSymbol}。`);
    if (BigInt(seasonBonusClaimable || "0") <= 0n) return setStatus("当前没有赛季奖励可领取。");

    try {
      setIsLoading(true);
      const rewardPool = await getContract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI, true);
      setStatus(`正在领取 Season ${currentSeason} 赛季奖励，请在钱包确认。`);
      const tx = await rewardPool.claimSeasonBonus(BigInt(currentSeason));
      await tx.wait();
      setStatus("赛季奖励领取成功，BNB 已发送到你的钱包。");
      await loadAllData(wallet);
    } catch (error) {
      setStatus(error?.shortMessage || error?.reason || error?.message || "赛季奖励领取失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function claimAllRewards() {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isMainnet) return setStatus("请先切换到 BNB Smart Chain 主网。");
    if (!hasMinHold) return setStatus(`Claim 时必须持有至少 ${MIN_HOLD_TEXT} ${tokenSymbol}。`);

    try {
      setIsLoading(true);
      const rewardPool = await getContract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI, true);
      setStatus("正在一键领取实时分红和赛季奖励，请在钱包确认。");
      const tx = await rewardPool.claimAll([BigInt(currentSeason)], true);
      await tx.wait();
      setStatus("Claim All 成功，BNB 已发送到你的钱包。");
      await loadAllData(wallet);
    } catch (error) {
      setStatus(error?.shortMessage || error?.reason || error?.message || "一键领取失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <section className="hero" id="top">
        <div className="nav">
          <div className="brand"><div className="logo tokenLogo"><img src="/token-avatar.png" alt="Emoji War avatar" /></div><div><b>Emoji War</b><span>EWTEST · V7</span></div></div>
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
            <p className="pill"><span></span>V7 Final Mainnet Test · EWTEST</p>
            <h1>Emoji War</h1>
            <h2>黑洞金库开战</h2>
            <p className="lead">
              保留原版官网风格，升级 V7 机制：买币、选择军团、授权、燃烧、实时分红、赛季奖励、Top10 排行榜、税收金库读取。
            </p>
            <div className="actions">
              <button className="primaryBtn buttonReset" onClick={connectWallet}>{wallet ? "Wallet Connected" : "Connect Wallet"}</button>
              <a className="secondaryBtn" href={links.flap} target="_blank" rel="noreferrer">Buy EWTEST</a>
              <button className="secondaryBtn buttonReset" onClick={() => loadAllData(wallet)} disabled={!wallet || isLoading}>刷新 V7 数据</button>
            </div>
            <p className="note">
              当前为 V7 主网测试币版本，不是正式 $EMOJI。最后刷新：{lastUpdated || "未刷新"}
            </p>
          </div>

          <div className="warCard">
            <div className="screenTitle"><span>V7 BURN SHARE TEST</span><b>Season {currentSeason}</b></div>
            <div className="armyGrid">
              {armies.map((army) => (
                <div className={`miniArmy ${selectedArmyId === army.id ? "activeMini" : ""}`} key={army.cn}>
                  <div>{army.emoji}</div>
                  <b>{army.cn}</b>
                  <span>{formatAmount(armyBurns[army.id] || "0", tokenDecimals)} burned</span>
                </div>
              ))}
            </div>
            <div className="flywheel">买 EWTEST → 选择军团 → Burn → 50% 实时分红 · 30% 冠军 · 20% Top10</div>
          </div>
        </div>
      </section>

      <section id="join" className="section joinSection">
        <div className="sectionHead">
          <p>Step 1</p>
          <h2>主网选择你的军团</h2>
          <span>Army V7 合约已部署在 BNB Smart Chain 主网。新赛季可主动切换，不切换默认继承情绪阵营。</span>
        </div>

        <div className="walletPanel">
          <div className="walletStatus">
            <div className="statusTop"><span>Wallet Status</span><b>{wallet ? "Connected" : "Not Connected"}</b></div>
            <h3>{wallet ? shortAddress(wallet) : "Connect Wallet"}</h3>
            <p>Network: {isMainnet ? "BNB Smart Chain" : chainId ? `Wrong Network (${chainId})` : "Not connected"}</p>
            <p>Army: {selectedArmy ? `${selectedArmy.emoji} ${selectedArmy.cn}` : "Not selected on-chain"}</p>
            <p>Balance: {formatAmount(tokenBalance, tokenDecimals)} {tokenSymbol} <span className={hasMinHold ? "statusTag" : "statusTag bad"}>{hasMinHold ? "满足持币门槛" : `需要 ${MIN_HOLD_TEXT}+`}</span></p>
            <p>My Burn: {formatAmount(myBurned, tokenDecimals)} {tokenSymbol}</p>
            <p>Current Season: {currentSeason} · Ends in {formatCountdown(secondsLeft)}</p>
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
                <button key={army.id} onClick={() => joinArmyOnChain(army.id)} className={selectedArmyId === army.id ? "chosen" : ""} disabled={isLoading}>
                  <span>{army.emoji}</span><b>{army.cn}</b><small>{army.en}</small>
                </button>
              ))}
            </div>
            <p className="chooseHint">V7：选择军团后燃烧才会计入军团战争。币安军团为社区自发情绪阵营，非 Binance 官方关联。</p>
          </div>
        </div>
      </section>

      <section id="burn" className="section burnSection">
        <div className="sectionHead">
          <p>Step 2</p>
          <h2>燃烧 EWTEST 获得 Burn Share</h2>
          <span>先 Approve 授权 V7 Burn 合约，再 Burn 燃烧。Burn Share 有效期 7 天，只参与燃烧之后进入池子的实时分红。</span>
        </div>

        <div className="burnPanel">
          <div className="burnBox">
            <h3>Burn to Fight</h3>
            <label>燃烧数量</label>
            <input value={burnAmount} onChange={(e) => setBurnAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="1000" />
            <div className="burnStats">
              <div><p>授权额度</p><b>{formatAmount(allowance, tokenDecimals)} {tokenSymbol}</b></div>
              <div><p>全赛季总燃烧</p><b>{formatAmount(totalBurned, tokenDecimals)} {tokenSymbol}</b></div>
              <div><p>当前赛季有效燃烧</p><b>{formatAmount(eligibleBurned, tokenDecimals)} {tokenSymbol}</b></div>
              <div><p>当前冠军军团</p><b>{winningArmy ? `${winningArmy.emoji} ${winningArmy.cn}` : "暂无"}</b></div>
            </div>
            <div className="walletActions">
              <button className="secondaryBtn buttonReset" onClick={approveBurnContract} disabled={isLoading || burnAmountWei <= 0n}>Approve</button>
              <button className="primaryBtn buttonReset" onClick={burnForArmy} disabled={isLoading || burnAmountWei <= 0n || needsApprove}>Burn</button>
            </div>
            <p className="chooseHint">{needsApprove ? "当前授权额度不足，请先点击 Approve。" : "授权额度足够，可以点击 Burn。"}</p>
          </div>

          <div className="burnBox">
            <h3>V7 分红规则</h3>
            <p>50%：实时燃烧贡献池，按 Burn Share 分红。</p>
            <p>30%：冠军军团奖励池，赛季结束后分配。</p>
            <p>20%：Top10 排行榜奖励池，Top1 30%，Top2 20%，Top3 15%，Top4-10 各 5%。</p>
            <p>Claim 时必须持有至少 {formatAmount(minHoldAmount, tokenDecimals)} {tokenSymbol}。</p>
            <a className="secondaryBtn inlineLink" href={links.flap} target="_blank" rel="noreferrer">Buy EWTEST</a>
          </div>
        </div>
      </section>

      <section id="panel" className="section panelSection">
        <div className="sectionHead">
          <p>War Dashboard</p>
          <h2>Season {currentSeason} 燃烧排行榜</h2>
          <span>军团成员数、军团燃烧、Top10 个人燃烧榜均从 BNB Smart Chain V7 合约读取。</span>
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

          <div className="rankingCard topRankingCard">
            <div className="rankingHead"><h3>Top10 个人燃烧榜</h3><span>Top Burn Ranking</span></div>
            {activeTopUsers.length === 0 ? (
              <div className="statusMessage">暂无 Top10 数据，连接钱包并刷新 V7 数据后显示。</div>
            ) : activeTopUsers.map((row) => (
              <div className="armyRow topUserRow" key={row.rank}>
                <div className="rankBadge">{row.rank}</div>
                <div className="armyName"><span>🔥</span><div><b>{shortAddress(row.user)}</b><p>{row.user}</p></div></div>
                <div className="armyBurn"><b>{formatAmount(row.amount, tokenDecimals)}</b><p>{tokenSymbol} burned</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rewards" className="section rewardSection">
        <div className="sectionHead">
          <p>RewardPool V7</p>
          <h2>税收分红领取</h2>
          <span>这里读取 EmojiWarRewardPool V7。实时分红可直接领取，赛季奖励需赛季结束并 finalize 后领取。</span>
        </div>

        <div className="v7SplitNotice">
          <div><b>50%</b><p>个人燃烧贡献池：Burn Share 7 天有效，实时 Claim。</p></div>
          <div><b>30%</b><p>冠军军团奖励池：赛季结束后，胜利军团内分配。</p></div>
          <div><b>20%</b><p>Top10 排行榜奖励池：按个人燃烧排名分配。</p></div>
        </div>

        <div className="rewardPanel">
          <div className="rewardClaimBox">
            <div className="rewardIcon">💰</div>
            <h3>Claim V7 Rewards</h3>
            <p>实时可领取 BNB：</p>
            <b>{formatBNB(realtimeClaimable)} BNB</b>
            <p>赛季奖励 BNB：{formatBNB(seasonBonusClaimable)} BNB</p>
            <p>{hasMinHold ? "已满足持币门槛" : `Claim 需要持有至少 ${MIN_HOLD_TEXT} ${tokenSymbol}`}</p>
            <div className="walletActions rewardClaimActions">
              <button className="primaryBtn buttonReset" onClick={claimRealtimeReward} disabled={isLoading || BigInt(realtimeClaimable || "0") <= 0n}>Claim Realtime</button>
              <button className="secondaryBtn buttonReset" onClick={claimSeasonBonusReward} disabled={isLoading || BigInt(seasonBonusClaimable || "0") <= 0n}>Claim Season Bonus</button>
              <button className="secondaryBtn buttonReset" onClick={claimAllRewards} disabled={isLoading}>Claim All</button>
              <button className="secondaryBtn buttonReset" onClick={() => loadAllData(wallet)} disabled={!wallet || isLoading}>刷新分红数据</button>
            </div>
            <p className="chooseHint">如果显示 0，说明当前没有可领取额度，或者赛季奖励尚未结算。</p>
          </div>

          <div className="rewardStatsGrid">
            <div className="rewardStat highlight"><span>Pool Balance</span><b>{formatBNB(rewardPoolBalance)} BNB</b><p>RewardPool V7 当前余额</p></div>
            <div className="rewardStat"><span>Realtime Claimable</span><b>{formatBNB(realtimeClaimable)} BNB</b><p>50% 实时燃烧分红</p></div>
            <div className="rewardStat"><span>Season Bonus</span><b>{formatBNB(seasonBonusClaimable)} BNB</b><p>30% 冠军 + 20% Top10</p></div>
            <div className="rewardStat"><span>Hold Status</span><b>{hasMinHold ? "Eligible" : "Need More"}</b><p>最低持币 {formatAmount(minHoldAmount, tokenDecimals)} {tokenSymbol}</p></div>
            <div className="rewardStat"><span>Season Bonus Deposited</span><b>{formatBNB(seasonBonusDeposited)} BNB</b><p>当前赛季奖励池注入</p></div>
            <div className="rewardStat"><span>Season Bonus Claimed</span><b>{formatBNB(seasonBonusClaimed)} BNB</b><p>当前赛季奖励已领取</p></div>
            <div className="rewardStat"><span>Season Status</span><b>{seasonFinalized ? "Finalized" : seasonEnded ? "Ended" : "Live"}</b><p>Active deposit season: {activeDepositSeason}</p></div>
            <div className="rewardStat"><span>RewardPool V7</span><b>{shortAddress(REWARD_POOL_ADDRESS)}</b><p>{REWARD_POOL_ADDRESS}</p></div>
          </div>
        </div>
      </section>

      <section id="vault" className="section vaultSection">
        <div className="sectionHead">
          <p>EmojiWarVault</p>
          <h2>税收金库实时数据</h2>
          <span>这里读取 Flap 创建出来的 EmojiWarVault。买卖 EWTEST 产生的税收会进入这个金库，再进入 V7 RewardPool 分配。</span>
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
          <div className="vaultBox ready"><span>Burn V7</span><b>{shortAddress(BURN_CONTRACT_ADDRESS)}</b><p>{BURN_CONTRACT_ADDRESS}</p></div>
          <div className="vaultBox ready"><span>VaultFactory</span><b>{shortAddress(VAULT_FACTORY_ADDRESS)}</b><p>{VAULT_FACTORY_ADDRESS}</p></div>
          <div className="vaultBox ready"><span>RewardPool V7</span><b>{shortAddress(REWARD_POOL_ADDRESS)}</b><p>{REWARD_POOL_ADDRESS}</p></div>
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
        <div className="sectionHead"><p>Rules</p><h2>V7 主网测试规则</h2><span>这是正式上线前的 V7 主网彩排版本。</span></div>
        <div className="rulesList">
          <div><b>01</b><p>连接钱包并切换到 BNB Smart Chain 主网。</p></div>
          <div><b>02</b><p>在 Flap / GMGN 页面买入少量 EWTEST 测试币。</p></div>
          <div><b>03</b><p>链上选择一个 Emoji 军团，燃烧会计入当前赛季军团战。</p></div>
          <div><b>04</b><p>Approve 授权 V7 Burn 合约后，点击 Burn 燃烧 EWTEST。</p></div>
          <div><b>05</b><p>持有至少 500,000 EWTEST，才能领取实时分红和赛季奖励。</p></div>
          <div><b>06</b><p>正式上线时替换为 $EMOJI 地址和正式 V7 合约地址。</p></div>
        </div>
        <div className="quote"><h2>不是谁喊得响，谁赢。是谁烧得多，谁赢。</h2><p>情绪上链，黑洞开战。</p></div>
      </section>

      <footer>
        <div>
          <b>Emoji War / EWTEST V7</b>
          <p>Mainnet test version. Not official $EMOJI.</p>
          <p>Token: {TEST_TOKEN_ADDRESS}</p>
          <p>Burn V7: {BURN_CONTRACT_ADDRESS}</p>
          <p>Vault: {EMOJI_WAR_VAULT_ADDRESS}</p>
          <p>RewardPool V7: {REWARD_POOL_ADDRESS}</p>
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
