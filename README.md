# Emoji War / $EMOJI 展示官网

这是 Emoji War 第一版 MVP 展示网站。

## 本地运行

1. 安装 Node.js
2. 在项目文件夹里运行：

```bash
npm install
npm run dev
```

然后打开终端显示的本地链接。

## 需要替换的内容

打开 `src/App.jsx`，找到：

```js
const links = {
  flap: "#",
  twitter: "#",
  telegram: "#",
  contract: "Coming soon"
};
```

发币后把 `#` 替换成真实链接。

## 部署

推荐使用 Vercel：

1. 把这个文件夹上传到 GitHub
2. 打开 Vercel
3. Import GitHub Project
4. 点击 Deploy
5. 得到网站链接

## 注意

币安军团为社区自发情绪阵营，非 Binance 官方项目，非 Binance 官方关联。
