---
key: lab3
kicker: 实验 03 / 05 · Web 服务
title: 在 Linux 中部署博客网站
intro: 本次先手工完成部署。每接通一层就验证一次，最后从宿主机浏览器打开自己发表的文章。
command: curl -s -o /dev/null -w '%{http_code}' http://localhost/zsblog/
output: "200"
---
## 实验任务

让 Nginx 接收浏览器请求，交给 PHP-FPM 执行 PHP，由 WordPress 读写 MySQL。phpMyAdmin 用于管理数据库。使用实验二的 Ubuntu 24.04 LTS 或 26.04 LTS 虚拟机，示例中的 `zs`、`123` 和 IP 均须替换。可登录实验一建立的首字母账号执行本章命令。`whoami` 显示当前用户名，`id -gn` 显示该用户的主组。后面设置网站目录的属主和组时会用到这两个值。

> **本章截屏**　从宿主机截取整个屏幕。终端保留命令和输出，浏览器保留地址栏和页面结果。需要强调库名或文章标题时，在全屏图上加红框。[查看网页取图样式](screenshots.html#browser)

## 1. 安装并识别三个服务

```bash
sudo apt update
sudo apt install nginx mysql-server php-fpm php-cli php-mysql php-mbstring php-xml php-curl php-zip php-gd curl openssl
sudo systemctl enable --now nginx mysql
systemctl list-units --type=service 'php*-fpm.service'
systemctl is-active nginx mysql
php -v
ls -l /run/php/*-fpm.sock
```

| 操作 | 为什么做、看什么 |
| --- | --- |
| `apt update`、`apt install` | 先刷新软件包索引，再安装 Web 服务、数据库、PHP 运行环境及扩展。`php-mysql` 让 PHP 应用能连接 MySQL。 |
| `systemctl enable --now nginx mysql` | 立即启动 Nginx 和 MySQL，并设置开机自动启动。 |
| `systemctl list-units`、`systemctl is-active` | 前者显示本机 PHP-FPM 的服务名和运行状态，后者检查 Nginx 和 MySQL 是否均为 `active`。在此截取服务状态。 |
| `php -v` | 显示命令行 PHP 的版本，供后面选择兼容的应用版本参考。 |
| `ls -l /run/php/*-fpm.sock` | 列出 PHP-FPM 用来接收本机请求的 Unix socket 文件。记下正在运行的 FPM 服务对应的完整路径，下一步填入 Nginx 配置。 |

**先做一次连通测试。** 在虚拟机运行 `hostname -I`，选宿主机可达的 IPv4 地址。先在虚拟机执行 `curl -I http://127.0.0.1/`，检查首行状态；再在宿主机浏览器输入 `http://虚拟机IP/`。保留安装结果图，在图注中标出三个服务的实际名称。如果本机能打开欢迎页而宿主机打不开，先核对访问地址和虚拟网卡，再继续修改站点。

## 2. 更换站点根目录，接通 PHP

在虚拟机的普通用户 Shell 执行。目录名取**姓名首字母**，属主和组取**当前登录用户及其主组**，不要直接用带学号后缀的用户名拼接网站路径。

```bash
initials=zs
webroot="/$initials/www"
sudo cp -n /etc/nginx/sites-available/default /etc/nginx/sites-available/default.before-lab
sudo mkdir -p "$webroot"
sudo chown -R "$(id -un):$(id -gn)" "$webroot"
ls -ld "$webroot"
ls -l /etc/nginx/sites-available/default*
```

前两行把姓名首字母和网站路径存入变量，后续命令就能使用同一个目录。`cp -n` 备份原配置，再次执行时保留第一次备份。`mkdir -p` 创建站点目录，`chown` 把它交给当前用户及主组，方便稍后写入测试页面。最后两条 `ls` 分别显示目录的属主、属组以及备份文件名。

用 `sudo nano /etc/nginx/sites-available/default` 编辑默认站点。把 `root` 改为自己的站点目录，Nginx 会到这里查找浏览器请求的文件。

**为什么要看 `/run/php/`？** 浏览器访问 `info.php` 时，Nginx 要把请求交给 PHP-FPM 执行。`fastcgi_pass` 指定交接地址，`unix:` 后面填写上一步记下的完整路径。例如，若列出的是 `/run/php/php8.5-fpm.sock`，就把下例中的 `php8.3-fpm.sock` 换成 `php8.5-fpm.sock`。文件名写错时，配置语法仍可能正确，但 Nginx 连不上 PHP-FPM，浏览器访问 PHP 页面时就会看到 `502 Bad Gateway`。

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /zs/www;
    index index.php index.html;

    location / {
        try_files $uri $uri/ =404;
    }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
}
```

配置中的 `listen` 让 Nginx 在 80 端口接收 HTTP 请求，`default_server` 使这个站点处理未匹配到其他站点的请求。`index` 指定访问目录时依次查找的首页；`location /` 中的 `try_files` 先查文件和目录，找不到时返回 404。以 `.php` 结尾的请求进入第二个 `location`，由 `include` 引入处理 PHP 脚本所需的参数，再通过 `fastcgi_pass` 交给 PHP-FPM。

在 `nano` 中截取全屏图，用红框标出 `root` 和 `fastcgi_pass` 两行。保存退出后，运行下方第一条命令检查配置并重载 Nginx。如果 `nginx -t` 报错，按提示的文件和行号修正，再执行一次。

第一行中的 `&&` 表示语法检查通过才重载，让新配置生效。第二行把调用 `phpinfo()` 的测试脚本写入新站点目录。执行后，在宿主机打开 `http://虚拟机IP/info.php`。成功页面显示 PHP 版本，Server API 显示 FPM/FastCGI。截取这个页面，实验结束时删除测试文件。

```bash
sudo nginx -t && sudo systemctl reload nginx
printf '%s\n' '<?php phpinfo();' > "$webroot/info.php"
```

## 3. 安装 phpMyAdmin 并创建管理账号

1. 从官网下载与 PHP 版本兼容的 **all-languages.tar.gz 发布包**。下例使用 5.2.3 并解压到带学号后三位的目录。请在同一终端接续上一节；如重新登录，先重新设置 `webroot`。

   ```bash
   suffix=123
   pma="$webroot/pma$suffix"
   release=5.2.3
   curl -fL "https://files.phpmyadmin.net/phpMyAdmin/$release/phpMyAdmin-$release-all-languages.tar.gz" -o /tmp/pma-lab.tar.gz
   sudo install -d -o www-data -g www-data "$pma"
   sudo tar -xzf /tmp/pma-lab.tar.gz --strip-components=1 -C "$pma"
   sudo cp -n "$pma/config.sample.inc.php" "$pma/config.inc.php"
   sudo chown -R www-data:www-data "$pma"
   ls -ld "$pma"
   ```

   `suffix`、`pma`、`release` 分别保存学号后缀、安装目录和版本号。`curl -fL` 跟随下载链接，遇到 HTTP 错误即报错。`install -d` 创建目标目录并设置属主；`tar` 解压时去掉压缩包最外层目录，让访问路径直接对应 phpMyAdmin。`cp -n` 从样例生成配置并保留已有配置，`chown -R` 设置解压文件的属主，`ls -ld` 显示最终目录及属主。

2. 在虚拟机运行 `sudo mysql` 进入数据库管理控制台。建立供 phpMyAdmin 登录的本机管理账号 `lab_pma`。下面两条授权分别用于创建本地数据库账号和向 `wp` 库授予权限。本节用 `123456` 举例，登录时输入建账号时设置的密码。

   ```sql
   CREATE USER 'lab_pma'@'localhost' IDENTIFIED BY '123456';
   GRANT CREATE USER ON *.* TO 'lab_pma'@'localhost';
   GRANT ALL PRIVILEGES ON wp.* TO 'lab_pma'@'localhost' WITH GRANT OPTION;
   SHOW GRANTS FOR 'lab_pma'@'localhost';
   EXIT;
   ```

   `CREATE USER` 建立登录账号。第一条 `GRANT` 允许它创建后面要用的博客账号，第二条允许它管理 `wp` 库并把这个库的权限授予博客账号。`SHOW GRANTS` 显示授权结果，`EXIT` 返回终端。

3. **记录模板指定的短语配置。** 原模板点名 `libraries/config.default.php` 和站点根目录的 `config.inc.php`，要求指出 `$cfg['blowfish_secret']` 并以姓名全拼演示，例如 `zhangsan`。先查找实际文件；将两份存在的文件复制到家目录的练习文件夹，在副本中按模板修改，截图标注“模板演示副本”、路径和版本。某版本若无默认文件，就记录实测目录。报告再单独给出实际运行配置的证据。
4. **配置实际站点。** phpMyAdmin 官方将用户配置放在 `config.inc.php`，默认文件由软件包维护；cookie 认证使用 32 字节随机密钥。下面的命令用 `random_bytes(32)` 生成密钥，再转成可复制的十六进制文本；生成的 PHP 赋值语句会把文本还原为 cookie 认证所需的密钥。用 `sudo nano "$pma/config.inc.php"` 打开配置文件，将输出粘贴到原有短语设置的位置。保留示例中的 `auth_type = 'cookie'` 和 `host = 'localhost'`。**姓名全拼与有效密钥的区别要在报告里解释清楚。**

   ```bash
   php -r 'printf("\$cfg[\x27blowfish_secret\x27] = sodium_hex2bin(\x27%s\x27);\n", bin2hex(random_bytes(32)));'
   ```

5. 在宿主机打开 `http://虚拟机IP/pma123/`，用 `lab_pma` 登录。进入 **SQL** 页，逐条执行下列语句。网页上的管理账号可能看不到全局“用户账户”标签，使用 SQL 页仍可完成所授范围内的操作。记下 `wp` 用户的密码，下一步配置 WordPress 时会用到。

   ```sql
   CREATE DATABASE wp CHARACTER SET utf8mb4;
   CREATE USER 'wp'@'localhost' IDENTIFIED BY '123456';
   GRANT ALL PRIVILEGES ON wp.* TO 'wp'@'localhost';
   SHOW DATABASES LIKE 'wp';
   ```

`CREATE DATABASE` 建立保存文章和设置的库，`utf8mb4` 用于保存中文等 Unicode 字符。`CREATE USER` 建立 WordPress 连接数据库使用的账号，`GRANT` 将它的权限限定在 `wp` 库。最后的 `SHOW DATABASES` 查询会列出刚创建的库。

**数据库页面怎样核验。** 保留最后一条查询的结果。截取宿主机全屏，应同时看到地址栏里的 `pma后三位`、查询结果的 `wp` 和左侧库名。要记录授权，可在虚拟机的 MySQL 管理会话执行 `SHOW GRANTS FOR 'wp'@'localhost';`。短语配置的实际运行证据可用 `php -l "$pma/config.inc.php"` 的语法检查结果配合网页登录画面。

## 4. 安装 WordPress 并发表文章

1. 在 WordPress 官方发布页选与 `php -v` 结果兼容的版本，复制该版 `.tar.gz` 下载地址。使用下列命令下载并解压；这次的目录名是**姓名首字母 + blog**。

   ```bash
   read -r -p '粘贴 WordPress 官方 tar.gz 下载地址：' wp_url
   curl -fL "$wp_url" -o /tmp/wordpress-lab.tar.gz
   blog="$webroot/${initials}blog"
   sudo install -d -o www-data -g www-data "$blog"
   sudo tar -xzf /tmp/wordpress-lab.tar.gz --strip-components=1 -C "$blog"
   sudo chown -R www-data:www-data "$blog"
   ls -ld "$blog"
   ```

   `read` 接收粘贴的下载地址，`curl` 将发布包保存到虚拟机。`blog` 记录博客目录，`install -d` 创建它，`tar` 把程序直接解压到这个目录。`chown` 让 WordPress 运行时使用的 `www-data` 账号能写入配置和上传文件，`ls -ld` 显示目录名称和属主。

2. 从宿主机打开 `http://虚拟机IP/zsblog/wp-admin/setup-config.php`。数据库名填 `wp`，用户填 `wp`，密码填上一节创建的博客口令，主机填 `localhost`。再设置博客标题和独立的 WordPress 后台账号，记录配置界面。
3. 登录后台，选择“文章 → 写文章”，输入自拟标题和正文并发布。在新的浏览器标签页打开文章固定链接，截图应能辨认个人站点路径、文章标题和正文。完成验收后移除刚才的测试页：`rm -f "$webroot/info.php"`。

**发表后怎么确认。** 发布成功后点“查看文章”，核对地址栏仍是本虚拟机的博客路径，正文有自己的标题和内容。截宿主机全屏，图注写实际标题和访问路径。如果页面停留在编辑器或预览，返回文章列表确认状态为“已发布”，再打开前台链接取图。

## 报告验收

| 环节 | 检查自己的截图是否覆盖 |
| --- | --- |
| 环境与 Nginx | 三个组件安装、默认配置备份、根目录及属主、有效站点的 root 和 PHP 段、phpinfo 页面 |
| phpMyAdmin 与 MySQL | 安装包来源、`pma后三位` 路径及属主、管理账号、两处模板短语及实际配置说明、网页登录并建立 `wp` 用户和数据库 |
| WordPress | 安装包来源、`首字母blog` 路径及属主、安装向导、发表后可访问的文章 |

**按现象定位。** `404` 先核对浏览器路径与 `root` 下的文件；`502` 先对照 FastCGI socket 和 PHP-FPM 服务；WordPress 报数据库连接错误时，用 `mysql -u wp -p -h localhost wp` 单独验证数据库。每次只改变一项，再重试同一请求。

[phpMyAdmin 下载](https://www.phpmyadmin.net/downloads/) · [phpMyAdmin 配置](https://docs.phpmyadmin.net/en/latest/config.html#cfg_blowfish_secret) · [WordPress 发布版](https://wordpress.org/download/releases/) · [PHP 兼容表](https://make.wordpress.org/core/handbook/references/php-compatibility-and-wordpress-versions/) · [WordPress 安装手册](https://developer.wordpress.org/advanced-administration/before-install/howto-install/)

[下一项实验 · Shell 脚本基础](lab4.html)
