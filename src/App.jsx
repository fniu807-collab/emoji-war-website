import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";

const BNB_MAINNET_CHAIN_ID = "0x38";
const BNB_MAINNET_NAME = "BNB Smart Chain";

const ARMY_CONTRACT_ADDRESS = "0xeB472e8863bce01C3D108477A036A7D24Fd34B38";
const VAULT_FACTORY_ADDRESS = "0x4cc87327A76430fF09Fa6879BF85BE09e03d1CBA";

// 主网正式币，不是$EMOJI
const TEST_TOKEN_ADDRESS = "0x1cfe9717be9d02370e3001717e5da157d35e7777";
const BURN_CONTRACT_ADDRESS = "0x7eB94A7E2fa35d9491d1043a230B201A70052CFA";
const TREASURY_ADDRESS = "0x27e6a487eab81915e428cb41c18511600b1eceea";
const EMOJI_WAR_VAULT_ADDRESS = "0x8b55FA7273c790F1caD86cf96917AcD0469Fc515";
const REWARD_POOL_ADDRESS = "0xf354AC72248458011e5B5A28b61018B3E11908d6";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// 开盘配置区：开盘后，优先改这里和上面的合约地址。
// 当前页面以 $EMOJI 主网开盘形态展示。
const PROJECT_PHASE = "主网正式开盘";
const DISPLAY_TOKEN_NAME = "Emoji";
const DISPLAY_TOKEN_SYMBOL = "Emoji";
const FINAL_TOKEN_SYMBOL = "Emoji";
const MIN_HOLD_TEXT = "500,000";
const BUY_ACTION_TEXT = "Buy $EMOJI";
const IS_FINAL_TOKEN_LIVE = true;

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
  { id: 1, emoji: "🦋", cn: "蝴蝶军团", en: "Butterfly Army", slogan: "每一次燃烧，都是一次进化。", desc: "蜕变、进化、扩散。微小情绪，也能掀起风暴。" },
  { id: 2, emoji: "🔶", cn: "币安军团", en: "Binance Army", slogan: "金色共识，燃烧集结。", desc: "金色阵营，燃烧集结。让情绪在链上形成最强共识。" },
  { id: 3, emoji: "🥷", cn: "忍者军团", en: "Ninja Army", slogan: "隐于黑暗，燃烧出击。", desc: "隐忍、突袭、反超。真正的忍者不喊单，只在榜上出现。" },
  { id: 4, emoji: "🚀", cn: "火箭军团", en: "Rocket Army", slogan: "现在集结，之后起飞。", desc: "点火、FOMO、冲向月球。每一次燃烧都是一次点火。" },
  { id: 5, emoji: "💎", cn: "钻石军团", en: "Diamond Army", slogan: "钻石手永不投降。", desc: "信仰、持有、坚定共识。不是谁喊得响，谁赢。" }
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

function getClaimBlockReasons({ wallet, isMainnet, hasMinHold, realtimeClaimable, seasonBonusClaimable, myBurned, seasonEnded, seasonFinalized, tokenSymbol }) {
  const reasons = [];
  if (!wallet) reasons.push("请先连接钱包。");
  if (wallet && !isMainnet) reasons.push("请先切换到 BNB Smart Chain。");
  if (wallet && isMainnet && !hasMinHold) reasons.push(`持币不足，需要至少 ${MIN_HOLD_TEXT} ${tokenSymbol}。`);
  if (wallet && isMainnet && BigInt(myBurned || "0") <= 0n) reasons.push("你本赛季还没有 Burn，暂无燃烧权重。");
  if (wallet && isMainnet && BigInt(realtimeClaimable || "0") <= 0n) reasons.push("当前没有实时可领取分红。");
  if (wallet && isMainnet && BigInt(seasonBonusClaimable || "0") <= 0n) {
    if (!seasonEnded) reasons.push("最近赛季奖励需赛季结束后领取。");
    else if (!seasonFinalized) reasons.push("所选赛季已结束，但还需要完成 finalize 结算。");
    else reasons.push("当前没有赛季奖励可领取。");
  }
  return reasons;
}

function shortPhaseLabel() {
  return IS_FINAL_TOKEN_LIVE ? "主网正式版" : "主网正式版";
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
  const [bonusSeasonInput, setBonusSeasonInput] = useState("1"); // 保留内部状态，不在页面展示
  const [secondsLeft, setSecondsLeft] = useState("0");
  const [selectedArmyId, setSelectedArmyId] = useState(0);
  const [pendingArmyId, setPendingArmyId] = useState(0);
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
  const [tokenSymbol, setTokenSymbol] = useState("EMOJI");
  const [burnAmount, setBurnAmount] = useState("1000");
  const [status, setStatus] = useState("V7 正式开盘版已准备。");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const isMainnet = chainId?.toLowerCase() === BNB_MAINNET_CHAIN_ID;
  const selectedArmy = useMemo(() => armyById(selectedArmyId), [selectedArmyId]);
  const winningArmy = useMemo(() => armyById(winningArmyId), [winningArmyId]);

  const claimBlockReasons = useMemo(() => getClaimBlockReasons({
    wallet,
    isMainnet,
    hasMinHold,
    realtimeClaimable,
    seasonBonusClaimable,
    myBurned,
    seasonEnded,
    seasonFinalized,
    tokenSymbol
  }), [wallet, isMainnet, hasMinHold, realtimeClaimable, seasonBonusClaimable, myBurned, seasonEnded, seasonFinalized, tokenSymbol]);

  const flowSteps = [
    { title: "买入", desc: "先买入 Emoji，进入战场" },
    { title: "选阵容", desc: "选择一个军团阵容" },
    { title: "燃烧", desc: "燃烧上榜，获得分红权重" },
    { title: "领取", desc: "可领时领取 BNB 分红" },
  ];

  const recentEndedSeasons = useMemo(() => {
    const cur = Number(currentSeason || "1");
    return Array.from({ length: 5 }, (_, index) => cur - index - 1).filter((seasonId) => seasonId > 0);
  }, [currentSeason]);

  const selectedBonusSeason = useMemo(() => {
    const fallback = recentEndedSeasons[0] || Math.max(1, Number(currentSeason || "1") - 1);
    const parsed = Number(bonusSeasonInput || fallback);
    return parsed > 0 ? parsed : fallback;
  }, [bonusSeasonInput, recentEndedSeasons, currentSeason]);

  const snapshotCards = useMemo(() => [
    { label: "当前赛季", value: `第 ${currentSeason} 赛季`, desc: `剩余 ${formatCountdown(secondsLeft)}` },
    { label: "Leading Army", value: winningArmy ? `${winningArmy.emoji} ${winningArmy.cn}` : "暂无", desc: `${formatAmount(winningArmyBurn, tokenDecimals)} burned` },
    { label: "Realtime Claim", value: `${formatBNB(realtimeClaimable)} BNB`, desc: "50% 实时燃烧分红" },
    { label: "RewardPool", value: `${formatBNB(rewardPoolBalance)} BNB`, desc: "当前可分配池余额" },
  ], [currentSeason, secondsLeft, winningArmy, winningArmyBurn, tokenDecimals, realtimeClaimable, rewardPoolBalance]);

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

  const leaderArmyBurn = useMemo(() => {
    const first = rankedArmyBurns?.[0];
    return BigInt(armyBurns[first?.id] || "0");
  }, [rankedArmyBurns, armyBurns]);

  useEffect(() => {
    const cur = Number(currentSeason || "1");
    const prev = Math.max(1, cur - 1);
    setBonusSeasonInput(String(prev));
  }, [currentSeason]);

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
      setPendingArmyId(0);
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

  useEffect(() => {
    if (!wallet || !isMainnet) return;
    refreshSelectedBonusSeason(wallet, selectedBonusSeason);
  }, [bonusSeasonInput, wallet, isMainnet]);

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
    if (saved) {
      setSelectedArmyId(Number(saved));
      setPendingArmyId(Number(saved));
    }
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
        setStatus("钱包已连接，正在尝试切换到 BNB Smart Chain。");
        await switchToBnbMainnet();
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

  async function refreshSelectedBonusSeason(account = wallet, seasonId = selectedBonusSeason) {
    if (!account || !isMainnet) return;

    try {
      const rewardPoolContract = await getContract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI);
      const bonus = await safeRead(() => rewardPoolContract.getSeasonBonusClaimable(BigInt(seasonId), account), 0n);
      const info = await safeRead(() => rewardPoolContract.getSeasonInfo(BigInt(seasonId)), [
        false, false, 0n, 0n, 0n, 0n, 0n, 0n, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS
      ]);

      setSeasonBonusClaimable(bonus.toString());
      setSeasonFinalized(Boolean(info?.[0]));
      setSeasonEnded(Boolean(info?.[1]));
      setSeasonBonusDeposited((info?.[3] || 0n).toString());
      setSeasonBonusClaimed((info?.[4] || 0n).toString());
    } catch {}
  }

  async function loadAllData(account = wallet) {
    if (!account) return setStatus("请先连接钱包。");

    try {
      setIsLoading(true);
      const id = await getCurrentChainId();
      setChainId(id);

      if (id !== BNB_MAINNET_CHAIN_ID) {
        setStatus("当前网络不是 BNB Smart Chain，无法读取链上数据。连接钱包时会尝试自动切换。");
        loadLocalArmyFallback(account);
        return;
      }

      const armyContract = await getContract(ARMY_CONTRACT_ADDRESS, ARMY_ABI);
      const tokenContract = await getContract(TEST_TOKEN_ADDRESS, TOKEN_ABI);
      const burnContract = await getContract(BURN_CONTRACT_ADDRESS, BURN_ABI);
      const vaultContract = await getContract(EMOJI_WAR_VAULT_ADDRESS, VAULT_ABI);
      const rewardPoolContract = await getContract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI);

      let decimals = 18;
      let symbol = "$EMOJI";
      try { decimals = Number(await tokenContract.decimals()); } catch {}
      try { symbol = await tokenContract.symbol(); } catch {}
      setTokenDecimals(decimals);
      setTokenSymbol(symbol);

      const seasonId = await armyContract.currentSeason();
      setCurrentSeason(seasonId.toString());

      const myArmy = await safeRead(() => armyContract.getUserArmy(seasonId, account), 0n);
      const onChainArmy = Number(myArmy);
      const savedArmy = Number(localStorage.getItem(localArmyKey(account)) || "0");
      const nextArmyId = onChainArmy || savedArmy || 0;
      setSelectedArmyId(nextArmyId);
      setPendingArmyId(nextArmyId);

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
          rewardPoolContract.getSeasonBonusClaimable(BigInt(selectedBonusSeason || Math.max(1, Number(seasonId) - 1)), account),
          rewardPoolContract.hasMinHold(account),
          rewardPoolContract.minHoldAmount(),
          rewardPoolContract.activeDepositSeason(),
          rewardPoolContract.getSeasonInfo(BigInt(selectedBonusSeason || Math.max(1, Number(seasonId) - 1)))
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
      setStatus("V7 数据已刷新。你可以按流程：买入 → 选军团 → Approve → Burn → Claim BNB。");
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
      setPendingArmyId(armyId);
      setStatus(`阵容确认成功：${army.emoji} ${army.cn}`);
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
      const targetSeason = recentEndedSeasons[0] || selectedBonusSeason;
      setStatus(`正在领取最近已结束赛季奖励（第 ${targetSeason} 赛季），请在钱包确认。`);
      const tx = await rewardPool.claimSeasonBonus(BigInt(targetSeason));
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
      const seasons = recentEndedSeasons.length ? recentEndedSeasons : [selectedBonusSeason].filter(Boolean);
      setStatus(`正在一键领取实时分红和最近 ${seasons.length} 个已结束赛季奖励，请在钱包确认。`);
      const tx = await rewardPool.claimAll(seasons.map((seasonId) => BigInt(seasonId)), true);
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
          <div className="brand"><div className="logo tokenLogo"><img src="/token-avatar.png" alt="Emoji avatar" /></div><div><b>{DISPLAY_TOKEN_NAME}</b><span>Emoji War · 主网开盘</span></div></div>
          <div className="navLinks">
            <a href="#join">阵容</a>
            <a href="#burn">燃烧</a>
            <a href="#rewards">领取</a>
            <a href="#panel">排行</a>
            <a href="#vault">资金池</a>
          </div>
          <button className="smallBtn" onClick={connectWallet}>{wallet ? shortAddress(wallet) : "连接钱包"}</button>
        </div>

        <div className="heroGrid">
          <div className="heroText">
            <p className="pill"><span></span>主网正式开盘 · 黑洞金库</p>
            <div className="heroTitleBlock">
              <h1 className="tokenHeroName">Emoji</h1>
              <h2>Emoji War · 黑洞金库，燃烧开战</h2>
            </div>
            <p className="lead">
              买入 Emoji，选择阵容，燃烧上榜，领取 BNB。
              玩法只有一条线：谁燃烧，谁参战；谁上榜，谁分红。
            </p>
            <div className="heroProof">
              <span>全税进入金库</span>
              <span>燃烧决定权重</span>
              <span>BNB 自动分红</span>
            </div>
            <div className="actions">
              <button className="primaryBtn buttonReset" onClick={connectWallet}>{wallet ? "钱包已连接" : "连接钱包"}</button>
              <a className="secondaryBtn" href={links.flap} target="_blank" rel="noreferrer">{BUY_ACTION_TEXT}</a>
              <button className="secondaryBtn buttonReset" onClick={() => loadAllData(wallet)} disabled={!wallet || isLoading}>刷新链上数据</button>
            </div>
            <p className="note">
              {IS_FINAL_TOKEN_LIVE ? "当前为$EMOJI 版本。" : "当前为 Emoji 正式开盘版。"} 最后刷新：{lastUpdated || "未刷新"}
            </p>
          </div>

          <div className="warCard">
            <div className="screenTitle"><span>V7 燃烧分红</span><b>第 {currentSeason} 赛季</b></div>
            <div className="armyGrid">
              {armies.map((army) => (
                <div className={`miniArmy ${selectedArmyId === army.id ? "activeMini" : ""}`} key={army.cn}>
                  <div>{army.emoji}</div>
                  <b>{army.cn}</b>
                  <span>{formatAmount(armyBurns[army.id] || "0", tokenDecimals)} burned</span>
                </div>
              ))}
            </div>
            <div className="flywheel">
              <b>战争分配</b>
              <span>50% 实时 Burn Share · 30% 冠军军团 · 20% Top10</span>
            </div>
          </div>
        </div>
      </section>

      <section className="liveSnapshot">
        <div className="snapshotGrid">
          {snapshotCards.map((card) => (
            <div className="snapshotCard" key={card.label}>
              <span>{card.label}</span>
              <b>{card.value}</b>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="launchFlow section">
        <div className="sectionHead">
          <p>How to Play</p>
          <h2>4 步看懂怎么玩</h2>
          <span>用户只需要按顺序完成：买入、选军团、授权、燃烧、领取分红。</span>
        </div>
        <div className="flowGrid">
          {flowSteps.map((item, index) => (
            <div className="flowItem" key={item.title}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span>{item.title}</span>
              <small>{item.desc}</small>
            </div>
          ))}
        </div>
      </section>

      <section id="join" className="section joinSection">
        <div className="sectionHead">
          <p>第一步</p>
          <h2>先选择你的阵容</h2>
          <span>先选阵容，再去燃烧。燃烧会同时计入你的个人排名和军团战力。</span>
        </div>

        <div className="walletPanel">
          <div className="walletStatus">
            <div className="statusTop"><span>钱包状态</span><b>{wallet ? "已连接" : "未连接"}</b></div>
            <h3>{wallet ? shortAddress(wallet) : "连接钱包"}</h3>
            <p>网络：{isMainnet ? "BNB Smart Chain" : chainId ? `请切换网络 (${chainId})` : "未连接"}</p>
            <p>当前阵容：{selectedArmy ? `${selectedArmy.emoji} ${selectedArmy.cn}` : "未确认"}</p>
            <p>持币： {formatAmount(tokenBalance, tokenDecimals)} {tokenSymbol} <span className={hasMinHold ? "statusTag" : "statusTag bad"}>{hasMinHold ? "满足持币门槛" : `需要 ${MIN_HOLD_TEXT}+`}</span></p>
            <p>我的燃烧： {formatAmount(myBurned, tokenDecimals)} {tokenSymbol}</p>
            <p>当前赛季： {currentSeason} · 剩余 {formatCountdown(secondsLeft)}</p>
            {status && <div className="statusMessage">{status}</div>}
            <div className="walletActions">
              <button className="primaryBtn buttonReset" onClick={connectWallet} disabled={isLoading}>{isLoading ? "处理中..." : "连接 / 刷新"}</button>
            </div>
          </div>

          <div className="chooseArmyBox">
            <h3>选择你的阵容</h3>
            <div className="chooseGrid">
              {armies.map((army) => (
                <button
                  key={army.id}
                  onClick={() => {
                    setPendingArmyId(army.id);
                    setStatus(`已选择阵容：${army.emoji} ${army.cn}，请点击“确定选择阵容”完成链上确认。`);
                  }}
                  className={`${pendingArmyId === army.id ? "chosen" : ""} ${selectedArmyId === army.id ? "onChainChosen" : ""}`}
                  disabled={isLoading}
                  type="button"
                >
                  <span>{army.emoji}</span><b>{army.cn}</b><small>{selectedArmyId === army.id ? "当前链上阵容" : army.en}</small>
                </button>
              ))}
            </div>

            <div className="armyConfirmPanel">
              <div>
                <span>待确认阵容</span>
                <b>{pendingArmyId ? `${armyById(pendingArmyId)?.emoji} ${armyById(pendingArmyId)?.cn}` : "请选择一个阵容"}</b>
              </div>
              <button
                className="primaryBtn buttonReset"
                onClick={() => joinArmyOnChain(pendingArmyId)}
                disabled={isLoading || !pendingArmyId}
                type="button"
              >
                确定选择阵容
              </button>
            </div>

            <p className="chooseHint">先点击阵容卡片进行选择，再点击“确定选择阵容”并在钱包确认。确认成功后，再进行授权与燃烧。</p>
          </div>
        </div>
      </section>

      <section id="burn" className="section burnSection">
        <div className="sectionHead">
          <p>第二步</p>
          <h2>输入数量，开始燃烧</h2>
          <span>先点授权，再点燃烧。燃烧后，你会获得分红权重，并进入排行榜。</span>
        </div>

        <div className="burnPanel">
          <div className="burnBox">
            <h3>燃烧数量</h3>
            <label>燃烧数量</label>
            <input value={burnAmount} onChange={(e) => setBurnAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="1000" />
            <div className="burnStats">
              <div><p>授权额度</p><b>{formatAmount(allowance, tokenDecimals)} {tokenSymbol}</b></div>
              <div><p>全赛季总燃烧</p><b>{formatAmount(totalBurned, tokenDecimals)} {tokenSymbol}</b></div>
              <div><p>当前赛季有效燃烧</p><b>{formatAmount(eligibleBurned, tokenDecimals)} {tokenSymbol}</b></div>
              <div><p>当前冠军军团</p><b>{winningArmy ? `${winningArmy.emoji} ${winningArmy.cn}` : "暂无"}</b></div>
            </div>
            <div className="walletActions">
              <button className="secondaryBtn buttonReset" onClick={approveBurnContract} disabled={isLoading || burnAmountWei <= 0n}>授权</button>
              <button className="primaryBtn buttonReset" onClick={burnForArmy} disabled={isLoading || burnAmountWei <= 0n || needsApprove}>燃烧</button>
            </div>
            <p className="chooseHint">{needsApprove ? "当前授权额度不足，请先点击“授权”。" : "授权额度足够，可以点击“燃烧”。"}</p>
          </div>

          <div className="burnBox">
            <h3>燃烧有什么用？</h3>
            <p>Burn 是参战凭证：决定你的实时分红权重、军团战力和 Top10 排名。</p>
            <p>50% 进入实时燃烧贡献池，30% 进入冠军军团奖励池，20% 进入 Top10 排行榜奖励池。</p>
            <p>前十奖励：第 1 名 30%，第 2 名 20%，第 3 名 15%，第 4-10 名各 5%。</p>
            <p>Claim 时必须持有至少 {formatAmount(minHoldAmount, tokenDecimals)} {tokenSymbol}。</p>
            <a className="secondaryBtn inlineLink" href={links.flap} target="_blank" rel="noreferrer">购买 Emoji</a>
          </div>
        </div>
      </section>

      <section id="panel" className="section panelSection">
        <div className="sectionHead">
          <p>战况</p>
          <h2>战场实况</h2>
          <span>当前领先：{winningArmy ? `${winningArmy.emoji} ${winningArmy.cn}` : "暂无"}。这里展示军团排名和个人燃烧前十榜。</span>
        </div>

        <div className="rankingGrid">
          <div className="rankingCard">
            <div className="rankingHead"><h3>军团排名</h3><span>Army Burn Power</span></div>
            {rankedArmyBurns.map((army, index) => (
              <div className="armyRow" key={army.cn}>
                <div className="rankBadge">{index + 1}</div>
                <div className="armyName"><span>{army.emoji}</span><div><b>{army.cn}</b><p>{army.en}</p></div></div>
                <div className="armyBurn"><b>{formatAmount(armyBurns[army.id] || "0", tokenDecimals)}</b><p>{tokenSymbol} burned</p></div>
              </div>
            ))}
          </div>

          <div className="rankingCard">
            <div className="rankingHead"><h3>个人燃烧榜</h3><span>前十排名</span></div>
            {activeTopUsers.length === 0 ? (
              <div className="statusMessage">暂无 Top10 数据。完成 Burn 后，你的钱包将进入本赛季燃烧排行。</div>
            ) : activeTopUsers.map((row) => (
              <div className="armyRow topUserRow" key={row.rank}>
                <div className="rankBadge">{row.rank}</div>
                <div className="armyName"><span>🔥</span><div><b>{shortAddress(row.user)}</b><p>个人燃烧地址</p></div></div>
                <div className="armyBurn"><b>{formatAmount(row.amount, tokenDecimals)}</b><p>{tokenSymbol} burned</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="rewards" className="section rewardSection">
        <div className="sectionHead">
          <p>领取</p>
          <h2>领取 BNB 分红</h2>
          <span>分红金额自动读取。看到可领金额后，优先点击“一键领取全部”。如果显示 0，下方会告诉你原因。</span>
        </div>

        <div className="claimSimpleGuide">
          <div><b>1</b><p>先看“总共可领”。</p></div>
          <div><b>2</b><p>有金额就点“一键领取全部”。</p></div>
          <div><b>3</b><p>如果是 0，说明暂时没有可领分红。</p></div>
        </div>

        <div className="rewardPanel simplifiedRewardPanel">
          <div className="rewardClaimBox simplifiedClaimBox">
            <div className="rewardIcon">💰</div>
            <div className="claimTotalBox">
              <span>总共可领</span>
              <b>{formatBNB((BigInt(realtimeClaimable || "0") + BigInt(seasonBonusClaimable || "0")).toString())} BNB</b>
            </div>

            <div className="simpleRewardBreakdown">
              <div>
                <span>实时分红</span>
                <strong>{formatBNB(realtimeClaimable)} BNB</strong>
              </div>
              <div>
                <span>赛季奖励</span>
                <strong>{formatBNB(seasonBonusClaimable)} BNB</strong>
              </div>
            </div>

            <div className="autoSeasonNotice">
              <b>自动处理赛季</b>
              <p>系统会自动尝试最近 5 个已结束赛季，不需要你手动选择。</p>
              <small>当前尝试：{recentEndedSeasons.length ? recentEndedSeasons.join(" / ") : "暂无已结束赛季"}</small>
            </div>

            <div className="claimReasonBox simpleClaimStatus">
              <b>为什么现在不能领？</b>
              {claimBlockReasons.length === 0 ? (
                <p>当前满足领取条件，可以尝试领取。</p>
              ) : (
                claimBlockReasons.slice(0, 3).map((reason) => <p key={reason}>• {reason}</p>)
              )}
            </div>

            <div className="walletActions rewardClaimActions">
              <button className="primaryBtn buttonReset" onClick={claimAllRewards} disabled={isLoading || (!hasMinHold && wallet)}>一键领取全部</button>
              <button className="secondaryBtn buttonReset" onClick={claimRealtimeReward} disabled={isLoading || BigInt(realtimeClaimable || "0") <= 0n}>只领实时分红</button>
              <button className="secondaryBtn buttonReset" onClick={claimSeasonBonusReward} disabled={isLoading || BigInt(seasonBonusClaimable || "0") <= 0n}>只领赛季奖励</button>
              <button className="secondaryBtn buttonReset" onClick={() => loadAllData(wallet)} disabled={!wallet || isLoading}>刷新金额</button>
            </div>

            <p className="chooseHint">分红来自交易税进入分红池后的分配。如果显示 0，通常是暂时没有新增分红，或赛季奖励还没结算。</p>
          </div>

          <div className="rewardStatsGrid simpleRewardStats">
            <div className="rewardStat highlight"><span>分红池余额</span><b>{formatBNB(rewardPoolBalance)} BNB</b><p>池子里当前可用于分配的 BNB</p></div>
            <div className="rewardStat"><span>领取资格</span><b>{hasMinHold ? "已满足" : "未满足"}</b><p>领取需要持有至少 {formatAmount(minHoldAmount, tokenDecimals)} {tokenSymbol}</p></div>
            <div className="rewardStat"><span>实时分红</span><b>{formatBNB(realtimeClaimable)} BNB</b><p>可以直接领取的部分</p></div>
            <div className="rewardStat"><span>赛季奖励</span><b>{formatBNB(seasonBonusClaimable)} BNB</b><p>最近已结束赛季的奖励</p></div>
          </div>
        </div>
      </section>

<section id="vault" className="section vaultSection">
        <div className="sectionHead">
          <p>EmojiWarVault</p>
          <h2>资金池数据</h2>
          <span>交易税先进入 EmojiWarVault，再进入 RewardPool 按 50% / 30% / 20% 机制分配。金库越活跃，战争越激烈。</span>
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
          <div className="vaultBox ready"><span>$EMOJI Token</span><b>{shortAddress(TEST_TOKEN_ADDRESS)}</b><p>{TEST_TOKEN_ADDRESS}</p></div>
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
<footer>
        <div>
          <b>Emoji / Emoji War</b>
          <p>{IS_FINAL_TOKEN_LIVE ? "Mainnet live version." : "主网正式开盘版。"}</p>
          <p>Token: {TEST_TOKEN_ADDRESS}</p>
          <p>Burn V7: {BURN_CONTRACT_ADDRESS}</p>
          <p>Vault: {EMOJI_WAR_VAULT_ADDRESS}</p>
          <p>RewardPool V7: {REWARD_POOL_ADDRESS}</p>
        </div>
        <div className="footerLinks">
          <a href={links.twitter}>X</a>
          <a href={links.telegram}>社群</a>
          <a href={links.flap} target="_blank" rel="noreferrer">购买 Emoji</a>
        </div>
      </footer>
    </main>
  );
}
