const links = {
  flap: "#",
  twitter: "#",
  telegram: "#",
  contract: "Coming soon"
};

const season = {
  name: "Season 1",
  status: "Preparing",
  theme: "Genesis Blackhole War",
  totalBurn: "0",
  targetBurn: "100,000,000",
  leadingArmy: "Waiting for launch",
  blackholeKing: "Not born yet",
  progress: 0
};

const armies = [
  ["🥷","忍者军团","Ninja Army","隐于黑暗，燃烧出击。","代表隐忍、突袭与最后一刻反超。","0","0"],
  ["🚀","火箭军团","Rocket Army","现在燃烧，之后起飞。","代表起飞、FOMO 与冲向月球。","0","0"],
  ["💎","钻石军团","Diamond Army","钻石手永不投降。","代表信仰、持有与坚定共识。","0","0"],
  ["🦋","蝴蝶军团","Butterfly Army","每一次燃烧，都是一次进化。","代表蜕变、进化与情绪扩散。","0","0"],
  ["🔶","币安军团","Binance Army","金色共识，燃烧集结。","社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。","0","0"]
].map(([emoji, cn, en, slogan, desc, burn, members], i) => ({emoji, cn, en, slogan, desc, burn, members, rank: i+1}));

const players = [
  [1,"Waiting for first burn","—","0","Blackhole King"],
  [2,"Coming soon","—","0","Blackhole Lord"],
  [3,"Coming soon","—","0","Burn Warrior"],
  [4,"Coming soon","—","0","Burn Warrior"],
  [5,"Coming soon","—","0","Mini Burner"]
].map(([rank,wallet,army,burned,title])=>({rank,wallet,army,burned,title}));

const rules = [
  "每周一个赛季，赛季结束后公布 Blackhole King 与最强军团。",
  "用户选择一个 Emoji 军团后，燃烧 $EMOJI 即可为个人和军团增加燃烧积分。",
  "链上真实奖励来自 Flap 黑洞排行燃烧分红金库：燃烧越多，排名越高；排名越高，分红越多。",
  "军团榜前期作为荣誉榜与传播榜，后期可升级为自动阵营分红。",
  "币安军团为社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。"
];

function shortContract(address) {
  if (!address || address === "Coming soon") return "Coming soon";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function App() {
  return (
    <main>
      <section className="hero" id="top">
        <nav className="nav">
          <div className="brand"><div className="logo">🔥</div><div><b>Emoji War</b><span>$EMOJI</span></div></div>
          <div className="navLinks"><a href="#panel">战争面板</a><a href="#armies">军团</a><a href="#mechanism">机制</a><a href="#rules">规则</a></div>
          <a className="smallBtn" href={links.flap}>Buy on Flap</a>
        </nav>

        <div className="heroGrid">
          <div className="heroText">
            <p className="pill"><span></span>情绪上链，黑洞开战</p>
            <h1>Emoji War</h1>
            <h2>链上情绪军团战争</h2>
            <p className="lead">Emoji 不再只是表情。每个 Emoji 都是一个军团。每一次燃烧，都是一次情绪投票。每一笔交易，都会壮大黑洞金库。</p>
            <div className="actions"><a className="primaryBtn" href={links.flap}>Buy $EMOJI</a><a className="secondaryBtn" href="#panel">进入战争面板</a></div>
            <p className="note">币安军团为社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。</p>
          </div>

          <div className="warCard">
            <div className="screenTitle"><span>LIVE WAR PANEL</span><b>{season.name}</b></div>
            <div className="armyGrid">{armies.map(a => <div className="miniArmy" key={a.cn}><div>{a.emoji}</div><b>{a.cn}</b><span>{a.burn} burned</span></div>)}</div>
            <div className="flywheel">交易产生金库 → 燃烧决定排名 → 排名决定分红</div>
          </div>
        </div>
      </section>

      <section id="panel" className="section panelSection">
        <div className="sectionHead"><p>War Dashboard</p><h2>Season 1 战争面板</h2><span>前期可以手动更新数据；后期可升级为自动读取链上燃烧记录。</span></div>
        <div className="dashboardGrid">
          <div className="seasonCard">
            <div className="cardTop"><span>{season.name}</span><b>{season.status}</b></div>
            <h3>{season.theme}</h3>
            <div className="seasonStats">
              <div><p>本赛季总燃烧</p><b>{season.totalBurn}</b></div>
              <div><p>燃烧目标</p><b>{season.targetBurn}</b></div>
              <div><p>当前领先军团</p><b>{season.leadingArmy}</b></div>
              <div><p>黑洞之王</p><b>{season.blackholeKing}</b></div>
            </div>
            <div className="targetBar"><div style={{width: `${season.progress}%`}} /></div>
            <p className="seasonHint">Season 1 将在代币正式上线后开启。当前面板为预启动状态。</p>
          </div>

          <div className="joinCard">
            <h3>选择你的军团</h3>
            <p>前期加入方式：在 X / Telegram 宣布你的军团，并在 Flap 黑洞金库参与燃烧冲榜。</p>
            <div className="joinButtons">{armies.map(a => <a key={a.cn} href={links.twitter}>{a.emoji} {a.cn}</a>)}</div>
            <div className="contractBox"><span>Contract</span><b>{shortContract(links.contract)}</b></div>
          </div>
        </div>

        <div className="rankingGrid">
          <div className="rankingCard">
            <div className="rankingHead"><h3>军团燃烧榜</h3><span>Army Ranking</span></div>
            {armies.map(a => <div className="armyRow" key={a.cn}><div className="rankBadge">{a.rank}</div><div className="armyName"><span>{a.emoji}</span><div><b>{a.cn}</b><p>{a.en}</p></div></div><div className="armyBurn"><b>{a.burn}</b><p>burned</p></div></div>)}
          </div>
          <div className="rankingCard">
            <div className="rankingHead"><h3>个人黑洞榜</h3><span>Player Ranking</span></div>
            {players.map(p => <div className="playerRow" key={p.rank}><div className="rankBadge">{p.rank}</div><div className="playerInfo"><b>{p.wallet}</b><p>{p.title}</p></div><div className="playerBurn"><b>{p.burned}</b><p>{p.army}</p></div></div>)}
          </div>
        </div>
      </section>

      <section id="armies" className="section dark">
        <div className="sectionHead"><p>Five Armies</p><h2>五大 Emoji 军团</h2><span>选择你的情绪身份，加入军团，燃烧 $EMOJI，冲击黑洞排行榜。</span></div>
        <div className="cards">{armies.map(a => <article className="card" key={a.cn}><div className="bigEmoji">{a.emoji}</div><h3>{a.cn}</h3><p className="en">{a.en}</p><b>{a.slogan}</b><span>{a.desc}</span></article>)}</div>
      </section>

      <section id="mechanism" className="section">
        <div className="twoCol">
          <div><p className="gold">Mechanism</p><h2>黑洞排行燃烧分红金库</h2><p className="paragraph">Emoji War 的机制围绕三件事运行：燃烧、排行、分红。用户燃烧 $EMOJI 后进入黑洞排行榜，燃烧越多，排名越高；排名越高，分红越多。</p></div>
          <div className="rulesBox">
            <div><b>01</b><span>Flap 黑洞排行燃烧分红金库</span></div>
            <div><b>02</b><span>买入税 3% / 卖出税 5%</span></div>
            <div><b>03</b><span>0 营销钱包 / 0 项目方抽水</span></div>
            <div><b>04</b><span>税收全部进入黑洞排行燃烧分红金库</span></div>
            <div><b>05</b><span>燃烧越多，排名越高；排名越高，分红越多</span></div>
          </div>
        </div>
      </section>

      <section id="rules" className="section dark">
        <div className="sectionHead"><p>Rules</p><h2>战争规则</h2><span>规则保持简单，用户一眼看懂。后期再升级钱包绑定、自动排行榜和自动 Claim 奖励。</span></div>
        <div className="rulesList">{rules.map((r,i) => <div key={r}><b>{String(i+1).padStart(2,"0")}</b><p>{r}</p></div>)}</div>
        <div className="blackholeCards">
          <div><h3>Blackhole King</h3><p>每周燃烧榜第一，成为本周黑洞之王。</p></div>
          <div><h3>Emoji King</h3><p>本周最强军团获得全社区曝光。</p></div>
          <div><h3>Blackhole Boss</h3><p>设定每周燃烧目标，全社区一起击穿黑洞。</p></div>
        </div>
        <div className="quote"><h2>不是谁喊得响，谁赢。是谁烧得多，谁赢。</h2><p>情绪上链，黑洞开战。</p></div>
      </section>

      <footer>
        <div><b>Emoji War / $EMOJI</b><p>Community meme project. Not affiliated with Binance.</p><p>Contract: {links.contract}</p></div>
        <div className="footerLinks"><a href={links.twitter}>X / Twitter</a><a href={links.telegram}>Telegram</a><a href={links.flap}>Flap</a></div>
      </footer>
    </main>
  )
}

export default App
