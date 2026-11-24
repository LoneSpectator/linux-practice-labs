---
key: lab2
kicker: 实验 02 / 05 · 系统管理
title: Linux 基本操作
intro: 本次请打通一条完整的管理路径：在虚拟机内准备软件源和 SSH 服务，再从宿主机以新账号登录并验证 sudo 权限。
command: whoami
output: zs123
---
## 实验任务

进入实验一安装的 Ubuntu 24.04 LTS 或 26.04 LTS 虚拟机。示例以首字母 `zs`、学号后三位 `123` 为例。先把本人的三位后缀写在草稿中。若后三位是 `007`，对应账号为 `zs007`，SSH 端口为 `22007`。

> **本章截屏**　请在宿主机截取整个屏幕。用红框标出镜像地址、中文提示或 SSH 登录结果，保留窗口周围的桌面和任务栏。[查看终端取图样式](screenshots.html#terminal)

<h2 id="apt">1. 更换 Ubuntu 软件源</h2>

### 换源前：显示并备份原文件

Ubuntu 24.04 LTS 和 26.04 LTS 默认使用 deb822 格式。以下操作都在虚拟机内完成。先运行 `cat /etc/os-release`，记下 `VERSION_CODENAME`（24.04 为 `noble`，26.04 为 `resolute`）。使用 22.04 等旧镜像且软件源写在 `/etc/apt/sources.list` 的同学，直接看本节末尾的[传统格式步骤](#apt-legacy)。

```bash
cat /etc/apt/sources.list.d/ubuntu.sources
cp -nv /etc/apt/sources.list.d/ubuntu.sources ~/ubuntu.sources.bak
```

截取显示原地址与备份命令的全屏图。报告中以文字写出备份命令；文件较长时可分屏记录。

### 更换为清华源

**Ubuntu Server**：打开清华镜像帮助页，在 **DEB822 格式** 下选择刚才查到的 Ubuntu 版本，复制完整配置。ARM 版 Ubuntu 使用 Ubuntu Ports 镜像。[清华 Ubuntu 帮助](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/) · [Ubuntu Ports 帮助](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu-ports/)

1. 执行 `sudo nano /etc/apt/sources.list.d/ubuntu.sources`。将光标移到文件开头，按 `Ctrl+K` 逐行清除原内容，粘贴刚复制的配置。
2. 保留两个配置段之间的空行，核对 `Suites:` 里的版本代号。按 `Ctrl+O`、回车保存，然后按 `Ctrl+X` 退出。

**Ubuntu Desktop**：在桌面按 `Super` 键，搜索 **Software & Updates（软件和更新）**。26.04 默认未预装此工具，若搜不到，先在终端运行 `sudo apt install software-properties-gtk`，然后再打开。[Ubuntu 26.04 桌面说明](https://documentation.ubuntu.com/release-notes/26.04/summary-for-lts-users/#software-updates-app)

1. 在 **Ubuntu Software（Ubuntu 软件）** 页点 **Download from（下载自）→ Other…（其他站点）**，展开 **China（中国）**，选中 `mirrors.tuna.tsinghua.edu.cn`，点 **Choose Server（选择服务器）**。
2. 点 **Close（关闭）**，按提示点 **Reload（重新载入）**，等刷新完成。镜像列表中没有清华站点时，按上面 Server 的 `nano` 步骤填写清华地址。

### 换源后：查看新文件并更新软件

再次运行 `cat /etc/apt/sources.list.d/ubuntu.sources`，截取“换源后”的全屏图。在前后两张图上用红框分别标出原地址和清华地址。运行 `sudo apt update` 更新软件包索引，成功后执行 `sudo apt upgrade`，截取软件更新结果。如果已经是最新版本，保留实际输出。

**deb822 文件示例**　下面是 Ubuntu 24.04（`noble`）的 x86 配置。26.04 使用 `resolute`，清华帮助页会根据所选版本生成对应的 `Suites:` 行。

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

<h3 id="apt-legacy">旧镜像使用传统 sources.list 时</h3>

1. 用 `cat /etc/apt/sources.list` 显示原文件，执行 `cp -nv /etc/apt/sources.list ~/sources.list.bak` 备份，截取全屏。
2. Server 用 `sudo nano /etc/apt/sources.list` 粘贴清华帮助页为本机版本生成的**传统格式**配置，保存退出。Desktop 使用上面的“软件和更新”步骤。
3. 再用 `cat /etc/apt/sources.list` 显示文件并截屏，然后依次执行 `sudo apt update`、`sudo apt upgrade`，记录更新结果。

以下是 Ubuntu 22.04（`jammy`）的 x86 示例，每行表示一个软件源。

```text
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-backports main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ jammy-security main restricted universe multiverse
```

<h2 id="chinese">2. 切换中文并验证命令帮助</h2>

在实验一用英语安装的系统中，Desktop 使用桌面设置启用简体中文，Server 按本节的终端步骤操作。完成后都用终端里的 `man` 验证。

### Ubuntu Desktop 图形界面

1. 按 `Super` 键，搜索并打开 **Region & Language（区域与语言）**。
2. 打开 **Manage Installed Languages（管理已安装的语言）→ Install / Remove Languages（安装或删除语言）**，勾选 **Chinese (simplified)（简体中文）**，点 **Apply Changes（应用更改）**，等语言包安装完成。
3. 回到“区域与语言”，在当前用户的 **Language（语言）** 中选 **中文（中国）** 并确认。如果本机显示的是“语言支持”窗口，把“汉语（中国）”拖到界面语言列表的第一位。注销并重新登录，打开“设置”查看中文菜单。
4. 打开终端，执行下方的 `man`，截取中文提示。如果桌面已变成中文而 `man` 仍显示英文，按下面的命令安装中文手册和语言包后再验证。[Ubuntu 安装语言帮助](https://help.ubuntu.com/stable/ubuntu-help/prefs-language-install.html) · [Ubuntu 切换显示语言帮助](https://help.ubuntu.com/stable/ubuntu-help/session-language.html.en)

### Ubuntu Server 终端

依次安装语言包和中文手册、生成简体中文环境，再让本次终端会话使用中文。

```bash
sudo apt install language-pack-zh-hans locales man-db manpages-zh
sudo locale-gen zh_CN.UTF-8
export LANG=zh_CN.UTF-8 LANGUAGE=zh_CN:zh LC_MESSAGES=zh_CN.UTF-8
```

执行 `sudo update-locale LANG=zh_CN.UTF-8 LANGUAGE=zh_CN:zh`，让下次登录也使用中文。

### 两种方法都这样验收

```bash
man
```

这里有意只输入 `man`，让终端显示“您需要什么手册页？”或本机版本的同类中文提示。在宿主机截全屏，用红框标出命令及中文回答。如果 Server 的纯文本控制台显示方框，完成本章的 SSH 登录后在宿主机终端查看中文。想读一页手册时，可以再输入 `man ls`，按 `q` 退出。

<a id="3-安装并配置-ssh-服务"></a>
<h2 id="ssh-port">3. 安装 SSH 服务并更改监听端口</h2>

**在虚拟机控制台完成本节，等查到新端口确实在监听，再从宿主机连接。** 下例学号后三位为 `123`，端口为 `22123`。将配置、查询命令和 SSH 客户端里的端口都换成自己的。后三位为 `007` 时，端口是 `22007`。

1. **安装并编辑配置。** 运行 `sudo apt install openssh-server`，保留安装截图。备份后用 `nano` 打开配置文件。

   ```bash
   sudo cp -n /etc/ssh/sshd_config /etc/ssh/sshd_config.before-lab
   sudo nano /etc/ssh/sshd_config
   ```

   在第一个 `Match` 之前的全局区域设置以下两项。已有相同配置项时，修改原行，去掉行首的 `#`。按 `Ctrl+O`、回车保存，按 `Ctrl+X` 退出。如果虚拟机启用了 UFW，先允许宿主机访问自己的新 TCP 端口。

   ```text
   Port 22123
   PermitRootLogin no
   ```

2. **按本机的监听方式应用配置。** 在控制台运行 `systemctl is-active ssh.socket`，按输出执行对应的一行。

   | 查询结果 | 在虚拟机控制台执行 |
   | --- | --- |
   | `active`（Ubuntu 24.04 默认使用 socket 监听，26.04 同样先查状态） | `sudo sshd -t && sudo systemctl daemon-reload && sudo systemctl restart ssh.socket` |
   | `inactive` 或未找到该单元，且使用传统服务模式（如 Ubuntu 22.04） | `sudo sshd -t && sudo systemctl restart ssh.service` |

   `sshd -t` 检查配置语法；出现错误时，根据提示用 `nano` 修正对应行，再执行本行命令。socket 模式下，`daemon-reload` 会让 systemd 重新读取端口设置，只重启 `ssh.service` 可能仍由原来的 22 端口监听。[Ubuntu 24.04 OpenSSH 说明](https://documentation.ubuntu.com/release-notes/24.04/#openssh)

3. **按端口核验实际监听。** 把第二行的 `22123` 改成自己的端口，然后执行以下命令。

   ```bash
   sudo sshd -T | grep -E '^(port|permitrootlogin) '
   sudo ss -lntp 'sport = :22123'
   ip -br -4 addr
   ```

   第一行应显示自己的端口和 `permitrootlogin no`。第二行的 **LISTEN** 记录中，`Local Address:Port` 应以自己的端口结尾。监听者可能显示为 `systemd`，所以直接按端口查询。若只有表头，即使 `sshd -T` 已显示新端口，也要回到第 2 步核对监听方式和重启结果。若配置值本身有误，检查 `/etc/ssh/sshd_config.d/` 内的配置及重复的 `Port` 行。

   截全屏并用红框标出实际监听的端口。记下第三行显示的、宿主机可达的虚拟机 IPv4 地址，下一步用新账号从宿主机登录。

## 4. 创建用户，从宿主机登录

在虚拟机内创建 **首字母 + 学号后三位** 的账号，实验用密码按报告模板填写 **本人姓名首字母**。`adduser` 会创建家目录并提示交互设置密码；以下 `zs123` 全部替换为本人账号。

```bash
sudo adduser zs123
sudo usermod -aG sudo zs123
id zs123
getent passwd zs123
ls -ld /home/zs123
```

**在宿主机用新端口登录。** Windows 宿主机打开 Xshell，点“文件 → 新建”。协议选 SSH，主机填上一步查到的虚拟机 IPv4 地址，端口填自己的新端口，在“用户身份验证”中填新账号。先截会话配置，再点“连接”并截登录成功的全屏图。

macOS 或 Linux 宿主机在终端执行下行。将端口、账号和 IP 换成自己的，保留连接命令和成功登录的画面。

```bash
ssh -p 22123 zs123@192.168.56.101
```

首次连接时，在虚拟机运行 `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` 核对客户端提示的 ED25519 指纹。成功登录后，在**新账号的远程会话**内逐行执行并截图。

```bash
whoami
pwd
sudo su
whoami
exit
```

预期先看到普通用户名和家目录，第二次 `whoami` 输出 `root`。若超时，先检查宿主机到虚拟机的网络路径；VirtualBox 默认 NAT 通常需要增配仅主机网卡，或将宿主机回环端口转发到来宾的新 SSH 端口。若提示拒绝连接，先在虚拟机用 `ss` 核对实际监听端口。

## 报告验收

| 环节 | 最少保留内容 |
| --- | --- |
| 软件源 | 备份原文件的命令文本及截图、两次 `cat` 的全屏图、软件更新结果 |
| 中文与 SSH | 桌面或终端启用中文后 `man` 的中文提示、SSH 服务端安装、禁止 root 远程登录的配置及个人端口的 LISTEN 记录 |
| 新账号 | 创建家目录、追加 sudo 组的命令文本及截图；新用户执行 `sudo su` 成功进入 root 的截图 |
| 远程访问 | SSH 客户端配置和连接成功两类画面，能辨认地址、端口和用户名 |

[清华 Ubuntu 镜像说明](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/) · [Ubuntu OpenSSH 文档](https://ubuntu.com/server/docs/how-to/security/openssh-server/)

[下一项实验 · 在 Linux 中部署博客网站](lab3.html)
