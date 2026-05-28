import { ethers } from "ethers";
import { EMOJI_WAR_V7_CONFIG } from "./config.js";
import { ERC20_ABI, ARMY_V7_ABI, BURN_V7_ABI, VAULT_ABI, REWARD_POOL_V7_ABI } from "./abis.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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

async function safeCall(fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    console.warn("V7 read fallback:", err?.shortMessage || err?.message || err);
    return fallback;
  }
}

export function parseTokenAmount(amountText) {
  return ethers.parseUnits(String(amountText || "0"), EMOJI_WAR_V7_CONFIG.token.decimals);
}

export function formatToken(value, digits = 2) {
  try {
    return Number(ethers.formatUnits(value || 0n, EMOJI_WAR_V7_CONFIG.token.decimals)).toLocaleString(undefined, {
      maximumFractionDigits: digits,
    });
  } catch {
    return "0";
  }
}

export function formatBNB(value, digits = 6) {
  try {
    return Number(ethers.formatEther(value || 0n)).toLocaleString(undefined, {
      maximumFractionDigits: digits,
    });
  } catch {
    return "0";
  }
}

// 兼容旧组件 EmojiWarV7Panel.jsx
export function fmtWei(value, digits = 6) {
  return formatBNB(value, digits);
}

export function shortAddress(address) {
  if (!address) return "-";
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

export async function readV7Dashboard(userAddress) {
  const provider = getInjectedProvider();
  const c = getContracts(provider);

  const currentSeasonBN = await safeCall(() => c.army.currentSeason(), 1n);
  const seasonId = Number(currentSeasonBN || 1n);

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
    safeCall(() => c.token.balanceOf(userAddress), 0n),
    safeCall(() => c.rewardPool.hasMinHold(userAddress), false),
    safeCall(() => c.army.getUserArmy(seasonId, userAddress), 0n),
    safeCall(() => c.army.secondsUntilCurrentSeasonEnds(), 0n),
    safeCall(() => c.burn.userBurned(seasonId, userAddress), 0n),
    safeCall(() => c.burn.seasonTotalBurned(seasonId), 0n),
    safeCall(() => c.burn.getWinningArmy(seasonId), [0n, 0n]),
    safeCall(() => c.rewardPool.getRealtimeClaimable(userAddress), 0n),
    safeCall(() => c.rewardPool.getSeasonBonusClaimable(seasonId, userAddress), 0n),
    safeCall(() => c.vault.getVaultBalance(), 0n),
    safeCall(() => c.vault.totalReceived(), 0n),
    safeCall(() => c.vault.totalWithdrawn(), 0n),
    safeCall(() => c.rewardPool.getPoolBalance(), 0n),
    safeCall(() => c.rewardPool.activeDepositSeason(), 0n),
    safeCall(() => c.rewardPool.getSeasonInfo(seasonId), [
      false, false, 0n, 0n, 0n, 0n, 0n, 0n, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS
    ]),
  ]);

  const top10 = [];
  for (let rank = 1; rank <= 10; rank++) {
    const [user, amount] = await Promise.all([
      safeCall(() => c.burn.getTopUser(seasonId, rank), ZERO_ADDRESS),
      safeCall(() => c.burn.getTopAmount(seasonId, rank), 0n),
    ]);
    top10.push({ rank, user, amount });
  }

  return {
    currentSeason: seasonId,
    activeDepositSeason: Number(activeDepositSeason || 0n),
    tokenBalance,
    hasMinHold,
    myArmy: Number(myArmy || 0n),
    secondsLeft: Number(secondsLeft || 0n),
    myBurn,
    seasonTotalBurned,
    winningArmy: Number(winning?.[0] || 0n),
    winningAmount: winning?.[1] || 0n,
    realtimeClaimable,
    seasonBonusClaimable,
    vaultBalance,
    vaultTotalReceived,
    vaultTotalWithdrawn,
    rewardPoolBalance,
    seasonInfo: {
      finalized: Boolean(seasonInfo?.[0]),
      ended: Boolean(seasonInfo?.[1]),
      deposited: seasonInfo?.[2] || 0n,
      bonusDeposited: seasonInfo?.[3] || 0n,
      bonusClaimed: seasonInfo?.[4] || 0n,
      totalBurned: seasonInfo?.[5] || 0n,
      eligibleBurned: seasonInfo?.[6] || 0n,
      winningArmy: Number(seasonInfo?.[7] || 0n),
      top1: seasonInfo?.[8] || ZERO_ADDRESS,
      top2: seasonInfo?.[9] || ZERO_ADDRESS,
      top3: seasonInfo?.[10] || ZERO_ADDRESS,
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
  const tx = await c.rewardPool.claimSeasonBonus(Number(seasonId || 1));
  return tx.wait();
}

export async function claimAll(seasonIds, includeRealtime = true) {
  const { signer } = await connectWallet();
  const c = getContracts(signer);
  const cleanSeasonIds = (seasonIds || []).map((x) => Number(x)).filter((x) => x > 0);
  const tx = await c.rewardPool.claimAll(cleanSeasonIds, Boolean(includeRealtime));
  return tx.wait();
}
