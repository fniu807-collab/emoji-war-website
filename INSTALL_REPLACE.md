# Emoji War 官网完整替换包

## 使用方式

1. 先关闭本地开发服务：VS Code 终端里按 `Ctrl + C`，输入 `Y`。
2. 打开你的项目文件夹：

```text
C:\Users\Administrator\Desktop\emoji-war-website
```

3. 不要删除整个 `emoji-war-website` 文件夹。
4. 不要删除隐藏的 `.git` 文件夹。
5. 删除里面这些可见内容：

```text
docs
emoji-war-original-style-v7-ready
node_modules
public
src
index.html
package.json
package-lock.json
package.v7.example.json
README.md
src.zip
```

6. 把本压缩包解压后的所有内容复制进去。
7. 在 VS Code 终端运行：

```bash
npm install
npm.cmd run dev
```

8. 本地打开：

```text
http://localhost:5173/
```

9. 确认没问题后 GitHub Desktop 提交：

```text
Summary: restore official launch package
Commit to main
Push origin
```

## 开盘后需要替换的位置

在 `src/App.jsx` 顶部替换：

```js
const ARMY_CONTRACT_ADDRESS = "正式 Army 地址";
const TEST_TOKEN_ADDRESS = "正式 Emoji Token 地址";
const BURN_CONTRACT_ADDRESS = "正式 Burn 地址";
const EMOJI_WAR_VAULT_ADDRESS = "正式 Vault 地址";
const REWARD_POOL_ADDRESS = "正式 RewardPool 地址";

flap: "正式 Emoji 购买链接",
```
