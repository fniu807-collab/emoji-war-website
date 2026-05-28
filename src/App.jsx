import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";

const BSC_TESTNET_CHAIN_ID = "0x61";
const BSC_TESTNET_DECIMAL_ID = 97;
const BSC_TESTNET_NAME = "BSC Testnet";

const ARMY_CONTRACT_ADDRESS = "0x1579fe91f42caD600a9A3484F4eeA154D00eB0b3";
const TEST_TOKEN_ADDRESS = "0xb25519Cf970aE1A12f5F3b288a560C03AEE4DF1D";
const BURN_CONTRACT_ADDRESS = "0xe1082C0D733907B76Ce8B4B995D1CA0dA8B7f795";

const ARMY_ABI = [
  "function currentSeason() view returns (uint256)",
  "function joinArmy(uint8 armyId)",
  "function getUserArmy(uint256 seasonId, address user) view returns (uint8)",
  "function getArmyMembers(uint256 seasonId, uint8 armyId) view returns (uint256)"
];

const TOKEN_ABI = [
  "function balanceOf(address user) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const BURN_ABI = [
  "function burnWholeForArmy(uint256 wholeAmount)",
  "function getUserBurn(uint256 seasonId, address user) view returns (uint256)",
  "function getArmyBurn(uint256 seasonId, uint8 armyId) view returns (uint256)",
  "function getTotalBurn(uint256 seasonId) view returns (uint256)"
];

const links = {
  flap: "#",
  twitter: "#",
  telegram: "#",
  contract: "Coming soon"
};

const armies = [
  { id: 1, emoji: "🥷", cn: "忍者军团", en: "Ninja Army", slogan: "隐于黑暗，燃烧出击。" },
  { id: 2, emoji: "🚀", cn: "火箭军团", en: "Rocket Army", slogan: "现在燃烧，之后起飞。" },
  { id: 3, emoji: "💎", cn: "钻石军团", en: "Diamond Army", slogan: "钻石手永不投降。" },
  { id: 4, emoji: "🦋", cn: "蝴蝶军团", en: "Butterfly Army", slogan: "每一次燃烧，都是一次进化。" },
  { id: 5, emoji: "🔶", cn: "币安军团", en: "Binance Army", slogan: "金色共识，燃烧集结。" }
];

function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return window.BinanceChain || window.ethereum || null;
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function fmtToken(value) {
  try {
    const n = Number(formatUnits(BigInt(value || "0"), 18));
    if (n >= 1_000_000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
  } catch {
    return "0";
  }
}

function armyById(id) {
  return armies.find((army) => army.id === Number(id));
}

function chainIdToHex(id) {
  if (!id) return "";
  if (typeof id === "number") return `0x${id.toString(16)}`;
  if (typeof id === "bigint") return `0x${id.toString(16)}`;
  if (typeof id === "string") return id.startsWith("0x") ? id.toLowerCase() : `0x${Number(id).toString(16)}`;
  return "";
}

function localArmyKey(wallet) {
  return `emoji-war-v5-army-${wallet?.toLowerCase()}`;
}

export default function App() {
  const [wallet, setWallet] = useState("");
  const [chainId, setChainId] = useState("");
  const [currentSeason, setCurrentSeason] = useState("1");
  const [selectedArmyId, setSelectedArmyId] = useState(0);
  const [armyMembers, setArmyMembers] = useState({});
  const [armyBurns, setArmyBurns] = useState({});
  const [tokenBalance, setTokenBalance] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [myBurn, setMyBurn] = useState("0");
  const [totalBurn, setTotalBurn] = useState("0");
  const [burnAmount, setBurnAmount] = useState("1000");
  const [status, setStatus] = useState("已加载 V5.1 优化版。");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const isBscTestnet = chainId?.toLowerCase() === BSC_TESTNET_CHAIN_ID;
  const selectedArmy = useMemo(() => armyById(selectedArmyId), [selectedArmyId]);
  const burnAmountWei = useMemo(() => {
    try { return parseUnits(burnAmount || "0", 18); } catch { return 0n; }
  }, [burnAmount]);
  const needsApprove = burnAmountWei > BigInt(allowance || "0");

  const rankedArmyBurns = useMemo(() => {
    return [...armies].sort((a, b) => Number(BigInt(armyBurns[b.id] || "0") - BigInt(armyBurns[a.id] || "0")));
  }, [armyBurns]);

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
          if (id === BSC_TESTNET_CHAIN_ID) await loadChainData(accounts[0]);
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
      if (wallet && normalized === BSC_TESTNET_CHAIN_ID) await loadChainData(wallet);
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

      if (id !== BSC_TESTNET_CHAIN_ID) {
        setStatus("钱包已连接，但当前不是 BSC Testnet。请点击切换测试网。");
        loadLocalArmyFallback(account);
      } else if (account) {
        await loadChainData(account);
        setStatus("钱包连接成功，链上数据已刷新。");
      }
    } catch (error) {
      setStatus(error?.message || "钱包连接失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function switchToBscTestnet() {
    const injected = getInjectedProvider();
    if (!injected) return;

    try {
      setIsLoading(true);
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_TESTNET_CHAIN_ID }]
      });
      setChainId(BSC_TESTNET_CHAIN_ID);
      setStatus("已切换到 BSC Testnet，请点击刷新链上数据。");
      if (wallet) await loadChainData(wallet);
    } catch (switchError) {
      if (switchError?.code === 4902) {
        await injected.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BSC_TESTNET_CHAIN_ID,
            chainName: BSC_TESTNET_NAME,
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
            blockExplorerUrls: ["https://testnet.bscscan.com/"]
          }]
        });
        setChainId(BSC_TESTNET_CHAIN_ID);
      } else {
        setStatus(switchError?.message || "切换网络失败。");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function getContract(address, abi, withSigner = false) {
    const injected = getInjectedProvider();
    if (!injected) throw new Error("没有检测到钱包插件。");
    const provider = new BrowserProvider(injected);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(address, abi, signer);
    }
    return new Contract(address, abi, provider);
  }

  async function loadChainData(account = wallet) {
    if (!account) return setStatus("请先连接钱包。");

    try {
      setIsLoading(true);
      const id = await getCurrentChainId();
      setChainId(id);
      if (id !== BSC_TESTNET_CHAIN_ID) {
        setStatus("当前不是 BSC Testnet，无法读取测试合约。");
        loadLocalArmyFallback(account);
        return;
      }

      const armyContract = await getContract(ARMY_CONTRACT_ADDRESS, ARMY_ABI);
      const tokenContract = await getContract(TEST_TOKEN_ADDRESS, TOKEN_ABI);
      const burnContract = await getContract(BURN_CONTRACT_ADDRESS, BURN_ABI);

      const seasonId = await armyContract.currentSeason();
      setCurrentSeason(seasonId.toString());

      const myArmy = await armyContract.getUserArmy(seasonId, account);
      const onChainArmy = Number(myArmy);
      const savedArmy = Number(localStorage.getItem(localArmyKey(account)) || "0");
      setSelectedArmyId(onChainArmy || savedArmy || 0);

      const [balance, approved, burned] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.allowance(account, BURN_CONTRACT_ADDRESS),
        burnContract.getUserBurn(seasonId, account)
      ]);
      setTokenBalance(balance.toString());
      setAllowance(approved.toString());
      setMyBurn(burned.toString());

      const memberData = {};
      const burnData = {};
      for (const army of armies) {
        const [members, burns] = await Promise.all([
          armyContract.getArmyMembers(seasonId, army.id),
          burnContract.getArmyBurn(seasonId, army.id)
        ]);
        memberData[army.id] = members.toString();
        burnData[army.id] = burns.toString();
      }
      setArmyMembers(memberData);
      setArmyBurns(burnData);

      const seasonBurn = await burnContract.getTotalBurn(seasonId);
      setTotalBurn(seasonBurn.toString());

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setStatus(error?.shortMessage || error?.message || "读取链上数据失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function joinArmyOnChain(armyId) {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isBscTestnet) {
      setStatus("请先切换到 BSC Testnet。");
      return;
    }

    const army = armyById(armyId);
    try {
      setIsLoading(true);
      const contract = await getContract(ARMY_CONTRACT_ADDRESS, ARMY_ABI, true);
      setStatus(`正在加入 ${army.emoji} ${army.cn}，请确认钱包交易。`);
      const tx = await contract.joinArmy(armyId);
      await tx.wait();
      localStorage.setItem(localArmyKey(wallet), String(armyId));
      setSelectedArmyId(armyId);
      setStatus(`链上加入成功：${army.emoji} ${army.cn}`);
      await loadChainData(wallet);
    } catch (error) {
      const msg = error?.reason || error?.shortMessage || error?.message || "交易失败。";
      setStatus(msg.includes("Already joined") ? "你本赛季已经加入过军团，不能重复选择。" : msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function approveBurnContract() {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!isBscTestnet) return setStatus("请先切换到 BSC Testnet。");
    if (burnAmountWei <= 0n) return setStatus("请输入大于 0 的燃烧数量。");

    try {
      setIsLoading(true);
      const token = await getContract(TEST_TOKEN_ADDRESS, TOKEN_ABI, true);
      setStatus("正在授权燃烧合约，请在钱包确认。");
      const tx = await token.approve(BURN_CONTRACT_ADDRESS, burnAmountWei);
      await tx.wait();
      setStatus(`授权成功：${burnAmount} tEMOJI`);
      await loadChainData(wallet);
    } catch (error) {
      setStatus(error?.shortMessage || error?.message || "授权失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function burnForArmy() {
    if (!wallet) return setStatus("请先连接钱包。");
    if (!selectedArmyId) return setStatus("请先链上选择军团。");
    if (!isBscTestnet) return setStatus("请先切换到 BSC Testnet。");
    if (needsApprove) return setStatus("授权额度不足，请先点击 Approve。");

    try {
      setIsLoading(true);
      const burn = await getContract(BURN_CONTRACT_ADDRESS, BURN_ABI, true);
      setStatus(`正在燃烧 ${burnAmount} tEMOJI，请在钱包确认。`);
      const tx = await burn.burnWholeForArmy(BigInt(burnAmount || "0"));
      await tx.wait();
      setStatus(`燃烧成功：${burnAmount} tEMOJI 已计入 ${selectedArmy?.emoji} ${selectedArmy?.cn}`);
      await loadChainData(wallet);
    } catch (error) {
      const msg = error?.reason || error?.shortMessage || error?.message || "燃烧失败。";
      setStatus(msg.includes("allowance") ? "授权额度不足，请先点击 Approve 授权。" : msg);
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
            <a href="#join">链上加入</a><a href="#burn">燃烧冲榜</a><a href="#panel">排行榜</a><a href="#rules">规则</a>
          </div>
          <button className="smallBtn" onClick={connectWallet}>{wallet ? shortAddress(wallet) : "Connect Wallet"}</button>
        </div>

        <div className="heroGrid">
          <div className="heroText">
            <p className="pill"><span></span>V5.1 Optimized · BSC Testnet</p>
            <h1>Emoji War</h1>
            <h2>链上燃烧冲榜战争</h2>
            <p className="lead">每个 Emoji 都是一个军团。每一次燃烧，都是一次情绪投票。燃烧越多，排名越高；排名越高，分红越多。</p>
            <div className="actions">
              <button className="primaryBtn buttonReset" onClick={connectWallet}>{wallet ? "Wallet Connected" : "Connect Wallet"}</button>
              <button className="secondaryBtn buttonReset" onClick={() => loadChainData(wallet)} disabled={!wallet || isLoading}>刷新链上数据</button>
            </div>
            <p className="note">当前为 BSC Testnet 测试网版本，使用 tEMOJI 测试币。最后刷新：{lastUpdated || "未刷新"}</p>
          </div>

          <div className="warCard">
            <div className="screenTitle"><span>ON-CHAIN WAR PANEL</span><b>Season {currentSeason}</b></div>
            <div className="armyGrid">
              {armies.map((army) => (
                <div className={`miniArmy ${selectedArmyId === army.id ? "activeMini" : ""}`} key={army.cn}>
                  <div>{army.emoji}</div><b>{army.cn}</b><span>{fmtToken(armyBurns[army.id] || "0")} burned</span>
                </div>
              ))}
            </div>
            <div className="flywheel">链上选择军团 → 授权测试币 → 燃烧冲榜</div>
          </div>
        </div>
      </section>

      <section id="join" className="section joinSection">
        <div className="sectionHead"><p>Step 1</p><h2>链上选择你的军团</h2><span>点击军团后，钱包确认交易，军团身份写入 BSC Testnet 测试合约。</span></div>
        <div className="walletPanel">
          <div className="walletStatus">
            <div className="statusTop"><span>Wallet Status</span><b>{wallet ? "Connected" : "Not Connected"}</b></div>
            <h3>{wallet ? shortAddress(wallet) : "Connect Wallet"}</h3>
            <p>Network: {isBscTestnet ? "BSC Testnet" : chainId ? `Wrong Network (${chainId})` : "Not connected"}</p>
            <p>Army: {selectedArmy ? `${selectedArmy.emoji} ${selectedArmy.cn}` : "Not selected on-chain"}</p>
            <p>Balance: {fmtToken(tokenBalance)} tEMOJI</p>
            <p>My Burn: {fmtToken(myBurn)} tEMOJI</p>
            {status && <div className="statusMessage">{status}</div>}
            <div className="walletActions">
              <button className="primaryBtn buttonReset" onClick={connectWallet} disabled={isLoading}>{isLoading ? "Processing..." : "Connect / Refresh"}</button>
              <button className="secondaryBtn buttonReset" onClick={switchToBscTestnet} disabled={isLoading}>Switch to BSC Testnet</button>
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
            <p className="chooseHint">每个钱包每个赛季只能选择一次军团。已选择后，本赛季按钮会锁定。</p>
          </div>
        </div>
      </section>

      <section id="burn" className="section burnSection">
        <div className="sectionHead"><p>Step 2</p><h2>燃烧 tEMOJI 冲榜</h2><span>先授权燃烧合约，再执行燃烧。燃烧后自动计入你的个人燃烧量和军团燃烧量。</span></div>
        <div className="burnPanel">
          <div className="burnBox">
            <h3>Burn to Fight</h3>
            <label>燃烧数量</label>
            <input value={burnAmount} onChange={(e) => setBurnAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="1000" />
            <div className="burnStats">
              <div><p>授权额度</p><b>{fmtToken(allowance)} tEMOJI</b></div>
              <div><p>全赛季总燃烧</p><b>{fmtToken(totalBurn)} tEMOJI</b></div>
            </div>
            <div className="walletActions">
              <button className="secondaryBtn buttonReset" onClick={approveBurnContract} disabled={isLoading || burnAmountWei <= 0n}>Approve</button>
              <button className="primaryBtn buttonReset" onClick={burnForArmy} disabled={isLoading || burnAmountWei <= 0n || needsApprove}>Burn</button>
            </div>
            <p className="chooseHint">{needsApprove ? "当前授权额度不足，请先点击 Approve。" : "授权额度足够，可以点击 Burn。"}</p>
          </div>

          <div className="burnBox">
            <h3>测试合约地址</h3>
            <p>Army: {ARMY_CONTRACT_ADDRESS}</p>
            <p>tEMOJI: {TEST_TOKEN_ADDRESS}</p>
            <p>Burn: {BURN_CONTRACT_ADDRESS}</p>
          </div>
        </div>
      </section>

      <section id="panel" className="section panelSection">
        <div className="sectionHead"><p>War Dashboard</p><h2>Season {currentSeason} 燃烧排行榜</h2><span>V5.1 已按燃烧量自动排序。军团成员数和燃烧数据均从 BSC Testnet 测试合约读取。</span></div>
        <div className="rankingGrid">
          <div className="rankingCard">
            <div className="rankingHead"><h3>军团燃烧榜</h3><span>Army Burn Ranking</span></div>
            {rankedArmyBurns.map((army, index) => (
              <div className="armyRow" key={army.cn}>
                <div className="rankBadge">{index + 1}</div>
                <div className="armyName"><span>{army.emoji}</span><div><b>{army.cn}</b><p>{army.en}</p></div></div>
                <div className="armyBurn"><b>{fmtToken(armyBurns[army.id] || "0")}</b><p>tEMOJI burned</p></div>
              </div>
            ))}
          </div>

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
        </div>
      </section>

      <section id="armies" className="section dark">
        <div className="sectionHead"><p>Five Armies</p><h2>五大 Emoji 军团</h2><span>选择你的情绪身份，燃烧 tEMOJI，冲击黑洞排行榜。</span></div>
        <div className="cards">
          {armies.map((army) => (
            <article className={`card ${selectedArmyId === army.id ? "selectedCard" : ""}`} key={army.cn}>
              <div className="bigEmoji">{army.emoji}</div><h3>{army.cn}</h3><p className="en">{army.en}</p><b>{army.slogan}</b>
              <span>{army.id === 5 ? "社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。" : "燃烧冲榜，争夺黑洞荣耀。"}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="rules" className="section dark">
        <div className="sectionHead"><p>Rules</p><h2>战争规则</h2><span>V5.1 优化了状态显示、链上刷新、榜单排序和测试网提示。</span></div>
        <div className="rulesList">
          <div><b>01</b><p>连接钱包并切换到 BSC Testnet。</p></div>
          <div><b>02</b><p>链上选择一个 Emoji 军团，每个赛季只能选择一次。</p></div>
          <div><b>03</b><p>授权燃烧合约使用 tEMOJI 测试币。</p></div>
          <div><b>04</b><p>点击 Burn，测试币进入 dead 地址，个人和军团燃烧量自动上链。</p></div>
          <div><b>05</b><p>正式版上线时，将测试合约替换为主网正式合约。</p></div>
        </div>
        <div className="quote"><h2>不是谁喊得响，谁赢。是谁烧得多，谁赢。</h2><p>情绪上链，黑洞开战。</p></div>
      </section>

      <footer>
        <div><b>Emoji War / $EMOJI</b><p>Community meme project. Not affiliated with Binance.</p><p>Token Contract: {links.contract}</p></div>
        <div className="footerLinks"><a href={links.twitter}>X / Twitter</a><a href={links.telegram}>Telegram</a><a href={links.flap}>Flap</a></div>
      </footer>
    </main>
  );
}
