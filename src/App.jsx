import { useEffect, useMemo, useState } from "react";

const BNB_CHAIN_ID = "0x38";

const links = {
  flap: "#",       // 发币后把 # 替换成 Flap 买币链接
  twitter: "#",    // 把 # 替换成 X / Twitter 链接
  telegram: "#",   // 把 # 替换成 Telegram 链接
  contract: "Coming soon" // 发币后替换成合约地址
};

const season = {
  name: "Season 1",
  status: "Preparing",
  theme: "Genesis Blackhole War",
  totalBurn: "0",
  targetBurn: "100,000,000",
  leadingArmy: "Waiting for launch",
  blackholeKing: "Not born yet",
};

const armies = [
  { id: 1, emoji: "🥷", cn: "忍者军团", en: "Ninja Army", slogan: "隐于黑暗，燃烧出击。", desc: "代表隐忍、突袭与最后一刻反超。", burn: "0", rank: "—" },
  { id: 2, emoji: "🚀", cn: "火箭军团", en: "Rocket Army", slogan: "现在燃烧，之后起飞。", desc: "代表起飞、FOMO 与冲向月球。", burn: "0", rank: "—" },
  { id: 3, emoji: "💎", cn: "钻石军团", en: "Diamond Army", slogan: "钻石手永不投降。", desc: "代表信仰、持有与坚定共识。", burn: "0", rank: "—" },
  { id: 4, emoji: "🦋", cn: "蝴蝶军团", en: "Butterfly Army", slogan: "每一次燃烧，都是一次进化。", desc: "代表蜕变、进化与情绪扩散。", burn: "0", rank: "—" },
  { id: 5, emoji: "🔶", cn: "币安军团", en: "Binance Army", slogan: "金色共识，燃烧集结。", desc: "社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。", burn: "0", rank: "—" }
];

const playerRanking = [
  { rank: 1, wallet: "Waiting for first burn", army: "—", burned: "0", title: "Blackhole King" },
  { rank: 2, wallet: "Coming soon", army: "—", burned: "0", title: "Blackhole Lord" },
  { rank: 3, wallet: "Coming soon", army: "—", burned: "0", title: "Burn Warrior" },
  { rank: 4, wallet: "Coming soon", army: "—", burned: "0", title: "Burn Warrior" },
  { rank: 5, wallet: "Coming soon", army: "—", burned: "0", title: "Mini Burner" },
];

const warRules = [
  "当前 V3 支持连接钱包和选择军团；选择结果会保存在浏览器本地。",
  "下一阶段可升级为链上 joinArmy 合约，让军团选择真正写入链上。",
  "链上真实奖励来自 Flap 黑洞排行燃烧分红金库：燃烧越多，排名越高；排名越高，分红越多。",
  "军团榜前期作为荣誉榜与传播榜，后期可升级为自动阵营分红。",
  "币安军团为社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。"
];

function getProvider() {
  if (typeof window === "undefined") return null;
  return window.BinanceChain || window.ethereum || null;
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortContract(address) {
  if (!address || address === "Coming soon") return "Coming soon";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function storageKey(address) {
  return `emoji-war-army-${address?.toLowerCase()}`;
}

function progressPercent(value) {
  return `${Math.min(100, Math.max(0, value))}%`;
}

export default function App() {
  const [wallet, setWallet] = useState("");
  const [chainId, setChainId] = useState("");
  const [selectedArmyId, setSelectedArmyId] = useState(null);
  const [status, setStatus] = useState("");

  const selectedArmy = useMemo(
    () => armies.find((army) => army.id === Number(selectedArmyId)),
    [selectedArmyId]
  );

  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    provider.request?.({ method: "eth_accounts" }).then((accounts) => {
      if (accounts?.[0]) setWallet(accounts[0]);
    }).catch(() => {});

    provider.request?.({ method: "eth_chainId" }).then(setChainId).catch(() => {});

    const handleAccountsChanged = (accounts) => {
      setWallet(accounts?.[0] || "");
      setSelectedArmyId(null);
    };

    const handleChainChanged = (id) => setChainId(id);

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (!wallet) return;
    const savedArmy = localStorage.getItem(storageKey(wallet));
    if (savedArmy) setSelectedArmyId(Number(savedArmy));
  }, [wallet]);

  async function connectWallet() {
    const provider = getProvider();
    if (!provider) {
      setStatus("没有检测到钱包插件。请先安装 Binance Wallet，并刷新页面。");
      return;
    }

    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const account = accounts?.[0];
      if (account) setWallet(account);

      const currentChainId = await provider.request({ method: "eth_chainId" });
      setChainId(currentChainId);

      if (currentChainId !== BNB_CHAIN_ID) {
        await switchToBnbChain();
      }

      setStatus("钱包连接成功。请选择你的 Emoji 军团。");
    } catch (error) {
      setStatus(error?.message || "钱包连接失败。");
    }
  }

  async function switchToBnbChain() {
    const provider = getProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BNB_CHAIN_ID }]
      });
      setChainId(BNB_CHAIN_ID);
    } catch (switchError) {
      if (switchError?.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BNB_CHAIN_ID,
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com/"]
          }]
        });
        setChainId(BNB_CHAIN_ID);
      } else {
        throw switchError;
      }
    }
  }

  function chooseArmy(armyId) {
    if (!wallet) {
      setStatus("请先连接 Binance Wallet，再选择军团。");
      return;
    }

    localStorage.setItem(storageKey(wallet), String(armyId));
    setSelectedArmyId(armyId);
    const army = armies.find((item) => item.id === armyId);
    setStatus(`你已加入 ${army.emoji} ${army.cn}。当前为前端保存版本，后续可升级为链上绑定。`);
  }

  return (
    <main>
      <section className="hero" id="top">
        <div className="nav">
          <div className="brand">
            <div className="logo">🔥</div>
            <div>
              <b>Emoji War</b>
              <span>$EMOJI</span>
            </div>
          </div>
          <div className="navLinks">
            <a href="#join">连接钱包</a>
            <a href="#panel">战争面板</a>
            <a href="#armies">军团</a>
            <a href="#rules">规则</a>
          </div>
          <button className="smallBtn" onClick={connectWallet}>
            {wallet ? shortAddress(wallet) : "Connect Wallet"}
          </button>
        </div>

        <div className="heroGrid">
          <div className="heroText">
            <p className="pill"><span></span>情绪上链，黑洞开战</p>
            <h1>Emoji War</h1>
            <h2>链上情绪军团战争</h2>
            <p className="lead">
              Emoji 不再只是表情。每个 Emoji 都是一个军团。
              每一次燃烧，都是一次情绪投票。每一笔交易，都会壮大黑洞金库。
            </p>
            <div className="actions">
              <a className="primaryBtn" href="#join">Connect Binance Wallet</a>
              <a className="secondaryBtn" href={links.flap}>Buy $EMOJI</a>
            </div>
            <p className="note">
              币安军团为社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。
            </p>
          </div>

          <div className="warCard">
            <div className="screenTitle">
              <span>LIVE WAR PANEL</span>
              <b>{season.name}</b>
            </div>
            <div className="armyGrid">
              {armies.map((army) => (
                <div className={`miniArmy ${selectedArmyId === army.id ? "activeMini" : ""}`} key={army.cn}>
                  <div>{army.emoji}</div>
                  <b>{army.cn}</b>
                  <span>{army.burn} burned</span>
                </div>
              ))}
            </div>
            <div className="flywheel">
              交易产生金库 → 燃烧决定排名 → 排名决定分红
            </div>
          </div>
        </div>
      </section>

      <section id="join" className="section joinSection">
        <div className="sectionHead">
          <p>Join The War</p>
          <h2>连接钱包，选择军团</h2>
          <span>V3 版本支持连接 Binance Wallet，并在网站里选择你的 Emoji 军团。当前选择保存在浏览器本地，后续可升级为链上绑定。</span>
        </div>

        <div className="walletPanel">
          <div className="walletStatus">
            <div className="statusTop">
              <span>Wallet Status</span>
              <b>{wallet ? "Connected" : "Not Connected"}</b>
            </div>
            <h3>{wallet ? shortAddress(wallet) : "Connect Binance Wallet"}</h3>
            <p>Network: {chainId === BNB_CHAIN_ID ? "BNB Smart Chain" : chainId ? `Chain ${chainId}` : "Not connected"}</p>
            <p>Army: {selectedArmy ? `${selectedArmy.emoji} ${selectedArmy.cn}` : "Not selected"}</p>
            {status && <div className="statusMessage">{status}</div>}
            <div className="walletActions">
              <button className="primaryBtn buttonReset" onClick={connectWallet}>
                {wallet ? "Reconnect Wallet" : "Connect Wallet"}
              </button>
              <button className="secondaryBtn buttonReset" onClick={switchToBnbChain}>
                Switch to BNB Chain
              </button>
            </div>
          </div>

          <div className="chooseArmyBox">
            <h3>选择你的 Emoji 军团</h3>
            <div className="chooseGrid">
              {armies.map((army) => (
                <button
                  key={army.id}
                  onClick={() => chooseArmy(army.id)}
                  className={selectedArmyId === army.id ? "chosen" : ""}
                >
                  <span>{army.emoji}</span>
                  <b>{army.cn}</b>
                  <small>{army.en}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="panel" className="section panelSection">
        <div className="sectionHead">
          <p>War Dashboard</p>
          <h2>Season 1 战争面板</h2>
          <span>前期可以手动更新数据；后期可升级为自动读取链上燃烧记录。</span>
        </div>

        <div className="dashboardGrid">
          <div className="seasonCard">
            <div className="cardTop">
              <span>{season.name}</span>
              <b>{season.status}</b>
            </div>
            <h3>{season.theme}</h3>
            <div className="seasonStats">
              <div><p>本赛季总燃烧</p><b>{season.totalBurn}</b></div>
              <div><p>燃烧目标</p><b>{season.targetBurn}</b></div>
              <div><p>当前领先军团</p><b>{season.leadingArmy}</b></div>
              <div><p>黑洞之王</p><b>{season.blackholeKing}</b></div>
            </div>
            <div className="targetBar"><div style={{ width: progressPercent(0) }}></div></div>
            <p className="seasonHint">Season 1 将在代币正式上线后开启。当前面板为预启动状态。</p>
          </div>

          <div className="joinCard">
            <h3>你的战争身份</h3>
            <p>{wallet ? `钱包：${shortAddress(wallet)}` : "请先连接 Binance Wallet。"}</p>
            <p>{selectedArmy ? `军团：${selectedArmy.emoji} ${selectedArmy.cn}` : "还没有选择军团。"}</p>
            <div className="contractBox">
              <span>Contract</span>
              <b>{shortContract(links.contract)}</b>
            </div>
          </div>
        </div>

        <div className="rankingGrid">
          <div className="rankingCard">
            <div className="rankingHead"><h3>军团燃烧榜</h3><span>Army Ranking</span></div>
            {armies.map((army, index) => (
              <div className="armyRow" key={army.cn}>
                <div className="rankBadge">{index + 1}</div>
                <div className="armyName">
                  <span>{army.emoji}</span>
                  <div><b>{army.cn}</b><p>{army.en}</p></div>
                </div>
                <div className="armyBurn"><b>{army.burn}</b><p>burned</p></div>
              </div>
            ))}
          </div>

          <div className="rankingCard">
            <div className="rankingHead"><h3>个人黑洞榜</h3><span>Player Ranking</span></div>
            {playerRanking.map((player) => (
              <div className="playerRow" key={player.rank}>
                <div className="rankBadge">{player.rank}</div>
                <div className="playerInfo"><b>{player.wallet}</b><p>{player.title}</p></div>
                <div className="playerBurn"><b>{player.burned}</b><p>{player.army}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="armies" className="section dark">
        <div className="sectionHead">
          <p>Five Armies</p>
          <h2>五大 Emoji 军团</h2>
          <span>选择你的情绪身份，加入军团，燃烧 $EMOJI，冲击黑洞排行榜。</span>
        </div>
        <div className="cards">
          {armies.map((army) => (
            <article className={`card ${selectedArmyId === army.id ? "selectedCard" : ""}`} key={army.cn}>
              <div className="bigEmoji">{army.emoji}</div>
              <h3>{army.cn}</h3>
              <p className="en">{army.en}</p>
              <b>{army.slogan}</b>
              <span>{army.desc}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="rules" className="section dark">
        <div className="sectionHead">
          <p>Rules</p>
          <h2>战争规则</h2>
          <span>先完成钱包连接与军团选择，再升级链上绑定、燃烧合约、自动排行榜和 Claim 奖励。</span>
        </div>
        <div className="rulesList">
          {warRules.map((rule, index) => (
            <div key={rule}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <p>{rule}</p>
            </div>
          ))}
        </div>

        <div className="quote">
          <h2>不是谁喊得响，谁赢。是谁烧得多，谁赢。</h2>
          <p>情绪上链，黑洞开战。</p>
        </div>
      </section>

      <footer>
        <div>
          <b>Emoji War / $EMOJI</b>
          <p>Community meme project. Not affiliated with Binance.</p>
          <p>Contract: {links.contract}</p>
        </div>
        <div className="footerLinks">
          <a href={links.twitter}>X / Twitter</a>
          <a href={links.telegram}>Telegram</a>
          <a href={links.flap}>Flap</a>
        </div>
      </footer>
    </main>
  )
}
