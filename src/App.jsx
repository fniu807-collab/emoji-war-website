import React, { useEffect, useMemo, useState } from "react";
import { Shield, Flame, Trophy, Rocket, Wallet, RefreshCw, Crown, Timer, Gem, Users, Coins } from "lucide-react";
import { EMOJI_WAR_V7_CONFIG } from "./emojiWarV7/config.js";
import {
  connectWallet,
  readV7Dashboard,
  approveBurn,
  joinArmy,
  burnToken,
  claimRealtime,
  claimSeasonBonus,
  claimAll,
  formatBNB,
  formatToken,
  shortAddress,
  armyLabel,
  formatCountdown,
} from "./emojiWarV7/emojiWarV7Client.js";

const armyColors = {
  1: "🥷",
  2: "🚀",
  3: "💎",
  4: "🦋",
  5: "🔶",
};

export default function App() {
  const [address, setAddress] = useState("");
  const [data, setData] = useState(null);
  const [burnAmount, setBurnAmount] = useState("1000");
  const [selectedArmy, setSelectedArmy] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const currentSeason = data?.currentSeason || 1;

  async function refresh(addr = address) {
    if (!addr) return;
    const next = await readV7Dashboard(addr);
    setData(next);
  }

  async function handleConnect() {
    try {
      setLoading(true);
      setMessage("连接钱包中...");
      const res = await connectWallet();
      setAddress(res.address);
      const next = await readV7Dashboard(res.address);
      setData(next);
      setMessage("钱包连接成功");
    } catch (err) {
      console.error(err);
      setMessage(err?.shortMessage || err?.message || "连接失败");
    } finally {
      setLoading(false);
    }
  }

  async function run(label, fn) {
    try {
      setLoading(true);
      setMessage(label + "...");
      await fn();
      setMessage(label + " 成功");
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage(err?.reason || err?.shortMessage || err?.message || label + " 失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!address) return;
    const timer = setInterval(() => refresh(address).catch(() => {}), 15000);
    return () => clearInterval(timer);
  }, [address]);

  const topRows = useMemo(() => (data?.top10 || []).filter((x) => x.user && x.user !== "0x0000000000000000000000000000000000000000"), [data]);

  return (
    <main className="page">
      <div className="orb orb-left" />
      <div className="orb orb-right" />

      <nav className="nav">
        <div className="brand">
          <div className="brand-mark">⚔️</div>
          <div>
            <strong>Emoji War</strong>
            <span>$EMOJI V7</span>
          </div>
        </div>

        <div className="nav-links">
          <a href="#mechanism">机制</a>
          <a href="#army">军团</a>
          <a href="#burn">燃烧</a>
          <a href="#claim">分红</a>
        </div>

        <button className="wallet-btn" onClick={handleConnect} disabled={loading}>
          <Wallet size={16} />
          {address ? shortAddress(address) : "Connect Wallet"}
        </button>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="tag">V7 Final · BNB Mainnet Test</div>
          <h1>
            Emoji War
            <br />
            主网预上线
          </h1>
          <p>
            税收进入黑洞金库，燃烧获得分红权重，持币决定领取资格，军团决定赛季胜负。
          </p>
          <div className="hero-actions">
            <a className="primary" href={EMOJI_WAR_V7_CONFIG.links.buyUrl} target="_blank" rel="noreferrer">
              Buy EWTEST
            </a>
            <button className="secondary" onClick={() => refresh()} disabled={!address || loading}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {message && <div className="message">{message}</div>}
        </div>

        <div className="hero-visual">
          <div className="war-coin">
            <div className="coin-ring" />
            <div className="coin-face">😠</div>
            <div className="army-badge badge-1">🥷</div>
            <div className="army-badge badge-2">🚀</div>
            <div className="army-badge badge-3">💎</div>
            <div className="army-badge badge-4">🦋</div>
            <div className="army-badge badge-5">🔶</div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <Stat icon={<Timer />} title="Current Season" value={data ? `Season ${data.currentSeason}` : "-"} sub={data ? `Ends in ${formatCountdown(data.secondsLeft)}` : "Connect wallet"} />
        <Stat icon={<Coins />} title="Token Balance" value={data ? `${formatToken(data.tokenBalance)} ${EMOJI_WAR_V7_CONFIG.token.symbol}` : "-"} sub={data?.hasMinHold ? "已满足 500,000 持币门槛" : "未满足 500,000 持币门槛"} />
        <Stat icon={<Flame />} title="My Burn" value={data ? `${formatToken(data.myBurn)} Burn` : "-"} sub={data ? armyLabel(data.myArmy) : "选择军团后燃烧"} />
        <Stat icon={<Trophy />} title="Winning Army" value={data ? armyLabel(data.winningArmy) : "-"} sub={data ? `${formatToken(data.winningAmount)} Burn` : "本赛季冠军军团"} />
        <Stat icon={<Gem />} title="Realtime Claimable" value={data ? `${formatBNB(data.realtimeClaimable, 8)} BNB` : "-"} sub="50% 实时燃烧分红" />
        <Stat icon={<Crown />} title="Season Bonus" value={data ? `${formatBNB(data.seasonBonusClaimable, 8)} BNB` : "-"} sub="30% 冠军 + 20% Top10" />
        <Stat icon={<Shield />} title="Vault Balance" value={data ? `${formatBNB(data.vaultBalance, 6)} BNB` : "-"} sub="EmojiWarVault" />
        <Stat icon={<Users />} title="RewardPool" value={data ? `${formatBNB(data.rewardPoolBalance, 6)} BNB` : "-"} sub="V7 分红池余额" />
      </section>

      <section id="mechanism" className="mechanism">
        <div className="section-head">
          <span>Final Mechanism</span>
          <h2>黑洞金库 · 燃烧分红 · 军团战争</h2>
        </div>
        <div className="mechanism-grid">
          <div className="mechanism-card">
            <strong>50%</strong>
            <h3>实时燃烧分红</h3>
            <p>Burn 后获得 Burn Share，7 天有效，只参与 Burn 之后进入池子的分红。</p>
          </div>
          <div className="mechanism-card">
            <strong>30%</strong>
            <h3>冠军军团奖励</h3>
            <p>赛季结束后，燃烧量最高军团胜出，冠军军团内按燃烧贡献分配。</p>
          </div>
          <div className="mechanism-card">
            <strong>20%</strong>
            <h3>Top10 排行榜</h3>
            <p>Top1 30%，Top2 20%，Top3 15%，Top4-10 各 5%。</p>
          </div>
        </div>
      </section>

      <section id="army" className="panel">
        <div className="section-head">
          <span>Step 1</span>
          <h2>选择军团</h2>
          <p>首次选择后，后续赛季默认继承；新赛季可以主动切换。</p>
        </div>
        <div className="army-grid">
          {EMOJI_WAR_V7_CONFIG.armies.map((army) => (
            <button
              key={army.id}
              className={`army-card ${selectedArmy === army.id ? "active" : ""}`}
              onClick={() => setSelectedArmy(army.id)}
            >
              <div className="army-emoji">{army.emoji}</div>
              <strong>{army.zh}</strong>
              <span>{army.en}</span>
              <p>{army.desc}</p>
            </button>
          ))}
        </div>
        <button className="primary big" onClick={() => run("选择军团", () => joinArmy(selectedArmy))} disabled={!address || loading}>
          Select / Switch Army
        </button>
      </section>

      <section id="burn" className="panel two-col">
        <div>
          <div className="section-head">
            <span>Step 2</span>
            <h2>Approve & Burn</h2>
            <p>燃烧不是销毁情绪，而是把情绪变成分红权重。</p>
          </div>
          <div className="input-row">
            <input value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} placeholder="Burn amount" />
            <span>{EMOJI_WAR_V7_CONFIG.token.symbol}</span>
          </div>
          <div className="action-row">
            <button className="secondary" onClick={() => run("Approve", () => approveBurn(burnAmount))} disabled={!address || loading}>
              Approve
            </button>
            <button className="primary" onClick={() => run("Burn", () => burnToken(burnAmount))} disabled={!address || loading}>
              Burn
            </button>
          </div>
        </div>

        <div className="rule-box">
          <h3>领取规则</h3>
          <p>不持币，不能领。</p>
          <p>不燃烧，没权重。</p>
          <p>Claim 时必须持有 ≥ 500,000 {EMOJI_WAR_V7_CONFIG.token.symbol}。</p>
          <p>Burn Share 有效期 7 天。</p>
        </div>
      </section>

      <section id="claim" className="panel claim-panel">
        <div className="section-head">
          <span>Step 3</span>
          <h2>税收分红领取</h2>
          <p>实时分红可直接领取，赛季奖励需赛季结束并 finalize 后领取。</p>
        </div>
        <div className="claim-cards">
          <div>
            <span>Realtime Claimable</span>
            <strong>{data ? formatBNB(data.realtimeClaimable, 8) : "-"} BNB</strong>
          </div>
          <div>
            <span>Season Bonus</span>
            <strong>{data ? formatBNB(data.seasonBonusClaimable, 8) : "-"} BNB</strong>
          </div>
          <div>
            <span>Hold Status</span>
            <strong>{data?.hasMinHold ? "Eligible" : "Need 500,000+"}</strong>
          </div>
        </div>
        <div className="action-row">
          <button className="primary" onClick={() => run("Claim Realtime", claimRealtime)} disabled={!address || loading}>
            Claim Realtime
          </button>
          <button className="secondary" onClick={() => run("Claim Season Bonus", () => claimSeasonBonus(currentSeason))} disabled={!address || loading}>
            Claim Season Bonus
          </button>
          <button className="secondary" onClick={() => run("Claim All", () => claimAll([currentSeason], true))} disabled={!address || loading}>
            Claim All
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <span>Leaderboard</span>
          <h2>Top 10 Burn Ranking</h2>
        </div>
        <div className="leaderboard">
          {topRows.length === 0 ? (
            <div className="empty">暂无 Top10 数据，连接钱包或 Burn 后刷新。</div>
          ) : (
            topRows.map((row) => (
              <div className="leader-row" key={row.rank}>
                <span>#{row.rank}</span>
                <strong>{shortAddress(row.user)}</strong>
                <em>{formatToken(row.amount)} Burn</em>
              </div>
            ))
          )}
        </div>
      </section>

      <footer>
        <p>Binance Army 为社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。</p>
        <p>当前为 EWTEST V7 测试版，正式 $EMOJI 开盘后仅需替换 config.js 地址。</p>
      </footer>
    </main>
  );
}

function Stat({ icon, title, value, sub }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{sub}</p>
      </div>
    </div>
  );
}
