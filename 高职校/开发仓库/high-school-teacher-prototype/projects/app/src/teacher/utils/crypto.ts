/**
 * 前端加密工具函数
 */

/**
 * 使用 SHA256 加密字符串
 * @param str 原始字符串
 * @returns SHA256 哈希值（hex格式）
 */
export async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
