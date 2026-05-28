// src/emojiWarV7/useEmojiWarV7.js
// React Hook 版。原官网 App.jsx 里可以直接调用这个 hook，不改变原视觉。

import { useCallback, useEffect, useState } from "react";
import {
  connectWallet,
  readV7Dashboard,
  approveBurn,
  joinArmy,
  burnToken,
  claimRealtime,
  claimSeasonBonus,
  claimAll,
} from "./emojiWarV7Client.js";

export function useEmojiWarV7() {
  const [address, setAddress] = useState("");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (addr = address) => {
    if (!addr) return null;
    const next = await readV7Dashboard(addr);
    setData(next);
    return next;
  }, [address]);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const res = await connectWallet();
      setAddress(res.address);
      const next = await readV7Dashboard(res.address);
      setData(next);
      setMessage("Wallet connected");
      return res.address;
    } catch (err) {
      setMessage(err?.shortMessage || err?.message || "Connect failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const run = useCallback(async (label, fn) => {
    setLoading(true);
    setMessage(`${label}...`);
    try {
      const result = await fn();
      setMessage(`${label} success`);
      await refresh();
      return result;
    } catch (err) {
      setMessage(err?.reason || err?.shortMessage || err?.message || `${label} failed`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (!address) return;
    const timer = setInterval(() => refresh(address).catch(() => {}), 15000);
    return () => clearInterval(timer);
  }, [address, refresh]);

  return {
    address,
    data,
    message,
    loading,
    connect,
    refresh,
    joinArmy: (armyId) => run("Select Army", () => joinArmy(armyId)),
    approveBurn: (amount) => run("Approve", () => approveBurn(amount)),
    burnToken: (amount) => run("Burn", () => burnToken(amount)),
    claimRealtime: () => run("Claim Realtime", () => claimRealtime()),
    claimSeasonBonus: (seasonId) => run("Claim Season Bonus", () => claimSeasonBonus(seasonId)),
    claimAll: (seasonIds, includeRealtime = true) => run("Claim All", () => claimAll(seasonIds, includeRealtime)),
  };
}
