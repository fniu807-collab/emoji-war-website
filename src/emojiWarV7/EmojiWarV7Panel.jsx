import React, { useEffect, useState } from "react";
import { EMOJI_WAR_V7_CONFIG } from "./config.js";
import { connectWallet, readV7Dashboard, approveBurn, joinArmy, burnToken, claimRealtime, claimSeasonBonus, claimAll, fmtWei, shortAddress } from "./emojiWarV7Client.js";

function formatSeconds(sec) { const s = Number(sec || 0); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s % 60; return `${h}h ${m}m ${r}s`; }

export default function EmojiWarV7Panel() {
  const [wallet, setWallet] = useState("");
  const [data, setData] = useState(null);
  const [burnAmount, setBurnAmount] = useState("1000");
  const [armyId, setArmyId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const currentSeason = data?.currentSeason || 1;

  async function refresh(addr = wallet) { if (!addr) return; setData(await readV7Dashboard(addr)); }
  async function run(label, fn) { try { setLoading(true); setMsg(`${label}...`); await fn(); setMsg(`${label} 成功`); await refresh(); } catch (err) { console.error(err); setMsg(err?.reason || err?.shortMessage || err?.message || `${label} 失败`); } finally { setLoading(false); } }
  async function onConnect() { try { setLoading(true); const { address } = await connectWallet(); setWallet(address); setMsg("钱包已连接"); setData(await readV7Dashboard(address)); } catch (err) { console.error(err); setMsg(err?.message || "连接失败"); } finally { setLoading(false); } }

  useEffect(() => { if (!wallet) return; const timer = setInterval(() => refresh(wallet), 15000); return () => clearInterval(timer); }, [wallet]);

  return <div style={{ maxWidth: 1120, margin: "0 auto", padding: 24, color: "#fff", background: "#080808", fontFamily: "Inter, Arial" }}>
    <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
      <div><h1 style={{ fontSize: 42, margin: 0 }}>Emoji War V7</h1><p style={{ color: "#f0b90b", marginTop: 8 }}>情绪上链，黑洞开战</p></div>
      <button onClick={onConnect} disabled={loading} style={btnStyle}>{wallet ? shortAddress(wallet) : "Connect Wallet"}</button>
    </header>
    {msg && <div style={noticeStyle}>{msg}</div>}
    <section style={gridStyle}>
      <Card title="Current Season" value={data ? `Season ${data.currentSeason}` : "-"} sub={`Ends in ${data ? formatSeconds(data.secondsLeft) : "-"}`} />
      <Card title="Token Balance" value={data ? `${fmtWei(data.tokenBalance, 2)} EWTEST` : "-"} sub={data?.hasMinHold ? "已满足 500,000 持币门槛" : "未满足 500,000 持币门槛"} />
      <Card title="Realtime Claimable" value={data ? `${fmtWei(data.realtimeClaimable, 8)} BNB` : "-"} sub="实时燃烧分红" />
      <Card title="Season Bonus" value={data ? `${fmtWei(data.seasonBonusClaimable, 8)} BNB` : "-"} sub="冠军军团 + Top10 奖励" />
      <Card title="Vault Balance" value={data ? `${fmtWei(data.vaultBalance, 6)} BNB` : "-"} sub="EmojiWarVault" />
      <Card title="RewardPool" value={data ? `${fmtWei(data.rewardPoolBalance, 6)} BNB` : "-"} sub="V7 分红池余额" />
    </section>
    <section style={panelStyle}><h2>1. Select Army</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{EMOJI_WAR_V7_CONFIG.armies.map((army) => <button key={army.id} onClick={() => setArmyId(army.id)} style={{ ...chipStyle, borderColor: armyId === army.id ? "#f0b90b" : "#333" }}>{army.emoji} {army.zh}</button>)}</div><button disabled={loading || !wallet} onClick={() => run("选择军团", () => joinArmy(armyId))} style={btnStyle}>Select / Switch Army</button></section>
    <section style={panelStyle}><h2>2. Approve & Burn</h2><input value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} placeholder="Burn amount" style={inputStyle} /><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button disabled={loading || !wallet} onClick={() => run("Approve", () => approveBurn(burnAmount))} style={btnStyle}>Approve</button><button disabled={loading || !wallet} onClick={() => run("Burn", () => burnToken(burnAmount))} style={btnStyle}>Burn</button></div><p style={{ color: "#999" }}>Burn Share 有效期 7 天。Claim 时必须持有 ≥ 500,000 EWTEST / EMOJI。</p></section>
    <section style={panelStyle}><h2>3. Claim Rewards</h2><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button disabled={loading || !wallet} onClick={() => run("Claim Realtime", claimRealtime)} style={btnStyle}>Claim Realtime</button><button disabled={loading || !wallet} onClick={() => run("Claim Season Bonus", () => claimSeasonBonus(currentSeason))} style={btnStyle}>Claim Season Bonus</button><button disabled={loading || !wallet} onClick={() => run("Claim All", () => claimAll([currentSeason], true))} style={btnStyle}>Claim All</button></div></section>
    <section style={panelStyle}><h2>Top 10</h2>{(data?.top10 || []).map((row) => <div key={row.rank} style={rowStyle}><span>#{row.rank}</span><span>{shortAddress(row.user)}</span><span>{fmtWei(row.amount, 2)} Burn</span></div>)}</section>
  </div>;
}
function Card({ title, value, sub }) { return <div style={cardStyle}><div style={{ color: "#aaa", fontSize: 13 }}>{title}</div><div style={{ color: "#f0b90b", fontSize: 24, fontWeight: 800, marginTop: 8 }}>{value}</div><div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>{sub}</div></div>; }
const btnStyle = { background: "#f0b90b", color: "#111", border: "none", borderRadius: 999, padding: "12px 18px", fontWeight: 800, cursor: "pointer" };
const panelStyle = { border: "1px solid #222", borderRadius: 24, padding: 20, marginTop: 20, background: "#111" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 24 };
const cardStyle = { background: "#151515", border: "1px solid #2a2a2a", borderRadius: 20, padding: 18 };
const inputStyle = { width: "100%", maxWidth: 360, padding: 12, borderRadius: 12, border: "1px solid #333", background: "#080808", color: "#fff", marginBottom: 12 };
const chipStyle = { background: "#151515", color: "#fff", border: "1px solid #333", borderRadius: 999, padding: "10px 14px", cursor: "pointer" };
const rowStyle = { display: "grid", gridTemplateColumns: "80px 1fr 160px", gap: 12, padding: "10px 0", borderBottom: "1px solid #222" };
const noticeStyle = { marginTop: 16, padding: 12, borderRadius: 12, background: "rgba(240,185,11,0.12)", border: "1px solid rgba(240,185,11,0.25)", color: "#f0b90b" };
