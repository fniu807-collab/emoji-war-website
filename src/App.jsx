const armies = [
  { emoji: "🥷", cn: "忍者军团", en: "Ninja Army", slogan: "隐于黑暗，燃烧出击。", desc: "代表隐忍、突袭与最后一刻反超。" },
  { emoji: "🚀", cn: "火箭军团", en: "Rocket Army", slogan: "现在燃烧，之后起飞。", desc: "代表起飞、FOMO 与冲向月球。" },
  { emoji: "💎", cn: "钻石军团", en: "Diamond Army", slogan: "钻石手永不投降。", desc: "代表信仰、持有与坚定共识。" },
  { emoji: "🦋", cn: "蝴蝶军团", en: "Butterfly Army", slogan: "每一次燃烧，都是一次进化。", desc: "代表蜕变、进化与情绪扩散。" },
  { emoji: "🔶", cn: "币安军团", en: "Binance Army", slogan: "金色共识，燃烧集结。", desc: "社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。" }
];

const links = {
  flap: "#",       // 发币后把 # 替换成 Flap 买币链接
  twitter: "#",    // 把 # 替换成 X / Twitter 链接
  telegram: "#",   // 把 # 替换成 Telegram 链接
  contract: "Coming soon" // 发币后替换成合约地址
};

export default function App() {
  return (
    <main>
      <section className="hero">
        <div className="nav">
          <div className="brand">
            <div className="logo">🔥</div>
            <div><b>Emoji War</b><span>$EMOJI</span></div>
          </div>
          <div className="navLinks">
            <a href="#armies">军团</a><a href="#mechanism">机制</a><a href="#blackhole">黑洞玩法</a>
          </div>
          <a className="smallBtn" href={links.flap}>Buy on Flap</a>
        </div>

        <div className="heroGrid">
          <div className="heroText">
            <p className="pill"><span></span>情绪上链，黑洞开战</p>
            <h1>Emoji War</h1>
            <h2>链上情绪军团战争</h2>
            <p className="lead">Emoji 不再只是表情。每个 Emoji 都是一个军团。每一次燃烧，都是一次情绪投票。每一笔交易，都会壮大黑洞金库。</p>
            <div className="actions">
              <a className="primaryBtn" href={links.flap}>Buy $EMOJI</a>
              <a className="secondaryBtn" href="#armies">选择你的军团</a>
            </div>
            <p className="note">币安军团为社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。</p>
          </div>

          <div className="warCard">
            <div className="armyGrid">
              {armies.map((army) => (
                <div className="miniArmy" key={army.cn}><div>{army.emoji}</div><b>{army.cn}</b></div>
              ))}
            </div>
            <div className="flywheel">交易产生金库 → 燃烧决定排名 → 排名决定分红</div>
          </div>
        </div>
      </section>

      <section id="armies" className="section dark">
        <div className="sectionHead"><p>Five Armies</p><h2>五大 Emoji 军团</h2><span>选择你的情绪身份，加入军团，燃烧 $EMOJI，冲击黑洞排行榜。</span></div>
        <div className="cards">
          {armies.map((army) => (
            <article className="card" key={army.cn}>
              <div className="bigEmoji">{army.emoji}</div>
              <h3>{army.cn}</h3><p className="en">{army.en}</p><b>{army.slogan}</b><span>{army.desc}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="mechanism" className="section">
        <div className="twoCol">
          <div><p className="gold">Mechanism</p><h2>黑洞排行燃烧分红金库</h2><p className="paragraph">Emoji War 的机制围绕三件事运行：燃烧、排行、分红。用户燃烧 $EMOJI 后进入黑洞排行榜，燃烧越多，排名越高；排名越高，分红越多。</p></div>
          <div className="rules">
            <div><b>01</b><span>Flap 黑洞排行燃烧分红金库</span></div>
            <div><b>02</b><span>买入税 3% / 卖出税 5%</span></div>
            <div><b>03</b><span>0 营销钱包 / 0 项目方抽水</span></div>
            <div><b>04</b><span>税收全部进入黑洞排行燃烧分红金库</span></div>
            <div><b>05</b><span>燃烧越多，排名越高；排名越高，分红越多</span></div>
          </div>
        </div>
      </section>

      <section id="blackhole" className="section dark">
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
