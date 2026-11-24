# Linux 操作系统实践 · 实验指导书

面向修读“Linux 操作系统实践”的学生。五项实验从安装虚拟机开始，依次完成系统管理、博客部署、Shell 脚本和 LNMP 自动化部署。各章提供操作步骤、验证方法和报告取证要求。

| 实验 | 主要内容 |
| --- | --- |
| [一 · 在虚拟机中安装 Linux](docs/lab1.md) | 英语安装、个人账号、虚拟硬件与安装证据 |
| [二 · Linux 基本操作](docs/lab2.md) | APT、中文支持、SSH、sudo |
| [三 · 在 Linux 中部署博客网站](docs/lab3.md) | Nginx、PHP-FPM、MySQL、phpMyAdmin 和 WordPress |
| [四 · Shell 脚本基础](docs/lab4.md) | 用户权限判断、站点备份、Ping 响应统计 |
| [五 · 使用 Shell 脚本部署 LNMP](docs/lab5.md) | 分阶段部署、日志与复现验证 |

[报告提交与评分](docs/submission.md)

## 目录

- `docs/index.html` 为课程首页。
- `docs/lab1.md` 至 `docs/lab5.md` 为实验正文，`docs/submission.md` 为提交要求。
- `docs/_layouts/guide.html` 为共享页面模板，`docs/assets/` 存放样式和浏览器交互。
- `docs/_config.yml` 配置 GitHub Pages 内置的 Jekyll。正文页面和资源使用相对链接，支持项目子路径。

## 发布与更新

首次发布时，打开仓库 **Settings → Pages → Build and deployment**。Source 选择 **Deploy from a branch**，分支选择 **main**，目录选择 **/docs**，保存。GitHub 会从 Markdown 和页面模板自动生成网站。

后续编辑实验 Markdown 并推送到 `main` 即可触发重新生成。可以在 **Actions → pages build and deployment** 查看发布状态，在 **Settings → Pages → Visit site** 打开线上课程。项目不需要自定义 CI 工作流。

本地已安装 Jekyll 及 GFM 解析器时，可运行 `jekyll serve --source docs`，在终端给出的本地地址预览。
