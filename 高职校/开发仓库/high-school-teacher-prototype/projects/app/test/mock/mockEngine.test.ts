import { beforeEach, describe, expect, it } from 'vitest';
import { TEST_PASSWORD_SHA256 } from '@/mocks/accounts';
import { resetMockState, resolveMockRequest } from '@/mocks/engine';

beforeEach(() => {
  resetMockState();
});

describe('Mock 原型请求引擎', () => {
  it.each([
    ['15815678976', '系统管理员', 2],
    ['15815501001', '李老师', 2],
    ['20250101', '陈思远', 1]
  ])('支持测试账号 %s 登录', async (account, username, type) => {
    const result = await resolveMockRequest<any>({
      method: 'POST',
      url: '/client/auth/university/login',
      data: { account, password: TEST_PASSWORD_SHA256 }
    });

    expect(result).toMatchObject({ account, username, type });
    expect(result.accessToken).toContain('mock-token');
  });

  it('错误密码不会通过登录', async () => {
    await expect(
      resolveMockRequest({
        method: 'POST',
        url: '/client/auth/university/login',
        data: { account: '15815501001', password: 'wrong' }
      })
    ).rejects.toMatchObject({ code: 400 });
  });

  it('分页数据可读，新增数据可在后续请求中读取', async () => {
    const before = await resolveMockRequest<any>({
      method: 'POST',
      url: '/client/course/page',
      data: { current: 1, size: 10 }
    });

    await resolveMockRequest({
      method: 'POST',
      url: '/client/course/add',
      data: { id: 999, name: 'Mock 新增课程', code: 'MOCK-999' }
    });

    const after = await resolveMockRequest<any>({
      method: 'POST',
      url: '/client/course/page',
      data: { current: 1, size: 10, searchKey: 'Mock 新增课程' }
    });

    expect(before.total).toBeGreaterThan(0);
    expect(after.records).toHaveLength(1);
    expect(after.records[0]).toMatchObject({ id: 999, name: 'Mock 新增课程' });
  });

  it('未精细建模的接口返回本地安全默认值', async () => {
    const result = await resolveMockRequest({
      method: 'POST',
      url: '/client/prototype/unknown/list'
    });

    expect(result).toEqual([]);
  });
});
