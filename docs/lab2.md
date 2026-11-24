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

> **本章截屏**　无论是在虚拟机控制台还是宿主机的 SSH 客户端操作，都截取整块实验显示屏，从左上角第一个像素到右下角最后一个像素。保留终端提示符、命令与实际输出。[查看终端取图样式](screenshots.html#terminal)

## 1. 备份、清理并更换软件源

本节示例针对 Ubuntu 20.04 / 22.04 的传统 `/etc/apt/sources.list`。先用 `cat /etc/os-release`、`dpkg --print-architecture` 和 `ls /etc/apt/sources.list.d` 确认版本、架构和实际源文件。使用 deb822 格式（`ubuntu.sources`）时，段间空行有意义，应保留；请按所在发行版的镜像说明修改 `URIs:`，并在报告中解释差异。

1. 备份默认文件并截图。`-n` 保留第一次备份；请在修改前核对备份有内容。

   ```bash
   src=/etc/apt/sources.list
   sudo cp -n "$src" "$src.before-lab"
   ls -l "$src" "$src.before-lab"
   cat "$src.before-lab"
   ```

2. 在家目录执行 `nano clean-sources.sh`，粘贴下方正文，首行应是 `#!/usr/bin/env bash`。按 `Ctrl+O`、回车保存，再按 `Ctrl+X` 退出。先运行 `bash -n clean-sources.sh` 检查语法，正常时没有输出，然后执行 `bash clean-sources.sh`。它从原文件读入，在临时文件中去除整行注释和空行，确认至少存在一条二进制软件源后才写回。在报告中以文本贴出脚本，并截取执行后的列表。

   ```bash
   #!/usr/bin/env bash
   set -eu
   src=/etc/apt/sources.list
   tmp=$(mktemp)
   trap 'rm -f "$tmp"' EXIT
   sed -E '/^[[:space:]]*(#|$)/d' "$src" > "$tmp"
   grep -Eq '^deb[[:space:]]' "$tmp"
   sudo install -m 644 "$tmp" "$src"
   cat "$src"
   ```

3. 先截取清理后的旧源。在 x86 Ubuntu 上，可将官方主仓库替换为清华镜像，保留发行版代号、组件和官方安全更新源。以下命令适用于 `archive.ubuntu.com` 及其国家镜像；如原地址不同，请按原文件选择对应镜像。替换后再次截图，前后应能比较域名和发行版代号。

   ```bash
   sudo sed -Ei 's@https?://([a-z][a-z]\.)?archive\.ubuntu\.com/ubuntu@https://mirrors.tuna.tsinghua.edu.cn/ubuntu@g' /etc/apt/sources.list
   cat /etc/apt/sources.list
   ```

4. 执行 `sudo apt update` 更新索引，再执行 `sudo apt upgrade` 更新软件包；先阅读变更摘要，再确认。截图应能看到镜像访问结果以及升级结果。若已是最新版本，保留“0 upgraded”等真实输出。

**换源前后怎样取图。** 替换前先执行 `grep '^deb ' /etc/apt/sources.list` 并截全屏，替换后在同一终端重复该命令再截一张。图注写出实际变化的仓库域名、仍使用的版本代号。若清屏后看不到备份动作，可单独显示备份文件路径；若 `apt update` 报错，先读第一条错误，核对域名、网络和源中的发行版代号，再重新更新。

## 2. 启用中文命令帮助

```bash
sudo apt install language-pack-zh-hans locales man-db manpages-zh
sudo locale-gen zh_CN.UTF-8
locale -a | grep -i zh_cn
LC_ALL=zh_CN.UTF-8 LANGUAGE=zh_CN:zh man
```

最后一条故意不指定手册页，观察并截取中文提示。也可用 `LC_ALL=zh_CN.UTF-8 LANGUAGE=zh_CN:zh man ls` 查看中文手册，按 `q` 退出。安装英文系统不妨碍单独为一个命令选择中文环境。

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
| 软件源 | 备份和脚本清理的**命令文本及截图**、换源前后列表截图、更新软件截图 |
| 中文与 SSH | 终端中文帮助、SSH 服务端安装、禁止 root 远程登录和个人端口的配置截图 |
| 新账号 | 创建家目录、追加 sudo 组的命令文本及截图；新用户执行 `sudo su` 成功进入 root 的截图 |
| 远程访问 | SSH 客户端配置和连接成功两类画面，能辨认地址、端口和用户名 |

[清华 Ubuntu 镜像说明](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/) · [Ubuntu OpenSSH 文档](https://ubuntu.com/server/docs/how-to/security/openssh-server/)

[下一项实验 · 在 Linux 中部署博客网站](lab3.html)
