# Emoji War V5.1 优化版

基于 V5 的优化版，仍然是 BSC Testnet 测试网版本。

优化内容：

- 修复 Network 显示不稳定
- 修复 Army 显示不稳定
- 增加“刷新链上数据”按钮
- 军团燃烧榜按燃烧量自动排序
- 军团成员榜按成员数自动排序
- 增加本地军团缓存，避免钱包刷新后状态丢失
- 增强错误提示
- 明确显示这是测试网版本

已接入合约：

- Army Contract: 0x1579fe91f42caD600a9A3484F4eeA154D00eB0b3
- tEMOJI Test Token: 0xb25519Cf970aE1A12f5F3b288a560C03AEE4DF1D
- Burn Contract: 0xe1082C0D733907B76Ce8B4B995D1CA0dA8B7f795

## 更新方法

1. 解压本压缩包
2. 复制所有文件覆盖你的 `emoji-war-website`
3. GitHub Desktop：Summary 写 `optimize v5 display`
4. Commit to main
5. Push origin
6. 等 Vercel 自动更新
