---
key: lab3
kicker: 实验 03 / 05 · Web 服务
title: 在 Linux 中部署博客网站
intro: 本次先手工完成部署。每接通一层就验证一次，最后从宿主机浏览器打开自己发表的文章。
command: curl -s -o /dev/null -w '%{http_code}' http://localhost/zsblog/
output: "200"
---
## 实验任务

让 Nginx 接收浏览器请求，交给 PHP-FPM 执行 PHP，由 WordPress 读写 MySQL。phpMyAdmin 用于管理数据库。使用实验二的 Ubuntu 24.04 LTS 或 26.04 LTS 虚拟机，示例中的 `zs`、`123` 和 IP 均须替换。可登录实验一建立的首字母账号执行本章命令。先记下 `whoami` 和 `id -gn` 的结果。

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

截取安装过程和服务状态。先从宿主机访问虚拟机 IP，确认 Nginx 能返回页面。记录实际 PHP 版本及 socket 的完整文件名，默认软件包下，24.04 对应 `php8.3-fpm.sock`，26.04 对应 `php8.5-fpm.sock`。填写下一节的 `fastcgi_pass` 时，以刚才 `ls` 列出的文件为准。

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

用 `sudo nano /etc/nginx/sites-available/default` 修改启用的默认站点。以下是本实验独立虚拟机上的完整示例。将 `/zs/www` 和 FastCGI socket 改为实际值。默认站点还应通过 `/etc/nginx/sites-enabled/default` 启用。

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

保存后运行 `readlink -f /etc/nginx/sites-enabled/default`，输出应指向刚编辑的文件。用 `grep -nE '^[[:space:]]*(root|fastcgi_pass)[[:space:]]' /etc/nginx/sites-enabled/default` 将根目录和 socket 同时显示出来，与 `ls -l /run/php/` 中的实际文件对照。**在此截一张终端全屏图**，使路径、命令与返回值清楚可见。语法检查失败时，按 `nginx -t` 给出的文件与行号修改，检查通过后再重载。

执行以下命令后，在宿主机打开 `http://虚拟机IP/info.php`。成功页面显示 PHP 版本，Server API 显示 FPM/FastCGI。留取本页截图后移除测试文件，以免长期暴露环境信息。

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

2. 在虚拟机运行 `sudo mysql`。建立供 phpMyAdmin 登录的本机管理账号 `lab_pma`。下面两条授权分别用于创建本地数据库账号和向 `wp` 库授予权限。本节用 `123456` 举例，登录时输入建账号时设置的密码。

   ```sql
   CREATE USER 'lab_pma'@'localhost' IDENTIFIED BY '123456';
   GRANT CREATE USER ON *.* TO 'lab_pma'@'localhost';
   GRANT ALL PRIVILEGES ON wp.* TO 'lab_pma'@'localhost' WITH GRANT OPTION;
   SHOW GRANTS FOR 'lab_pma'@'localhost';
   EXIT;
   ```

3. **记录模板指定的短语配置。** 原模板点名 `libraries/config.default.php` 和站点根目录的 `config.inc.php`，要求指出 `$cfg['blowfish_secret']` 并以姓名全拼演示，例如 `zhangsan`。先查找实际文件；将两份存在的文件复制到家目录的练习文件夹，在副本中按模板修改，截图标注“模板演示副本”、路径和版本。某版本若无默认文件，就记录实测目录。报告再单独给出实际运行配置的证据。
4. **配置实际站点。** phpMyAdmin 官方将用户配置放在 `config.inc.php`，默认文件由软件包维护；cookie 认证使用 32 字节随机密钥。下面的命令在虚拟机内生成一份 PHP 赋值语句，用 `sudo nano "$pma/config.inc.php"` 打开配置文件，将输出粘贴到原有短语设置的位置。保留示例中的 `auth_type = 'cookie'` 和 `host = 'localhost'`。**姓名全拼与有效密钥的区别要在报告里解释清楚。**

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

**数据库页面怎样核验。** 在 phpMyAdmin 的 SQL 页执行 `SHOW DATABASES LIKE 'wp';`。截取宿主机全屏，应同时看到地址栏里的 `pma后三位`、查询结果的 `wp` 和左侧库名。要记录授权，可在虚拟机的 MySQL 管理会话执行 `SHOW GRANTS FOR 'wp'@'localhost';`。短语配置的实际运行证据可用 `php -l "$pma/config.inc.php"` 的语法检查结果配合网页登录画面。

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
