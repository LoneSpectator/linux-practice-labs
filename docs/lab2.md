---
key: lab2
kicker: 实验 02 / 05 · 系统管理
title: Linux 基本操作
intro: 本次请打通一条完整的管理路径：在虚拟机内准备软件源和 SSH 服务，再从宿主机以新账号登录并验证 sudo 权限。
command: whoami
output: zs123
---
## 实验任务

进入实验一安装的虚拟机。示例以首字母 `zs`、学号后三位 `123` 为例。先把本人的三位后缀写在草稿中。若后三位是 `007`，对应账号为 `zs007`，SSH 端口为 `22007`。

> **本章截屏**　请在宿主机截取整个屏幕。用红框标出镜像地址、中文提示或 SSH 登录结果，保留窗口周围的桌面和任务栏。[查看终端取图样式](screenshots.html#terminal)

<h2 id="apt">1. 更换 Ubuntu 软件源</h2>

### 换源前：用 cat 查看并备份

先运行 `cat /etc/os-release`，记下 `VERSION_CODENAME` 后的版本代号。下面两组命令只执行与你的系统对应的一组。第一行显示原配置，第二行把它备份到家目录。保留“换源前”的全屏图。

**传统格式**（常见于 Ubuntu 22.04 及更早版本），每条源以 `deb` 开头。

```bash
cat /etc/apt/sources.list
cp -nv /etc/apt/sources.list ~/sources.list.bak
```

**deb822 格式**（Ubuntu 24.04 起默认使用），文件中有 `Types:` 和 `URIs:`。旧版文件 `sources.list` 若只提示“配置已移至 ubuntu.sources”，请用下面的文件备份。

```bash
cat /etc/apt/sources.list.d/ubuntu.sources
cp -nv /etc/apt/sources.list.d/ubuntu.sources ~/ubuntu.sources.bak
```

### 选择一种方法换源

**Ubuntu Desktop 图形界面**

1. 按 `Super` 键（通常是 Windows 徽标键），搜索并打开 **Software & Updates（软件和更新）**。进入 **Ubuntu Software（Ubuntu 软件）** 标签页。
2. 点 **Download from（下载自）→ Other…（其他站点）**，展开 **China（中国）**，选中 `mirrors.tuna.tsinghua.edu.cn`，点 **Choose Server（选择服务器）**。
3. 点 **Close（关闭）**，出现提示时点 **Reload（重新载入）**。等刷新完成后回到刚才的终端。若列表里找不到清华站点，可使用下方的终端方法。

**终端方法（Server 或 Desktop）**

1. 打开清华帮助页，选择本机的 Ubuntu 版本和文件格式，复制页面生成的完整配置。ARM 版虚拟机（如 Apple 芯片 Mac 上的 ARM 版 Ubuntu）使用 Ubuntu Ports 页面。[清华 Ubuntu 镜像帮助](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/) · [清华 Ubuntu Ports 帮助](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu-ports/)
2. 打开刚才查看的文件。传统格式用 `sudo nano /etc/apt/sources.list`，deb822 格式用 `sudo nano /etc/apt/sources.list.d/ubuntu.sources`。在文件开头按 `Ctrl+K` 逐行清除原内容，粘贴新的配置。按 `Ctrl+O`、回车保存，再按 `Ctrl+X` 退出。

### 换源后：用 cat 查看并验证

再次执行换源前的那条命令（`cat /etc/apt/sources.list` 或 `cat /etc/apt/sources.list.d/ubuntu.sources`），截取“换源后”的全屏图。在前后两张图上分别用红框标出原地址和清华地址，核对版本代号相同。然后运行 `sudo apt update`，看到清华镜像的索引成功读取后，再运行 `sudo apt upgrade` 更新软件包。若提示已是最新版本，报告中保留实际输出即可。

### 两种格式的清华源示例（x86 虚拟机）

**传统格式 · Ubuntu 22.04（`jammy`）**　每行表示一个软件源。

```text
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-backports main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ jammy-security main restricted universe multiverse
```

**deb822 格式 · Ubuntu 24.04（`noble`）**　地址写在 `URIs:` 后面。两段之间留一个空行，第二段沿用 Ubuntu 官方安全更新地址。

```text
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu/
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: http://security.ubuntu.com/ubuntu/
Suites: noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

### 报告中的 Shell 练习：清理原配置

用刚才备份的原配置完成这项练习。执行 `nano ~/clean-sources.sh`，按本机格式**只写对应的一行**。

传统格式删除注释行和空行。

```bash
sed '/^[[:space:]]*#/d; /^[[:space:]]*$/d' ~/sources.list.bak
```

deb822 删除注释行，合并多余空行，保留软件源之间的分段。

```bash
sed '/^[[:space:]]*#/d; s/^[[:space:]]*$//' ~/ubuntu.sources.bak | cat -s
```

保存后运行下面两行。将脚本正文写进报告，截取清理结果。

```bash
bash ~/clean-sources.sh > ~/sources-cleaned.txt
cat ~/sources-cleaned.txt
```


<h2 id="chinese">2. 切换中文并验证命令帮助</h2>

在实验一用英语安装的系统中，选择下面一种方法启用简体中文。完成后都用终端里的 `man` 验证。

### Ubuntu Desktop 图形界面

1. 按 `Super` 键，搜索 **Region & Language（区域与语言）**。也可以从 **Settings（设置）→ System（系统）→ Region & Language** 进入。较早版本的“区域与语言”直接列在设置侧栏。
2. 打开 **Manage Installed Languages（管理已安装的语言）→ Install / Remove Languages（安装或删除语言）**，勾选 **Chinese (simplified)（简体中文）**，点 **Apply Changes（应用更改）**，等语言包安装完成。也可以在应用菜单中搜索 **Language Support（语言支持）** 进入这个窗口。
3. 回到“区域与语言”，在当前用户的 **Language（语言）** 中选 **中文（中国）** 并确认。如果本机显示的是“语言支持”窗口，把“汉语（中国）”拖到界面语言列表的第一位。注销并重新登录，打开“设置”查看中文菜单。
4. 打开终端，执行下方的 `man`，截取中文提示。如果桌面已变成中文而 `man` 仍显示英文，按下面的命令安装中文手册和语言包后再验证。[Ubuntu 安装语言帮助](https://help.ubuntu.com/stable/ubuntu-help/prefs-language-install.html) · [Ubuntu 切换显示语言帮助](https://help.ubuntu.com/stable/ubuntu-help/session-language.html.en)

### 终端方法（Server 或 Desktop）

安装中文支持并生成简体中文环境。最后一行让本次终端会话使用中文，立即生效。

```bash
sudo apt install language-pack-zh-hans locales man-db manpages-zh
sudo locale-gen zh_CN.UTF-8
export LANG=zh_CN.UTF-8 LANGUAGE=zh_CN:zh LC_MESSAGES=zh_CN.UTF-8
```

希望重新登录后仍使用中文时，再执行 `sudo update-locale LANG=zh_CN.UTF-8 LANGUAGE=zh_CN:zh`，然后注销并重新登录。

### 两种方法都这样验收

```bash
man
```

这里有意只输入 `man`，让终端显示“您需要什么手册页？”或本机版本的同类中文提示。在宿主机截全屏，用红框标出命令及中文回答。如果 Server 的纯文本控制台显示方框，完成本章的 SSH 登录后在宿主机终端查看中文。想读一页手册时，可以再输入 `man ls`，按 `q` 退出。

## 3. 安装并配置 SSH 服务

1. 在虚拟机控制台执行 `sudo apt install openssh-server`，保留安装截图。执行 `sudo systemctl enable --now ssh` 检查服务能启动。下面以 Ubuntu 22.04 的 `ssh.service` 为例。
2. 在虚拟机控制台先执行 `sudo cp -n /etc/ssh/sshd_config /etc/ssh/sshd_config.before-lab` 备份初始配置，再执行 `sudoedit /etc/ssh/sshd_config`。习惯用 nano 的同学也可用 `sudo nano /etc/ssh/sshd_config` 打开同一文件。将下列示例放在全局区域、首个 `Match` 之前，替换已有冲突项。**端口是字符串拼接**：固定前缀 `22` 后接学号后三位，`123` 对应 `22123`。保留虚拟机控制台以便排错。

   ```text
   Port 22123
   PermitRootLogin no
   ```

3. 验证语法和实际生效值，再重启监听。核对端口和 `permitrootlogin no` 并截图。如果结果不同，检查 `Include` 引入的 `sshd_config.d/*.conf` 以及重复的 `Port`。若虚拟机已启用 UFW，请先为宿主机到该端口的 TCP 连接放行。

   ```bash
   sudo sshd -t && sudo systemctl restart ssh
   sudo sshd -T | grep -E '^(port|permitrootlogin) '
   sudo ss -lntp | grep sshd
   ip -br -4 addr
   ```

**保存并验证。** `sshd -t` 若报告行号，先返回该行修正。成功后让终端显示 `sshd -T` 的端口和 root 登录策略，再显示 `ss` 中的监听端口。这张全屏图可以核对“配置值”和“实际监听值”是否一致。

## 4. 创建用户，从宿主机登录

在虚拟机内创建 **首字母 + 学号后三位** 的账号，实验用密码按报告模板填写 **本人姓名首字母**。`adduser` 会创建家目录并提示交互设置密码；以下 `zs123` 全部替换为本人账号。

```bash
sudo adduser zs123
sudo usermod -aG sudo zs123
id zs123
getent passwd zs123
ls -ld /home/zs123
```

在宿主机的 Xshell 新建会话，协议选择 SSH，填写虚拟机可达的 IPv4 地址、新端口和新用户名，截图保存会话配置。用终端客户端时，下行用实际 IP 替换示例地址，并保留显示参数的画面。

```bash
ssh -p 22123 zs123@192.168.56.101
```

**连接画面按操作顺序保留。** 在 Xshell 选“文件 → 新建”，在“连接”页填主机、协议、端口，先截宿主机全屏；在“用户身份验证”页选用新账号。使用 OpenSSH 客户端时，截取含完整 `ssh -p … 用户@地址` 的宿主机画面。连接成功后再截登录结果。执行 `sudo su` 后先运行 `whoami`，在出现 `root` 而尚未 `exit` 时截图，这样同一屏可以核对提权前后的身份。

首次连接时，可在虚拟机运行 `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` 核对客户端提示的 ED25519 指纹。成功登录后，在**新账号的远程会话**内逐行执行并截图。

```bash
whoami
pwd
sudo su
whoami
exit
```

预期先看到普通用户名和家目录，第二次 `whoami` 输出 `root`。若超时，先检查宿主机到虚拟机的网络路径；VirtualBox 默认 NAT 通常需要增配仅主机网卡，或将宿主机回环端口转发到来宾的新 SSH 端口。若提示拒绝连接，先检查实际监听端口。

## 报告验收

| 环节 | 最少保留内容 |
| --- | --- |
| 软件源 | 备份和脚本清理的命令文本及截图、两次 `cat` 的全屏图、软件更新结果 |
| 中文与 SSH | 桌面或终端启用中文后 `man` 的中文提示、SSH 服务端安装、禁止 root 远程登录和个人端口的配置截图 |
| 新账号 | 创建家目录、追加 sudo 组的命令文本及截图；新用户执行 `sudo su` 成功进入 root 的截图 |
| 远程访问 | SSH 客户端配置和连接成功两类画面，能辨认地址、端口和用户名 |

[清华 Ubuntu 镜像说明](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/) · [Ubuntu OpenSSH 文档](https://ubuntu.com/server/docs/how-to/security/openssh-server/)

[下一项实验 · 在 Linux 中部署博客网站](lab3.html)
