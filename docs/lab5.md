---
key: lab5
kicker: 实验 05 / 05 · 自动化
title: 使用 Shell 脚本部署 LNMP 环境
intro: 把实验三的手工部署整理成脚本。在一台干净的虚拟机上运行后，应能访问 PHP 页面、登录 phpMyAdmin 并管理 wp 数据库。
command: sudo nginx -t
output: "… configuration file /etc/nginx/nginx.conf test is successful"
---
## 实验任务

这次验收 Linux、Nginx、MySQL、PHP 和 phpMyAdmin；做到 `wp` 用户、数据库及授权即可，本章无须安装 WordPress。使用实验一或二的干净快照副本，保留实验三的原站点供实验四备份。账号和目录规则沿用实验三。

脚本可以拆分，也可以载入预先写好的 Nginx 配置、归档包和 SQL 模板。报告中须以文本给出**所有脚本命令**，为关键语句写出注释或在报告中逐段解释。请让脚本自己完成系统配置，操作者只负责输入参数、运行和浏览器验收。

> **本章截屏**　从宿主机截取整块实验显示屏，范围从左上角第一个像素到右下角最后一个像素。保留脚本调用与对应阶段日志，数据库截图只显示可公开的对象名和结果。[查看终端与网页图例](screenshots.html)

## 1. 组织输入和执行顺序

可以把脚本和所需配置放在同一文件夹。下面是一种拆分方式，文件名可以自行决定。

| 文件 | 职责 | 运行完成的标志 |
| --- | --- | --- |
| `deploy.sh` | 校验首字母和三位后缀，计算路径，依次调用各阶段 | 任一阶段失败即停止，并打印失败阶段 |
| `install-stack.sh` | 更新索引，安装和启动三个服务及 PHP 扩展 | Nginx、MySQL、对应版本的 PHP-FPM 均为 active |
| `configure-site.sh` | 备份、创建站点目录、渲染 Nginx 配置并测试 PHP | 配置测试通过，浏览器显示 phpinfo 页面 |
| `configure-pma.sh` 和 SQL 资源 | 解压 phpMyAdmin，写 cookie 配置，创建数据库账号、库与授权 | 本地网页登录成功，`wp` 账号可进入 `wp` 库 |

在普通用户的 Bash 中启动主脚本，只对需要管理员权限的命令调用 `sudo`，这样 `id -un` 和 `id -gn` 能取到正确属主。下列是**主脚本骨架**；请实现表中各阶段脚本，再运行它。

```bash
#!/usr/bin/env bash
set -euo pipefail
base=$(cd -- "$(dirname -- "$0")" && pwd)
read -r -p '姓名首字母：' initials
read -r -p '学号后三位：' suffix
[[ "$initials" =~ ^[a-z]+$ && "$suffix" =~ ^[0-9]{3}$ ]] || {
    echo '请检查首字母或三位数字' >&2
    exit 1
}
sudo -v
for stage in install-stack configure-site configure-pma; do
    printf '\n开始：%s\n' "$stage"
    bash "$base/$stage.sh" "$initials" "$suffix" || {
        printf '失败：%s\n' "$stage" >&2
        exit 1
    }
    printf '完成：%s\n' "$stage"
done
```

各阶段通过 `$1` 和 `$2` 接收首字母、后缀，在各自脚本开头设置 `set -euo pipefail`。路径可由 `webroot="/$1/www"` 和 `pma="$webroot/pma$2"` 得到。下载失败、配置语法错误和 SQL 执行失败都应返回非零状态。

**先把四个文件放对位置。** 在实验副本中执行 `mkdir -p ~/linux-labs/lab5`、`cd ~/linux-labs/lab5`。用 `pwd` 确认当前位置后创建主脚本和三个阶段脚本。若有 Nginx 或 SQL 模板，也一并放入此目录并通过脚本所在路径引用。写好后分别检查语法：

```bash
for script in deploy.sh install-stack.sh configure-site.sh configure-pma.sh; do
    bash -n "$script" || break
    printf '语法检查通过：%s\n' "$script"
done
```

应看到四个脚本各自的通过提示。下一步先在副本中单独调试阶段脚本，最后再从干净副本执行完整部署，以便判断错误发生在哪一段。

## 2. 自动安装并配置 Nginx、PHP 和 MySQL

1. 将实验三经验证的安装命令移入安装阶段；脚本里用 `apt-get update` 和 `apt-get install -y`。打印包名与服务状态，确认 PHP-FPM 的 socket 在实际文件系统中存在。
2. 在配置阶段，用 `cp -n` 保护初始默认站点备份，`mkdir -p` 创建 `/首字母/www`，按当前普通用户和组设置属主，输出 `ls -ld`。首次运行顺序应是先备份、再替换、最后重载。
3. 把实验三的 server 块存为模板。对根目录和 FPM socket 使用清楚的占位符（如 `__WEBROOT__` 和 `__FPM_SOCKET__`）；只替换这两个值。Nginx 自己要读取的 `$uri` 应原样保留。输出实际写入的站点配置以及备份的位置，便于截图。
4. 运行 `sudo nginx -t`。仅在成功后重载，并写入 `info.php`。终端用 `curl -fsS http://127.0.0.1/info.php -o /tmp/lab5-phpinfo.html`，再用 `grep -m1 'PHP Version' /tmp/lab5-phpinfo.html` 核验返回内容。宿主机打开同一页面并截取 PHP 版本。

**分阶段调试。** 在上述工作目录运行 `bash install-stack.sh zs 123`（换成本人参数）。服务启动后查看 `systemctl is-active nginx mysql` 和 `systemctl list-units --type=service 'php*-fpm.service'`。随后运行 `bash configure-site.sh zs 123`。把 `ls -ld /zs/www`、配置备份路径、个人根目录与 `fastcgi_pass` 的值作为脚本日志输出。**安装结束和站点配置结束时分别取全屏图**，使每张都能对上相应阶段。宿主机浏览器验证 `info.php` 时，保留地址、PHP 版本及 Server API。

## 3. 自动配置 phpMyAdmin 和数据库

1. 参考[实验三](lab3.html)选用匹配的发布包，在脚本内下载或从指定本地资源读取，并检查解压成功后存在 `index.php`。为 `pma后三位` 设置 `www-data` 属主，输出路径与权限。
2. 复制 `config.sample.inc.php` 到 `config.inc.php`，以 cookie 认证和 `localhost` 配置数据库连接。可以用 PHP 辅助脚本生成 32 字节随机密钥并写入配置；第二次运行保留已有密钥。日志应说明“密钥已写入”并执行 `php -l` 检查配置，避免把实际值写入日志。按实验三的做法附上原模板要求的两份姓名全拼演示和版本说明。
3. 由 Shell 调用本地 MySQL 完成 `lab_pma@localhost`、`wp@localhost`、`wp` 数据库及其授权。参考实验三的 SQL，重复执行时使用 `CREATE DATABASE IF NOT EXISTS` 和 `CREATE USER IF NOT EXISTS`；后者会保留已有密码。保管首次设置的独立口令，日志只打印用户名、数据库名和权限范围。SQL 文件若含真实口令，请另存去除口令的模板随报告提交。
4. 为取得模板要求的**网页登录后建库截图**，在独立快照的首次部署中可安排两次验收：先让脚本完成管理员授权，在 phpMyAdmin 的 SQL 页面用该管理员创建 `wp` 并截图；随后运行脚本的建库与授权阶段，用 `IF NOT EXISTS` 兼容已存在的库。再从干净快照连贯运行全部阶段，证明无人手工建库也能成功。你也可以在脚本全部运行后，在 phpMyAdmin 中执行 `CREATE DATABASE IF NOT EXISTS wp` 并截图，同时说明数据库已由脚本创建，页面显示已存在。
5. 在浏览器中用 `wp` 登录并选择 `wp` 数据库，或用命令行 `mysql -u wp -p wp` 验证。保留管理账号登录后的建库结果与实际账户权限。记录后移除 `info.php`。

**怎样记录数据库阶段。** 调试时运行 `bash configure-pma.sh zs 123`。在安装日志中找出目标目录、属主、配置文件语法检查结果和 SQL 执行结果。清除可见的含密钥输出后再截全屏。接着从宿主机访问 `http://虚拟机IP/pma123/`，在 SQL 页显示建库结果；地址、当前数据库名称和结果提示应可辨认。截图下分别写明首次创建还是重复执行时已存在。

## 4. 验证能否复现

在干净副本中运行一次 `bash deploy.sh`。依次确认：备份存在、根目录和属主正确、Nginx 已加载该配置、PHP 可执行、phpMyAdmin 可登录、`wp` 可访问自己的库。原环境已经运行的服务可能掩盖脚本遗漏，首次部署请从快照复测。随后在同一副本再运行一次，观察配置、密钥和数据库能否继续使用。

**留下完整运行记录。** 在干净副本中，从部署目录打开 Bash，先确认脚本日志只输出阶段名、文件路径和验证结果，再运行：

```bash
set -o pipefail
bash deploy.sh 2>&1 | tee deploy-first.log
deploy_status=$?
printf '部署退出状态：%s\n' "$deploy_status"
```

`tee` 会同步显示并保存输出，`pipefail` 让部署失败时仍能取得失败状态。核对日志从“开始：install-stack”走到“完成：configure-pma”，退出状态为 `0` 时再做网页验收。若只显示了部分阶段，就从第一条错误开始修正。第二次运行时把文件名换成 `deploy-repeat.log`，避免覆盖首次记录。在报告中放相应全屏图并保留脚本文本。

**故障记录示例。** 若脚本报告安装完成而网页出现 `502`，对照实际 FPM socket 和站点配置；修正模板后再次运行同一脚本，报告中写明修正位置及复测结果。不要直接把示例写成自己遇到的问题。

## 报告验收

| 证据 | 画面或材料必须能说明什么 |
| --- | --- |
| 安装阶段 | 脚本安装 Nginx、PHP、MySQL 的终端日志 |
| 站点阶段 | 创建和修改目录、调整权限、备份默认配置、最终配置文件；附 PHP 测试页 |
| 数据库阶段 | phpMyAdmin 目录及属主、创建管理用户、短语设置、创建 `wp` 用户和数据库的日志 |
| 浏览器 | 登录 phpMyAdmin 后的建库操作及结果，能看到 `wp` |
| 源文件 | 主脚本、子脚本、模板、SQL 和所需本地资源说明；报告内贴出注释或逐段说明 |

[核对报告与提交要求](submission.html)
