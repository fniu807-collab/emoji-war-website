import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";

const BNB_MAINNET_CHAIN_ID = "0x38"; // 56
const BNB_MAINNET_NAME = "BNB Smart Chain";

const ARMY_CONTRACT_ADDRESS = "0x274F9F99237a15e346de226D171c607Fb5E8ca3E";
const VAULT_FACTORY_ADDRESS = "0x4cc87327A76430fF09Fa6879BF85BE09e03d1CBA";

// 代币创建后再填写
const TOKEN_CONTRACT_ADDRESS = "Coming soon";
const BURN_CONTRACT_ADDRESS = "Coming soon";
const VAULT_ADDRESS = "Coming soon";

const ARMY_ABI = [
  "function currentSeason() view returns (uint256)",
  "function joinArmy(uint8 armyId)",
  "function getUserArmy(uint256 seasonId, address user) view returns (uint8)",
  "function getArmyMembers(uint256 seasonId, uint8 armyId) view returns (uint256)",
  "function getArmyName(uint8 armyId) pure returns (string)"
];

const links = {
  flap: "#",      // 创建代币后填 Flap 购买链接
  twitter: "#",   // 填项目 X 链接
  telegram: "#",  // 填 TG 链接
  contract: "Coming soon"
};

const armies = [
  { id: 1, emoji: "🥷", cn: "忍者军团", en: "Ninja Army", slogan: "隐于黑暗，燃烧出击。", desc: "隐忍、突袭、反超。真正的忍者不喊单，只在榜上出现。" },
  { id: 2, emoji: "🚀", cn: "火箭军团", en: "Rocket Army", slogan: "现在集结，之后起飞。", desc: "点火、FOMO、冲向月球。每一次燃烧都是一次点火。" },
  { id: 3, emoji: "💎", cn: "钻石军团", en: "Diamond Army", slogan: "钻石手永不投降。", desc: "信仰、持有、坚定共识。不是谁喊得响，谁赢。" },
  { id: 4, emoji: "🦋", cn: "蝴蝶军团", en: "Butterfly Army", slogan: "每一次燃烧，都是一次进化。", desc: "蜕变、进化、扩散。微小情绪，也能掀起风暴。" },
  { id: 5, emoji: "🔶", cn: "币安军团", en: "Binance Army", slogan: "金色共识，燃烧集结。", desc: "社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。" }
];

function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return window.BinanceChain || window.ethereum || null;
}

function chainIdToHex(id) {
  if (!id) return "";
  if (typeof id === "number") return `0x${id.toString(16)}`;
  if (typeof id === "bigint") return `0x${id.toString(16)}`;
  if (typeof id === "string") return id.startsWith("0x") ? id.toLowerCase() : `0x${Number(id).toString(16)}`;
  return "";
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortContract(address) {
  if (!address || address === "Coming soon") return "Coming soon";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function armyById(id) {
  return armies.find((army) => army.id === Number(id));
}

function localArmyKey(wallet) {
  return `emoji-war-mainnet-army-${wallet?.toLowerCase()}`;
}

export default function App() {
  const [wallet, setWallet] = useState("");
  const [chainId, setChainId] = useState("");
  const [currentSeason, setCurrentSeason] = useState("1");
  const [selectedArmyId, setSelectedArmyId] = useState(0);
  const [armyMembers, setArmyMembers] = useState({});
  const [status, setStatus] = useState("V6 主网预上线版已准备。");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const isMainnet = chainId?.toLowerCase() === BNB_MAINNET_CHAIN_ID;
  const selectedArmy = useMemo(() => armyById(selectedArmyId), [selectedArmyId]);
  const rankedArmyMembers = useMemo(() => {
    return [...armies].sort((a, b) => Number(BigInt(armyMembers[b.id] || "0") - BigInt(armyMembers[a.id] || "0")));
  }, [armyMembers]);

  useEffect(() => {
    const injected = getInjectedProvider();
    if (!injected) return;

    const init = async () => {
      try {
        const accounts = await injected.request?.({ method: "eth_accounts" });
        const id = await getCurrentChainId();
        setChainId(id);
        if (accounts?.[0]) {
          setWallet(accounts[0]);
          if (id === BNB_MAINNET_CHAIN_ID) await loadArmyData(accounts[0]);
          else loadLocalArmyFallback(accounts[0]);
        }
      } catch {}
    };
    init();

    const handleAccountsChanged = (accounts) => {
      const account = accounts?.[0] || "";
      setWallet(account);
      setSelectedArmyId(0);
      if (account) loadLocalArmyFallback(account);
    };

    const handleChainChanged = async (id) => {
      const normalized = chainIdToHex(id);
      setChainId(normalized);
      if (wallet && normalized === BNB_MAINNET_CHAIN_ID) await loadArmyData(wallet);
    };

    injected.on?.("accountsChanged", handleAccountsChanged);
    injected.on?.("chainChanged", handleChainChanged);

    return () => {
      injected.removeListener?.("accountsChanged", handleAccountsChanged);
      injected.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [wallet]);

  async function getCurrentChainId() {
    const injected = getInjectedProvider();
    if (!injected) return "";
    try {
      const raw = await injected.request({ method: "eth_chainId" });
      return chainIdToHex(raw);
    } catch {
      try {
        const provider = new BrowserProvider(injected);
        const network = await provider.getNetwork();
        return chainIdToHex(network.chainId);
      } catch {
        return "";
      }
    }
  }

  async function getArmyContract(withSigner = false) {
    const injected = getInjectedProvider();
    if (!injected) throw new Error("没有检测到钱包插件。");
    const provider = new BrowserProvider(injected);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(ARMY_CONTRACT_ADDRESS, ARMY_ABI, signer);
    }
    return new Contract(ARMY_CONTRACT_ADDRESS, ARMY_ABI, provider);
  }

  function loadLocalArmyFallback(account) {
    if (!account) return;
    const saved = localStorage.getItem(localArmyKey(account));
    if (saved) setSelectedArmyId(Number(saved));
  }

  async function connectWallet() {
    const injected = getInjectedProvider();
    if (!injected) {
      setStatus("没有检测到钱包插件。请先安装 Binance Wallet 或 MetaMask。");
      return;
    }

    try {
      setIsLoading(true);
      const accounts = await injected.request({ method: "eth_requestAccounts" });
      const account = accounts?.[0];
      const id = await getCurrentChainId();

      if (account) setWallet(account);
      setChainId(id);

      if (id !== BNB_MAINNET_CHAIN_ID) {
        setStatus("钱包已连接，但当前不是 BNB Smart Chain 主网。请点击切换主网。");
        loadLocalArmyFallback(account);
      } else if (account) {
        await loadArmyData(account);
        setStatus("钱包连接成功，主网军团数据已刷新。");
      }
    } catch (error) {
      setStatus(error?.message || "钱包连接失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function switchToBnbMainnet() {
    const injected = getInjectedProvider();
    if (!injected) return;

    try {
      setIsLoading(true);
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BNB_MAINNET_CHAIN_ID }]
      });
      setChainId(BNB_MAINNET_CHAIN_ID);
      setStatus("已切换到 BNB Smart Chain，请刷新主网数据。");
      if (wallet) await loadArmyData(wallet);
    } catch (switchError) {
      if (switchError?.code === 4902) {
        await injected.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BNB_MAINNET_CHAIN_ID,
            chainName: BNB_MAINNET_NAME,
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com/"]
          }]
        });
        setChainId(BNB_MAINNET_CHAIN_ID);
      } else {
        setStatus(switchError?.message || "切换主网失败。");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function loadArmyData(account = wallet) {
    if (!account) return setStatus("请先连接钱包。");

    try {
      setIsLoading(true);
      const id = await getCurrentChainId();
      setChainId(id);

      if (id !== BNB_MAINNET_CHAIN_ID) {
        setStatus("当前不是 BNB Smart Chain 主网，无法读取主网 Army 合约。");
        loadLocalArmyFallback(account);
        return;
      }

      const armyContract = await getArmyContract(false);
      const seasonId = await armyContract.currentSeason();
      setCurrentSeason(seasonId.toString());

      const myArmy = await armyContract.getUserArmy(seasonId, account);
      const onChainArmy = Number(myArmy);
      const savedArmy = Number(localStorage.getItem(localArmyKey(account)) || "0");
      setSelectedArmyId(onChainArmy || savedArmy || 0);

      const memberData = {};
      for (const army of armies) {
        const members = await armyContract.getArmyMembers(seasonId, army.id);
        memberData[army.id] = members.toString();
      }
      setArmyMembers(memberData);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setStatus(error?.shortMessage || error?.message || "读取主网军团数据失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function joinArmyOnChain(armyId) {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isMainnet) return setStatus("请先切换到 BNB Smart Chain 主网。");

    const army = armyById(armyId);

    try {
      setIsLoading(true);
      const contract = await getArmyContract(true);
      setStatus(`正在加入 ${army.emoji} ${army.cn}，请在钱包确认主网交易。`);
      const tx = await contract.joinArmy(armyId);
      await tx.wait();

      localStorage.setItem(localArmyKey(wallet), String(armyId));
      setSelectedArmyId(armyId);
      setStatus(`主网加入成功：${army.emoji} ${army.cn}`);
      await loadArmyData(wallet);
    } catch (error) {
      const msg = error?.reason || error?.shortMessage || error?.message || "交易失败。";
      setStatus(msg.includes("Already joined") ? "你本赛季已经加入过军团，不能重复选择。" : msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <section className="hero" id="top">
        <div className="nav">
          <div className="brand"><div className="logo">🔥</div><div><b>Emoji War</b><span>$EMOJI</span></div></div>
          <div className="navLinks">
            <a href="#join">加入军团</a>
            <a href="#vault">金库</a>
            <a href="#panel">成员榜</a>
            <a href="#rules">规则</a>
          </div>
          <button className="smallBtn" onClick={connectWallet}>{wallet ? shortContract(wallet) : "Connect Wallet"}</button>
        </div>

        <div className="heroGrid">
          <div className="heroText">
            <p className="pill"><span></span>V6 Pre-Launch · BNB Mainnet</p>
            <h1>Emoji War</h1>
            <h2>主网预上线</h2>
            <p className="lead">
              Emoji War 正在进入正式主网阶段。军团系统已经部署，税收金库模板已经准备。
              $EMOJI 创建完成后，燃烧冲榜将正式开启。
            </p>
            <div className="actions">
              <button className="primaryBtn buttonReset" onClick={connectWallet}>{wallet ? "Wallet Connected" : "Connect Wallet"}</button>
              <button className="secondaryBtn buttonReset" onClick={() => loadArmyData(wallet)} disabled={!wallet || isLoading}>刷新主网数据</button>
            </div>
            <p className="note">
              当前为预上线版本：可连接主网钱包并链上选择军团。Burn Battle 将在 $EMOJI 创建后解锁。
            </p>
          </div>

          <div className="warCard">
            <div className="screenTitle"><span>MAINNET PRE-LAUNCH</span><b>Season {currentSeason}</b></div>
            <div className="armyGrid">
              {armies.map((army) => (
                <div className={`miniArmy ${selectedArmyId === army.id ? "activeMini" : ""}`} key={army.cn}>
                  <div>{army.emoji}</div>
                  <b>{army.cn}</b>
                  <span>{armyMembers[army.id] || "0"} members</span>
                </div>
              ))}
            </div>
            <div className="flywheel">主网军团已启动 → $EMOJI 即将创建 → 燃烧战争即将解锁</div>
          </div>
        </div>
      </section>

      <section id="join" className="section joinSection">
        <div className="sectionHead">
          <p>Step 1</p>
          <h2>主网选择你的军团</h2>
          <span>Army 合约已部署在 BNB Smart Chain 主网。用户可以提前加入军团，正式开币后参与燃烧冲榜。</span>
        </div>

        <div className="walletPanel">
          <div className="walletStatus">
            <div className="statusTop"><span>Wallet Status</span><b>{wallet ? "Connected" : "Not Connected"}</b></div>
            <h3>{wallet ? shortContract(wallet) : "Connect Wallet"}</h3>
            <p>Network: {isMainnet ? "BNB Smart Chain" : chainId ? `Wrong Network (${chainId})` : "Not connected"}</p>
            <p>Army: {selectedArmy ? `${selectedArmy.emoji} ${selectedArmy.cn}` : "Not selected on-chain"}</p>
            <p>Current Season: {currentSeason}</p>
            <p>Last Updated: {lastUpdated || "未刷新"}</p>
            {status && <div className="statusMessage">{status}</div>}
            <div className="walletActions">
              <button className="primaryBtn buttonReset" onClick={connectWallet} disabled={isLoading}>{isLoading ? "Processing..." : "Connect / Refresh"}</button>
              <button className="secondaryBtn buttonReset" onClick={switchToBnbMainnet} disabled={isLoading}>Switch to BNB Mainnet</button>
            </div>
          </div>

          <div className="chooseArmyBox">
            <h3>选择军团</h3>
            <div className="chooseGrid">
              {armies.map((army) => (
                <button key={army.id} onClick={() => joinArmyOnChain(army.id)} className={selectedArmyId === army.id ? "chosen" : ""} disabled={isLoading || Number(selectedArmyId) !== 0}>
                  <span>{army.emoji}</span><b>{army.cn}</b><small>{army.en}</small>
                </button>
              ))}
            </div>
            <p className="chooseHint">每个钱包每个赛季只能选择一次军团。选择后，本赛季不能更换。</p>
          </div>
        </div>
      </section>

      <section id="vault" className="section vaultSection">
        <div className="sectionHead">
          <p>Emoji War Season Vault</p>
          <h2>税收金库模板已准备</h2>
          <span>Flap 自定义税收模板已经部署到 BNB 主网。创建 $EMOJI 时，交易税可以进入 Emoji War Season Vault。</span>
        </div>

        <div className="vaultGrid">
          <div className="vaultBox ready">
            <span>VaultFactory</span>
            <b>{shortContract(VAULT_FACTORY_ADDRESS)}</b>
            <p>{VAULT_FACTORY_ADDRESS}</p>
          </div>
          <div className="vaultBox ready">
            <span>Army Contract</span>
            <b>{shortContract(ARMY_CONTRACT_ADDRESS)}</b>
            <p>{ARMY_CONTRACT_ADDRESS}</p>
          </div>
          <div className="vaultBox locked">
            <span>$EMOJI Token</span>
            <b>{TOKEN_CONTRACT_ADDRESS}</b>
            <p>创建代币后填写正式 CA</p>
          </div>
          <div className="vaultBox locked">
            <span>Burn Contract</span>
            <b>{BURN_CONTRACT_ADDRESS}</b>
            <p>$EMOJI 创建后再部署</p>
          </div>
          <div className="vaultBox locked">
            <span>Season Vault</span>
            <b>{VAULT_ADDRESS}</b>
            <p>Flap 创建代币时自动创建</p>
          </div>
        </div>
      </section>

      <section id="burn" className="section burnSection">
        <div className="sectionHead">
          <p>Step 2</p>
          <h2>Burn Battle 即将解锁</h2>
          <span>$EMOJI 正式创建后，将部署 Burn 合约并开启军团燃烧冲榜。</span>
        </div>
        <div className="lockedPanel">
          <div className="lockIcon">🔒</div>
          <h3>Burn Battle Locked</h3>
          <p>等待 $EMOJI 创建完成后解锁。</p>
          <div className="lockedSteps">
            <div>1. Flap 创建 $EMOJI</div>
            <div>2. 获取正式代币地址</div>
            <div>3. 部署主网 Burn 合约</div>
            <div>4. 官网升级到 V6.1 正式燃烧版</div>
          </div>
        </div>
      </section>

      <section id="panel" className="section panelSection">
        <div className="sectionHead">
          <p>War Dashboard</p>
          <h2>Season {currentSeason} 军团成员榜</h2>
          <span>预上线阶段先展示主网军团成员数。燃烧榜将在 $EMOJI 创建后开启。</span>
        </div>
        <div className="rankingGrid">
          <div className="rankingCard">
            <div className="rankingHead"><h3>军团成员榜</h3><span>Army Members</span></div>
            {rankedArmyMembers.map((army, index) => (
              <div className="armyRow" key={army.cn}>
                <div className="rankBadge">{index + 1}</div>
                <div className="armyName"><span>{army.emoji}</span><div><b>{army.cn}</b><p>{army.en}</p></div></div>
                <div className="armyBurn"><b>{armyMembers[army.id] || "0"}</b><p>members</p></div>
              </div>
            ))}
          </div>

          <div className="rankingCard">
            <div className="rankingHead"><h3>燃烧榜</h3><span>Coming Soon</span></div>
            {armies.map((army, index) => (
              <div className="armyRow" key={army.cn}>
                <div className="rankBadge">{index + 1}</div>
                <div className="armyName"><span>{army.emoji}</span><div><b>{army.cn}</b><p>{army.en}</p></div></div>
                <div className="armyBurn"><b>Locked</b><p>after launch</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="armies" className="section dark">
        <div className="sectionHead"><p>Five Armies</p><h2>五大 Emoji 军团</h2><span>选择你的情绪身份，等待 $EMOJI 燃烧战争开启。</span></div>
        <div className="cards">
          {armies.map((army) => (
            <article className={`card ${selectedArmyId === army.id ? "selectedCard" : ""}`} key={army.cn}>
              <div className="bigEmoji">{army.emoji}</div><h3>{army.cn}</h3><p className="en">{army.en}</p><b>{army.slogan}</b><span>{army.desc}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="rules" className="section dark">
        <div className="sectionHead"><p>Rules</p><h2>预上线规则</h2><span>V6 先开放主网军团选择，V6.1 再开放正式燃烧冲榜。</span></div>
        <div className="rulesList">
          <div><b>01</b><p>连接钱包并切换到 BNB Smart Chain 主网。</p></div>
          <div><b>02</b><p>链上选择一个 Emoji 军团，每个赛季只能选择一次。</p></div>
          <div><b>03</b><p>Flap 创建 $EMOJI 后，交易税进入 Emoji War Season Vault。</p></div>
          <div><b>04</b><p>$EMOJI 创建后部署 Burn 合约，开启正式燃烧冲榜。</p></div>
          <div><b>05</b><p>币安军团为社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。</p></div>
        </div>
        <div className="quote"><h2>不是谁喊得响，谁赢。是谁烧得多，谁赢。</h2><p>情绪上链，燃烧开战。</p></div>
      </section>

      <footer>
        <div>
          <b>Emoji War / $EMOJI</b>
          <p>Community meme project. Not affiliated with Binance.</p>
          <p>VaultFactory: {VAULT_FACTORY_ADDRESS}</p>
          <p>Army: {ARMY_CONTRACT_ADDRESS}</p>
        </div>
        <div className="footerLinks">
          <a href={links.twitter}>X / Twitter</a>
          <a href={links.telegram}>Telegram</a>
          <a href={links.flap}>Flap</a>
        </div>
      </footer>
    </main>
  );
}
