export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

export const ARMY_V7_ABI = [
  "function currentSeason() view returns (uint256)",
  "function currentSeasonStart() view returns (uint256)",
  "function currentSeasonEnd() view returns (uint256)",
  "function seasonStartTime(uint256 seasonId) view returns (uint256)",
  "function seasonEndTime(uint256 seasonId) view returns (uint256)",
  "function isSeasonEnded(uint256 seasonId) view returns (bool)",
  "function secondsUntilCurrentSeasonEnds() view returns (uint256)",
  "function joinArmy(uint8 armyId)",
  "function getMyArmy() view returns (uint8)",
  "function getUserArmy(uint256 seasonId, address user) view returns (uint8)",
  "function getArmyMembers(uint256 seasonId, uint8 armyId) view returns (uint256)",
  "function getArmyName(uint8 armyId) pure returns (string)"
];

export const BURN_V7_ABI = [
  "function burn(uint256 amount)",
  "function rewardPool() view returns (address)",
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

export const VAULT_ABI = [
  "function taxToken() view returns (address)",
  "function creator() view returns (address)",
  "function treasury() view returns (address)",
  "function currentSeason() view returns (uint256)",
  "function totalReceived() view returns (uint256)",
  "function totalWithdrawn() view returns (uint256)",
  "function getVaultBalance() view returns (uint256)",
  "function getSeasonReceived(uint256 seasonId) view returns (uint256)",
  "function getSeasonWithdrawn(uint256 seasonId) view returns (uint256)",
  "function setTreasury(address newTreasury)",
  "function withdrawToTreasury(uint256 amount)"
];

export const REWARD_POOL_V7_ABI = [
  "function minHoldAmount() view returns (uint256)",
  "function hasMinHold(address user) view returns (bool)",
  "function activeDepositSeason() view returns (uint256)",
  "function setActiveDepositSeason(uint256 seasonId)",
  "function getPoolBalance() view returns (uint256)",
  "function getRealtimeClaimable(address user) view returns (uint256)",
  "function getSeasonBonusClaimable(uint256 seasonId, address user) view returns (uint256)",
  "function getSeasonInfo(uint256 seasonId) view returns (bool finalized,bool ended,uint256 deposited,uint256 bonusDeposited,uint256 bonusClaimed,uint256 totalBurned,uint256 eligibleBurned,uint8 winningArmy,address top1,address top2,address top3)",
  "function claimRealtime()",
  "function claimSeasonBonus(uint256 seasonId)",
  "function claimAll(uint256[] seasonIds, bool includeRealtime)",
  "function finalizeSeason(uint256 seasonId)",
  "function pauseClaims()",
  "function unpauseClaims()"
];
