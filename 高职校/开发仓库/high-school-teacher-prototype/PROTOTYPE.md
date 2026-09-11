# 本地 Mock 原型

该目录是从 `high-school-teacher-develop` 创建的独立原型副本。所有业务请求默认由浏览器本地 Mock 引擎处理，不连接 Java、FastGPT 或其他外部后端。

## 启动

```bash
pnpm install
pnpm --dir projects/app dev
```

默认预览地址：`http://localhost:3390`。

## 测试账号

| 身份 | 账号 | 密码 |
| --- | --- | --- |
| 管理员 | `15815678976` | `Xx@123456` |
| 普通教师 | `15815501001` | `Xx@123456` |
| 学生 | `20250101` | `Xx@123456` |

Mock 登录不需要滑块验证码。页面 CRUD 数据保存在当前浏览器 `localStorage` 中。

## Mock 结构

- `projects/app/src/mocks/accounts.ts`：测试账号与身份数据。
- `projects/app/src/mocks/fixtures.ts`：学校、课程、师生、资源等种子数据。
- `projects/app/src/mocks/engine.ts`：统一接口路由、分页、CRUD 与安全默认返回。
- 页面右下角的“重置数据”可恢复全部种子数据。

该原型仓库已硬性启用 Mock 模式，并移除开发代理，环境变量误配置也不会连接真实后端。

## 验证

```bash
pnpm exec vitest run --config projects/app/test/mock/vitest.config.mts
NODE_OPTIONS=--max-old-space-size=8192 pnpm --dir projects/app build
```
