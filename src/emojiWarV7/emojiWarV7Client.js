import { ethers } from "ethers";
import { EMOJI_WAR_V7_CONFIG } from "./config.js";
import { ERC20_ABI, ARMY_V7_ABI, BURN_V7_ABI, VAULT_ABI, REWARD_POOL_V7_ABI } from "./abis.js";

export function getInjectedProvider() {
  if (!window.ethereum) {
    throw new Error("No wallet found. Please install MetaMask or use a Web3 wallet.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function ensureBscNetwork() {
  if (!window.ethereum) throw new Error("No wallet found");
  const { network } = EMOJI_WAR_V7_CONFIG;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainIdHex }],
    });
  } catch (switchError) {
    if (switchError?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: network.chainIdHex,
          chainName: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.explorer],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

export async function connectWallet() {
  await ensureBscNetwork();
  const provider = getInjectedProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

export function getContracts(providerOrSigner) {
  const { contracts, token } = EMOJI_WAR_V7_CONFIG;
  return {
    token: new ethers.Contract(token.address, ERC20_ABI, providerOrSigner),
    army: new ethers.Contract(contracts.army, ARMY_V7_ABI, providerOrSigner),
    burn: new ethers.Contract(contracts.burn, BURN_V7_ABI, providerOrSigner),
    vault: new ethers.Contract(contracts.vault, VAULT_ABI, providerOrSigner),
    rewardPool: new ethers.Contract(contracts.rewardPool, REWARD_POOL_V7_ABI, providerOrSigner),
  };
}

export function parseTokenAmount(amountText) {
  const clean = String(amountText || "0").replace(/,/g, "").trim();
  return ethers.parseUnits(clean || "0", EMOJI_WAR_V7_CONFIG.token.decimals);
}

function formatUnitsSafe(value, decimals, digits = 2) {
  try {
    const raw = ethers.formatUnits(value || 0n, decimals);
    const [whole, frac = ""] = raw.split(".");
    const shortFrac = frac.slice(0, digits).replace(/0+$/, "");
    const wholeFormatted = Number(whole).toLocaleString();
    return shortFrac ? `${wholeFormatted}.${shortFrac}` : wholeFormatted;
  } catch {
    return "0";
  }
}

export function formatToken(value, digits = 2) {
  return formatUnitsSafe(value, EMOJI_WAR_V7_CONFIG.token.decimals, digits);
}

export function formatBNB(value, digits = 6) {
  return formatUnitsSafe(value, 18, digits);
}

// 兼容旧测试面板 EmojiWarV7Panel.jsx 里的 fmtWei 调用
export const fmtWei = formatBNB;

export function shortAddress(address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function armyLabel(armyId) {
  const item = EMOJI_WAR_V7_CONFIG.armies.find((x) => Number(x.id) === Number(armyId));
  return item ? `${item.emoji} ${item.zh}` : "未选择";
}

export function formatCountdown(sec) {
  const s = Math.max(0, Number(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h}h ${m}m ${r}s`;
}

async function safeCall(fn, fallback) {
  try {
    const result = await fn();
    return result ?? fallback;
  } catch (err) {
    console.warn("EmojiWar V7 read failed:", err?.shortMessage || err?.message || err);
    return fallback;
  }
}

export async function readV7Dashboard(userAddress) {
  if (!userAddress) throw new Error("Wallet address is required");

  const provider = getInjectedProvider();
  const c = getContracts(provider);

  const currentSeasonBN = await safeCall(() => c.army.currentSeason(), 1n);
  const seasonId = Number(currentSeasonBN || 1n);

  const zero = 0n;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const [
    tokenBalance,
    hasMinHold,
    myArmy,
    secondsLeft,
    myBurn,
    seasonTotalBurned,
    winning,
    realtimeClaimable,
    seasonBonusClaimable,
    vaultBalance,
    vaultTotalReceived,
    vaultTotalWithdrawn,
    rewardPoolBalance,
    activeDepositSeason,
    seasonInfo,
  ] = await Promise.all([
    safeCall(() => c.token.balanceOf(userAddress), zero),
    safeCall(() => c.rewardPool.hasMinHold(userAddress), false),
    safeCall(() => c.army.getUserArmy(seasonId, userAddress), 0n),
    safeCall(() => c.army.secondsUntilCurrentSeasonEnds(), zero),
    safeCall(() => c.burn.userBurned(seasonId, userAddress), zero),
    safeCall(() => c.burn.seasonTotalBurned(seasonId), zero),
    safeCall(() => c.burn.getWinningArmy(seasonId), [0n, zero]),
    safeCall(() => c.rewardPool.getRealtimeClaimable(userAddress), zero),
    safeCall(() => c.rewardPool.getSeasonBonusClaimable(seasonId, userAddress), zero),
    safeCall(() => c.vault.getVaultBalance(), zero),
    safeCall(() => c.vault.totalReceived(), zero),
    safeCall(() => c.vault.totalWithdrawn(), zero),
    safeCall(() => c.rewardPool.getPoolBalance(), zero),
    safeCall(() => c.rewardPool.activeDepositSeason(), 1n),
    safeCall(() => c.rewardPool.getSeasonInfo(seasonId), [false, false, zero, zero, zero, zero, zero, 0n, zeroAddress, zeroAddress, zeroAddress]),
  ]);

  const top10 = [];
  for (let rank = 1; rank <= 10; rank++) {
    const [user, amount] = await Promise.all([
      safeCall(() => c.burn.getTopUser(seasonId, rank), zeroAddress),
      safeCall(() => c.burn.getTopAmount(seasonId, rank), zero),
    ]);
    top10.push({ rank, user, amount });
  }

  return {
    currentSeason: seasonId,
    activeDepositSeason: Number(activeDepositSeason || 1n),
    tokenBalance,
    hasMinHold: Boolean(hasMinHold),
    myArmy: Number(myArmy || 0n),
    secondsLeft: Number(secondsLeft || 0n),
    myBurn,
    seasonTotalBurned,
    winningArmy: Number(winning?.[0] || 0n),
    winningAmount: winning?.[1] || zero,
    realtimeClaimable,
    seasonBonusClaimable,
    vaultBalance,
    vaultTotalReceived,
    vaultTotalWithdrawn,
    rewardPoolBalance,
    seasonInfo: {
      finalized: Boolean(seasonInfo?.[0]),
      ended: Boolean(seasonInfo?.[1]),
      deposited: seasonInfo?.[2] || zero,
      bonusDeposited: seasonInfo?.[3] || zero,
      bonusClaimed: seasonInfo?.[4] || zero,
      totalBurned: seasonInfo?.[5] || zero,
      eligibleBurned: seasonInfo?.[6] || zero,
      winningArmy: Number(seasonInfo?.[7] || 0n),
      top1: seasonInfo?.[8] || zeroAddress,
      top2: seasonInfo?.[9] || zeroAddress,
      top3: seasonInfo?.[10] || zeroAddress,
    },
    top10,
  };
}

export async function approveBurn(amountText) {
  const { signer } = await connectWallet();
  const c = getContracts(signer);
  const tx = await c.token.approve(EMOJI_WAR_V7_CONFIG.contracts.burn, parseTokenAmount(amountText));
  return tx.wait();
}

export async function joinArmy(armyId) {
  const { signer } = await connectWallet();
  const c = getContracts(signer);
  const tx = await c.army.joinArmy(Number(armyId));
  return tx.wait();
}

export async function burnToken(amountText) {
  const { signer } = await connectWallet();
  const c = getContracts(signer);
  const tx = await c.burn.burn(parseTokenAmount(amountText));
  return tx.wait();
}

export async function claimRealtime() {
  const { signer } = await connectWallet();
  const c = getContracts(signer);
  const tx = await c.rewardPool.claimRealtime();
  return tx.wait();
}

export async function claimSeasonBonus(seasonId) {
  const { signer } = await connectWallet();
  const c = getContracts(signer);
  const tx = await c.rewardPool.claimSeasonBonus(Number(seasonId));
  return tx.wait();
}

export async function claimAll(seasonIds, includeRealtime = true) {
  const { signer } = await connectWallet();
  const c = getContracts(signer);
  const cleanSeasonIds = seasonIds.map((x) => Number(x)).filter((x) => x > 0);
  const tx = await c.rewardPool.claimAll(cleanSeasonIds, Boolean(includeRealtime));
  return tx.wait();
}
