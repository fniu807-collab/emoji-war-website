export const EMOJI_WAR_V7_CONFIG = {
  network: {
    chainId: 56,
    chainIdHex: "0x38",
    name: "BNB Smart Chain",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    explorer: "https://bscscan.com",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
  },

  token: {
    name: "Emoji War Test Token",
    symbol: "EWTEST",
    decimals: 18,
    address: "0x1cfe9717be9d02370e3001717e5da157d35e7777",
    minHoldToClaim: "500000",
    minHoldToClaimWei: "500000000000000000000000",
  },

  contracts: {
    vaultFactory: "0x4cc87327A76430fF09Fa6879BF85BE09e03d1CBA",
    army: "0xeB472e8863bce01C3D108477A036A7D24Fd34B38",
    burn: "0x7eB94A7E2fa35d9491d1043a230B201A70052CFA",
    vault: "0x8b55FA7273c790F1caD86cf96917AcD0469Fc515",
    rewardPool: "0xf354AC72248458011e5B5A28b61018B3E11908d6",
  },

  links: {
    buyUrl: "https://gmgn.ai/bsc/token/0x1cfe9717be9d02370e3001717e5da157d35e7777",
    x: "",
    telegram: "",
  },

  armies: [
    { id: 1, emoji: "🥷", zh: "忍者军团", en: "Ninja Army", desc: "隐匿、突袭、速度" },
    { id: 2, emoji: "🚀", zh: "火箭军团", en: "Rocket Army", desc: "冲锋、拉升、爆发" },
    { id: 3, emoji: "💎", zh: "钻石军团", en: "Diamond Army", desc: "坚守、信仰、钻石手" },
    { id: 4, emoji: "🦋", zh: "蝴蝶军团", en: "Butterfly Army", desc: "传播、变异、破圈" },
    { id: 5, emoji: "🔶", zh: "币安军团", en: "Binance Army", desc: "社区自发情绪阵营，非 Binance 官方关联" },
  ],
};
