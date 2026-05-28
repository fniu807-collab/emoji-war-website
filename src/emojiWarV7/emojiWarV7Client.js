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
  const currentSeasonBN = await c.army.currentSeason();
  const seasonId = Number(currentSeasonBN);

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
    c.token.balanceOf(userAddress),
    c.rewardPool.hasMinHold(userAddress),
    c.army.getUserArmy(seasonId, userAddress),
    c.army.secondsUntilCurrentSeasonEnds(),
    c.burn.userBurned(seasonId, userAddress),
    c.burn.seasonTotalBurned(seasonId),
    c.burn.getWinningArmy(seasonId),
    c.rewardPool.getRealtimeClaimable(userAddress),
    c.rewardPool.getSeasonBonusClaimable(seasonId, userAddress),
    c.vault.getVaultBalance(),
    c.vault.totalReceived(),
    c.vault.totalWithdrawn(),
    c.rewardPool.getPoolBalance(),
    c.rewardPool.activeDepositSeason(),
    c.rewardPool.getSeasonInfo(seasonId),
  ]);

  const top10 = [];
  for (let rank = 1; rank <= 10; rank++) {
    const [user, amount] = await Promise.all([
      c.burn.getTopUser(seasonId, rank),
      c.burn.getTopAmount(seasonId, rank),
    ]);
    top10.push({ rank, user, amount });
  }

  return {
    currentSeason: seasonId,
    activeDepositSeason: Number(activeDepositSeason),
    tokenBalance,
    hasMinHold,
    myArmy: Number(myArmy),
    secondsLeft: Number(secondsLeft),
    myBurn,
    seasonTotalBurned,
    winningArmy: Number(winning[0]),
    winningAmount: winning[1],
    realtimeClaimable,
    seasonBonusClaimable,
    vaultBalance,
    vaultTotalReceived,
    vaultTotalWithdrawn,
    rewardPoolBalance,
    seasonInfo: {
      finalized: seasonInfo[0],
      ended: seasonInfo[1],
      deposited: seasonInfo[2],
      bonusDeposited: seasonInfo[3],
      bonusClaimed: seasonInfo[4],
      totalBurned: seasonInfo[5],
      eligibleBurned: seasonInfo[6],
      winningArmy: Number(seasonInfo[7]),
      top1: seasonInfo[8],
      top2: seasonInfo[9],
      top3: seasonInfo[10],
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
