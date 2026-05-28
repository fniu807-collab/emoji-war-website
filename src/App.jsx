import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";

const BSC_TESTNET_CHAIN_ID = "0x61";
const ARMY_CONTRACT_ADDRESS = "0x1579fe91f42caD600a9A3484F4eeA154D00eB0b3";
const ARMY_ABI = [
  "function currentSeason() view returns (uint256)",
  "function joinArmy(uint8 armyId)",
  "function getUserArmy(uint256 seasonId, address user) view returns (uint8)",
  "function getArmyMembers(uint256 seasonId, uint8 armyId) view returns (uint256)"
];

const links = {
  flap: "#",
  twitter: "#",
  telegram: "#",
  contract: "Coming soon"
};

const armies = [
  { id: 1, emoji: "🥷", cn: "忍者军团", en: "Ninja Army", slogan: "隐于黑暗，燃烧出击。", desc: "代表隐忍、突袭与最后一刻反超。" },
  { id: 2, emoji: "🚀", cn: "火箭军团", en: "Rocket Army", slogan: "现在燃烧，之后起飞。", desc: "代表起飞、FOMO 与冲向月球。" },
  { id: 3, emoji: "💎", cn: "钻石军团", en: "Diamond Army", slogan: "钻石手永不投降。", desc: "代表信仰、持有与坚定共识。" },
  { id: 4, emoji: "🦋", cn: "蝴蝶军团", en: "Butterfly Army", slogan: "每一次燃烧，都是一次进化。", desc: "代表蜕变、进化与情绪扩散。" },
  { id: 5, emoji: "🔶", cn: "币安军团", en: "Binance Army", slogan: "金色共识，燃烧集结。", desc: "社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。" }
];

function injected() { return window.BinanceChain || window.ethereum || null; }
function short(a) { return a ? `${a.slice(0,6)}...${a.slice(-4)}` : ""; }
function getArmy(id) { return armies.find(a => a.id === Number(id)); }

export default function App() {
  const [wallet, setWallet] = useState("");
  const [chainId, setChainId] = useState("");
  const [season, setSeason] = useState("1");
  const [myArmyId, setMyArmyId] = useState(0);
  const [members, setMembers] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const myArmy = useMemo(() => getArmy(myArmyId), [myArmyId]);

  useEffect(() => {
    const p = injected();
    if (!p) return;
    p.request?.({ method: "eth_accounts" }).then(acc => { if (acc?.[0]) setWallet(acc[0]); });
    p.request?.({ method: "eth_chainId" }).then(setChainId);
    p.on?.("accountsChanged", acc => { setWallet(acc?.[0] || ""); setMyArmyId(0); });
    p.on?.("chainChanged", () => location.reload());
  }, []);

  useEffect(() => {
    if (wallet && chainId === BSC_TESTNET_CHAIN_ID) loadData(wallet);
  }, [wallet, chainId]);

  async function switchToTestnet() {
    const p = injected();
    if (!p) throw new Error("没有检测到钱包插件");
    try {
      await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC_TESTNET_CHAIN_ID }] });
    } catch (e) {
      if (e.code === 4902) {
        await p.request({ method: "wallet_addEthereumChain", params: [{ chainId: BSC_TESTNET_CHAIN_ID, chainName: "BSC Testnet", nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 }, rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"], blockExplorerUrls: ["https://testnet.bscscan.com/"] }] });
      } else throw e;
    }
    setChainId(BSC_TESTNET_CHAIN_ID);
  }

  async function connectWallet() {
    const p = injected();
    if (!p) { setStatus("没有检测到钱包插件，请先安装 Binance Wallet 或 MetaMask。"); return; }
    try {
      setLoading(true);
      const acc = await p.request({ method: "eth_requestAccounts" });
      const id = await p.request({ method: "eth_chainId" });
      setWallet(acc?.[0] || "");
      setChainId(id);
      if (id !== BSC_TESTNET_CHAIN_ID) await switchToTestnet();
      setStatus("钱包连接成功，可以链上选择军团。");
      await loadData(acc?.[0]);
    } catch (e) { setStatus(e.message || "钱包连接失败"); }
    finally { setLoading(false); }
  }

  async function contract(withSigner = false) {
    const provider = new BrowserProvider(injected());
    if (withSigner) return new Contract(ARMY_CONTRACT_ADDRESS, ARMY_ABI, await provider.getSigner());
    return new Contract(ARMY_CONTRACT_ADDRESS, ARMY_ABI, provider);
  }

  async function loadData(account = wallet) {
    try {
      const c = await contract(false);
      const s = await c.currentSeason();
      setSeason(s.toString());
      if (account) setMyArmyId(Number(await c.getUserArmy(s, account)));
      const next = {};
      for (const a of armies) next[a.id] = (await c.getArmyMembers(s, a.id)).toString();
      setMembers(next);
    } catch (e) { setStatus("读取链上数据失败，请确认钱包在 BSC Testnet。" ); }
  }

  async function joinArmy(id) {
    if (!wallet) { setStatus("请先连接钱包。"); return; }
    try {
      setLoading(true);
      if (chainId !== BSC_TESTNET_CHAIN_ID) await switchToTestnet();
      const a = getArmy(id);
      setStatus(`正在加入 ${a.emoji} ${a.cn}，请在钱包确认交易。`);
      const c = await contract(true);
      const tx = await c.joinArmy(id);
      setStatus(`交易已提交：${tx.hash}，等待确认。`);
      await tx.wait();
      setStatus(`链上加入成功：${a.emoji} ${a.cn}`);
      await loadData(wallet);
    } catch (e) {
      const msg = e.reason || e.shortMessage || e.message || "交易失败";
      setStatus(msg.includes("Already joined") ? "你本赛季已经加入过军团，不能重复选择。" : msg);
    } finally { setLoading(false); }
  }

  return <main>
    <section className="hero">
      <nav><div className="brand"><div className="logo">🔥</div><div><b>Emoji War</b><span>$EMOJI</span></div></div><div className="navlinks"><a href="#join">链上加入</a><a href="#panel">战争面板</a><a href="#armies">军团</a></div><button onClick={connectWallet}>{wallet ? short(wallet) : "Connect Wallet"}</button></nav>
      <div className="heroGrid"><div><p className="pill">情绪上链，黑洞开战</p><h1>Emoji War</h1><h2>链上情绪军团战争</h2><p className="lead">每个 Emoji 都是一个军团。每一次燃烧，都是一次情绪投票。每一笔交易，都会壮大黑洞金库。</p><div className="actions"><button onClick={connectWallet}>{wallet ? "Wallet Connected" : "Connect Wallet"}</button><a href={links.flap}>Buy $EMOJI</a></div><p className="note">当前 V4 连接 BSC Testnet 测试合约，正式主网部署后需要替换合约地址和网络。</p></div><div className="warCard"><div className="screen"><span>ON-CHAIN PANEL</span><b>Season {season}</b></div><div className="armyGrid">{armies.map(a => <div className={myArmyId===a.id ? "mini active" : "mini"} key={a.id}><div>{a.emoji}</div><b>{a.cn}</b><span>{members[a.id] || "0"} members</span></div>)}</div><div className="fly">链上选择军团 → 燃烧决定排名 → 排名决定分红</div></div></div>
    </section>

    <section id="join" className="section"><div className="head"><p>Join On-chain</p><h2>链上选择你的军团</h2><span>点击军团后，钱包会弹出确认，交易成功后军团身份会写入 BSC Testnet 合约。</span></div><div className="walletPanel"><div className="box"><div className="top"><span>Wallet</span><b>{wallet ? "Connected" : "Not Connected"}</b></div><h3>{wallet ? short(wallet) : "Connect Wallet"}</h3><p>Network: {chainId === BSC_TESTNET_CHAIN_ID ? "BSC Testnet" : chainId || "Not connected"}</p><p>Army: {myArmy ? `${myArmy.emoji} ${myArmy.cn}` : "Not selected on-chain"}</p><p>Army Contract: {ARMY_CONTRACT_ADDRESS}</p>{status && <div className="status">{status}</div>}<div className="actions"><button disabled={loading} onClick={connectWallet}>{loading ? "Processing..." : "Connect / Refresh"}</button><button disabled={loading} onClick={switchToTestnet}>Switch to BSC Testnet</button></div></div><div className="box"><h3>选择军团并写入链上</h3><div className="chooseGrid">{armies.map(a => <button disabled={loading || Number(myArmyId)!==0} className={myArmyId===a.id ? "chosen" : ""} onClick={() => joinArmy(a.id)} key={a.id}><span>{a.emoji}</span><b>{a.cn}</b><small>{a.en}</small></button>)}</div><p className="hint">每个钱包每个赛季只能选择一次军团。</p></div></div></section>

    <section id="panel" className="section dark"><div className="head"><p>War Dashboard</p><h2>Season {season} 战争面板</h2><span>军团成员数已从链上测试合约读取。燃烧榜和分红数据将在下一阶段接入。</span></div><div className="ranking">{armies.map((a,i)=><div className="row" key={a.id}><div className="rank">{i+1}</div><div className="armyName"><span>{a.emoji}</span><div><b>{a.cn}</b><p>{a.en}</p></div></div><div><b>{members[a.id] || "0"}</b><p>members</p></div></div>)}</div></section>

    <section id="armies" className="section"><div className="head"><p>Five Armies</p><h2>五大 Emoji 军团</h2></div><div className="cards">{armies.map(a => <article className={myArmyId===a.id ? "card selected" : "card"} key={a.id}><div>{a.emoji}</div><h3>{a.cn}</h3><p>{a.en}</p><b>{a.slogan}</b><span>{a.desc}</span></article>)}</div></section>
    <footer><div><b>Emoji War / $EMOJI</b><p>Token Contract: {links.contract}</p><p>Army Test Contract: {ARMY_CONTRACT_ADDRESS}</p></div><div><a href={links.twitter}>X</a><a href={links.telegram}>Telegram</a><a href={links.flap}>Flap</a></div></footer>
  </main>;
}
