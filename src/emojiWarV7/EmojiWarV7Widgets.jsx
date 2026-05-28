// src/emojiWarV7/EmojiWarV7Widgets.jsx
// 小组件版：用于塞回原官网模块，不会强行替换整个页面。
// 你可以在原 App.jsx 的金库/燃烧/分红区域逐个插入这些组件。

import React, { useState } from "react";
import { EMOJI_WAR_V7_CONFIG } from "./config.js";
import { useEmojiWarV7 } from "./useEmojiWarV7.js";
import { armyLabel, formatBNB, formatToken, shortAddress } from "./emojiWarV7Client.js";

const gold = "#f0b90b";

export function V7WalletButton({ className = "" }) {
  const v7 = useEmojiWarV7();
  return (
    <button className={className} onClick={v7.connect} disabled={v7.loading}>
      {v7.address ? shortAddress(v7.address) : "Connect Wallet"}
    </button>
  );
}

export function V7StatsCards({ v7 }) {
  const d = v7?.data;
  return (
    <div className="v7-stats-grid">
      <V7MiniCard title="Current Season" value={d ? `Season ${d.currentSeason}` : "-"} />
      <V7MiniCard title="Token Balance" value={d ? `${formatToken(d.tokenBalance)} ${EMOJI_WAR_V7_CONFIG.token.symbol}` : "-"} />
      <V7MiniCard title="Realtime Claimable" value={d ? `${formatBNB(d.realtimeClaimable, 8)} BNB` : "-"} />
      <V7MiniCard title="Season Bonus" value={d ? `${formatBNB(d.seasonBonusClaimable, 8)} BNB` : "-"} />
      <V7MiniCard title="Vault Balance" value={d ? `${formatBNB(d.vaultBalance, 6)} BNB` : "-"} />
      <V7MiniCard title="RewardPool" value={d ? `${formatBNB(d.rewardPoolBalance, 6)} BNB` : "-"} />
    </div>
  );
}

export function V7ArmyBox({ v7 }) {
  return (
    <div className="v7-box">
      <h3>选择军团</h3>
      <div className="v7-army-row">
        {EMOJI_WAR_V7_CONFIG.armies.map((army) => (
          <button key={army.id} onClick={() => v7.joinArmy(army.id)} disabled={v7.loading}>
            {army.emoji} {army.zh}
          </button>
        ))}
      </div>
      <p>当前军团：{armyLabel(v7?.data?.myArmy)}</p>
    </div>
  );
}

export function V7BurnBox({ v7 }) {
  const [amount, setAmount] = useState("1000");
  return (
    <div className="v7-box">
      <h3>燃烧参战</h3>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button onClick={() => v7.approveBurn(amount)} disabled={v7.loading}>Approve</button>
      <button onClick={() => v7.burnToken(amount)} disabled={v7.loading}>Burn</button>
      <p>我的本赛季燃烧：{v7?.data ? formatToken(v7.data.myBurn) : "-"} {EMOJI_WAR_V7_CONFIG.token.symbol}</p>
      <p>{EMOJI_WAR_V7_CONFIG.uiText.burnShareNotice}</p>
    </div>
  );
}

export function V7ClaimBox({ v7 }) {
  const currentSeason = v7?.data?.currentSeason || 1;
  return (
    <div className="v7-box">
      <h3>税收分红领取</h3>
      <p>实时可领：{v7?.data ? formatBNB(v7.data.realtimeClaimable, 8) : "-"} BNB</p>
      <p>赛季奖励：{v7?.data ? formatBNB(v7.data.seasonBonusClaimable, 8) : "-"} BNB</p>
      <button onClick={v7.claimRealtime} disabled={v7.loading}>Claim Realtime</button>
      <button onClick={() => v7.claimSeasonBonus(currentSeason)} disabled={v7.loading}>Claim Season Bonus</button>
      <button onClick={() => v7.claimAll([currentSeason], true)} disabled={v7.loading}>Claim All</button>
      <p>{EMOJI_WAR_V7_CONFIG.uiText.minHoldNotice}</p>
    </div>
  );
}

export function V7Top10Box({ v7 }) {
  const top10 = v7?.data?.top10 || [];
  return (
    <div className="v7-box">
      <h3>Top 10</h3>
      {top10.map((row) => (
        <div key={row.rank} className="v7-top-row">
          <span>#{row.rank}</span>
          <span>{shortAddress(row.user)}</span>
          <span>{formatToken(row.amount)} Burn</span>
        </div>
      ))}
    </div>
  );
}

function V7MiniCard({ title, value }) {
  return (
    <div className="v7-mini-card">
      <div>{title}</div>
      <strong>{value}</strong>
    </div>
  );
}

export const V7_CSS = `
.v7-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.v7-mini-card, .v7-box {
  background: rgba(20,20,20,0.82);
  border: 1px solid rgba(240,185,11,0.18);
  border-radius: 18px;
  padding: 16px;
}
.v7-mini-card strong {
  color: ${gold};
  display: block;
  margin-top: 6px;
}
.v7-box button {
  background: ${gold};
  color: #111;
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 800;
  margin: 6px;
  cursor: pointer;
}
.v7-box input {
  background: #080808;
  color: white;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 10px;
  margin-right: 8px;
}
.v7-top-row {
  display: grid;
  grid-template-columns: 60px 1fr 160px;
  gap: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 8px 0;
}
`;
