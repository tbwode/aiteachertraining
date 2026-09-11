import { exit } from 'process';

/*
  Init system
*/
export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      // 纯前端模式，跳过所有后端初始化
      if (process.env.FRONTEND_ONLY === 'true') {
        console.log('Frontend only mode, skipping backend initialization');
        return;
      }

      console.log('Init system success');
    }
  } catch (error) {
    console.log('Init system error', error);
    exit(1);
  }
}
