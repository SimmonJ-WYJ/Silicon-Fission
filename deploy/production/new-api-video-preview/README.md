# New API 视频结果预览修复

基于官方 [New API v1.0.0-rc.22](https://github.com/QuantumNous/new-api/tree/v1.0.0-rc.22) 的前端补丁。成功的视频任务使用 `result_url` 判断结果入口，并兼容旧的 `fail_reason` URL。

点击「查看结果」后，通过控制台现有 API 客户端请求 `/v1/videos/{task_id}/content`。弹窗提供播放器和下载链接，不把 API Key 放进 URL。保留服务端原有权限检查。失败时显示重试入口；关闭弹窗会取消请求并释放 Blob URL。

此目录保存精确源码补丁和构建方法；后端、公共数据类型、计费与渠道配置不在本次改动中。补丁中的 `TaskLog.result_url` 仅为前端任务日志类型。构建产物和生产数据不提交到仓库。

## 文件

- `video-preview.patch`：播放器、任务日志入口、9 项新增回归测试、7 种语言文案及可配置的静态资源前缀。
- `build.sh`：校验上游源码、应用补丁、安装锁定依赖、测试并构建前端。
- `LICENSE.new-api`：保留上游 GNU AGPL v3 许可证。修改文件中的 QuantumNous 版权声明保持不变。

## 构建

需要 Bash、curl、tar、patch、shasum 和 Bun（本次验证使用 1.3.12）。从仓库根目录执行：

```bash
bash deploy/production/new-api-video-preview/build.sh /tmp/sf-video-preview-artifacts
```

脚本固定上游版本并校验源码归档 SHA-256：

```text
a0f24a289bdb8b9924efd813e63d0e7cd61113c015ec0be52892e6aafbb00e5a
```

已有官方归档时可设置 `NEW_API_ARCHIVE=/absolute/path/new-api.tar.gz`，仍会执行同样的校验。脚本只构建，不连接服务器或自动发布。输出 `frontend-dist.tar.gz`，其中包含 `dist/`。

## 接入现有部署

2026-10-28 发布使用独立资源前缀 `/_sf-video-preview/20261028/`，避免覆盖旧客户端正在使用的 `/static/` 文件。

1. 备份生产 Caddyfile 和控制台 HTML shell，并记录当前计费、分组和渠道配置的脱敏校验值。
2. 解压构建产物，将 `dist/` 放到 Caddy 可读取的 `brand/video-preview-20261028/`。
3. 在控制台路由前加入以下静态资源处理器：

   ```caddyfile
   handle_path /_sf-video-preview/20261028/* {
       root * /srv/brand/video-preview-20261028
       header Cache-Control "public, max-age=31536000, immutable"
       file_server
   }
   ```

4. 从生成的 `dist/index.html` 更新现有控制台 shell 的 script/CSS 引用，保留品牌、元数据和导航脚本。控制台页面路由（包括 `/usage-logs/task`）需要使用该 shell；首页、文档与 API 保持各自的处理器。HTML 应返回 `Cache-Control: no-store`。
5. 验证 Caddy 配置后 reload。使用已有成功任务检查「查看结果」、视频播放和下载链接；检查首页、文档、鉴权响应和配置校验值。

回滚时只恢复备份的 Caddyfile 与控制台 shell，验证后 reload。保留旧静态资源；恢复前确认文件没有其他后续变更。升级 New API 时需重新核对补丁上下文和鉴权接口，不直接套用到其他版本。

## 验证记录

- 使用日志相关测试：16 通过、0 失败（其中新增视频回归测试 9 项）。
- TypeScript 检查、受影响文件 lint/format、生产前端构建通过。
- 生产页面使用现有控制台登录成功加载并播放已有视频，下载链接可用；没有新建付费生成任务。
- 发布时其他渠道和计费配置校验通过；首页、文档与状态接口内容与发布前一致。
- 实际浏览器下载文件落盘和跨用户权限测试未单独完成；服务端鉴权实现未修改。

自动化测试覆盖不提前发请求、现有鉴权头、同站下载、旧字段兼容、失败重试、错误 JSON 响应、取消请求、释放 URL、中文文案及非视频任务。
