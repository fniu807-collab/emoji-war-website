# 替换步骤

## 1. 先备份

把原来的：

```text
C:\Users\Administrator\Desktop\emoji-war-website
```

复制一份，改名：

```text
emoji-war-website-backup
```

## 2. 解压本包

解压 `emoji-war-v7-full-replace-project.zip`。

## 3. 复制覆盖

把解压出来的这些文件：

```text
index.html
package.json
README.md
src
docs
```

全部复制到：

```text
C:\Users\Administrator\Desktop\emoji-war-website
```

选择：

```text
替换目标中的文件
```

## 4. 运行

在 VS Code 终端：

```bash
cd C:\Users\Administrator\Desktop\emoji-war-website
npm install
npm run dev
```

打开：

```text
http://localhost:5173/
```
