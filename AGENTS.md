# AGENTS.md

佳明运动数据同步工具：在佳明中国区（garmin.cn）与国际区（garmin.com）之间同步/迁移活动，并可抓取 RunningQuotient 数据写入 Google Sheets。通过 GitHub Actions 定时运行。

## 常用命令

```shell
yarn                          # 安装依赖
npx tsc --noEmit              # 类型检查
yarn test                     # jest 单元测试
yarn sync_cn                  # 中国区 -> 国际区 增量同步
yarn sync_global              # 国际区 -> 中国区 增量同步
yarn migrate_garmin_cn_to_global / migrate_garmin_global_to_cn   # 历史数据迁移
yarn rq                       # RunningQuotient -> Google Sheets
```

要求 Node 22（sqlite3 6 需要 >= 20.17），包管理器为 yarn。

## 目录结构

- `src/*.ts`：入口脚本，每个只有几行，通过 `runTask` 调用对应功能。
- `src/garmin/`：佳明核心逻辑
  - `regions.ts`：CN / GLOBAL 区域配置（域名、token 目录、环境变量名）
  - `client.ts`：`getGarminClient(region)`，复用 token，失效时仅登录一次
  - `sync.ts`：`syncActivities(source, target)`、`migrateActivities(source, target)`
  - `files.ts`：下载并解压 / 上传 .fit 文件
  - `statistics.ts`：最近一次跑步的统计数据
- `src/utils/`：`activity.ts`（配速格式化、筛选待同步活动，纯函数）、`run_task.ts`（统一错误处理 + Bark 通知）、`runningquotient.ts`、`google_sheets.ts`、`sqlite.ts`、`strava.ts`（已废弃）、`number_tricks.ts`
- `src/constant.ts`：默认配置，**不得写入任何账号、密码或密钥**
- `tests/`：jest 测试（`ts-jest`），模块通过 mock 隔离，不访问网络
- `.github/workflows/`：定时同步、测试等工作流

## 约定

- 凭据只从环境变量读取（GARMIN_USERNAME、GARMIN_PASSWORD、GARMIN_GLOBAL_USERNAME、GARMIN_GLOBAL_PASSWORD、BARK_KEY、AESKEY、GOOGLE_*、RQ_*）。`constant.ts` 中的默认值保持为空字符串。
- 新增入口脚本必须用 `runTask(...)` 包装，保证异步失败时 `setFailed`、发送 Bark 通知并以退出码 1 结束。
- 纯逻辑放进 `utils/activity.ts` 这类无副作用模块并加测试；涉及网络的代码在测试中 mock。
- `@actions/core` 必须保持 1.x（2.x 起只支持 ESM，本项目是 CommonJS）。
- `garmin-connect` 的类型声明有错误，依赖 `tsconfig` 的 `skipLibCheck`，不要关闭。

## 登录与封禁风险

佳明会限流/封禁频繁登录的 IP，因此：

- 登录令牌保存在 `tokens/`，已被 `.gitignore` 忽略，**不要提交到 git**；工作流用 `actions/cache` 持久化。
- 不要给登录加重试，不要恢复 `push` 触发同步，不要提高 cron 频率。
- 同步和迁移工作流共用 `concurrency` 组 `garmin-sync`，避免并发登录。
- 本地调试会在 `tokens/`、`db/`、`garmin_fit_files/` 产生文件，均已忽略。

## 提交前检查

1. `npx tsc --noEmit`
2. `yarn test`
3. 确认 `git status` 中没有 `tokens/`、`db/`、`garmin_fit_files/` 或任何凭据。
