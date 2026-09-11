import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { xrayPlugin } from '@stinsky/xray/plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// 静态导出模式下 i18n 配置需移除，国际化通过 next-i18next 客户端处理

const isDev = process.env.NODE_ENV === 'development';
const isMockMode = true;

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_URL,
  // 静态导出模式下不能使用 i18n，通过 next-i18next 配置处理国际化
  // i18n,
  // 静态导出模式 - 生成纯前端 HTML
  output: 'export',
  // Keep development artifacts separate from the production export. Running a
  // production build while the prototype dev server is open must not replace
  // the chunks currently served by that dev process.
  distDir: isDev ? '.next-dev' : 'dist',
  reactStrictMode: isDev ? false : true,
  compress: !isDev,
  // 禁用 source map（可选，根据需要）
  productionBrowserSourceMaps: false,
  // 禁用类型检查以节省内存（CI 中单独运行类型检查）
  typescript: {
    ignoreBuildErrors: true
  },
  // 禁用 ESLint 在构建时运行
  eslint: {
    ignoreDuringBuilds: true
  },
  swcMinify: true,
  images: {
    unoptimized: true
  },

  webpack(config, { isServer }) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@scalar\/api-reference-react/,
        message: /autoprefixer/
      }
    ];

    Object.assign(config.resolve.alias, {
      '@mongodb-js/zstd': false,
      '@aws-sdk/credential-providers': false,
      snappy: false,
      aws4: false,
      'mongodb-client-encryption': false,
      kerberos: false,
      'supports-color': false,
      'bson-ext': false,
      'pg-native': false
    });
    config.module = {
      ...config.module,
      rules: config.module.rules.concat([
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack']
        }
      ]),
      exprContextCritical: false,
      unknownContextCritical: false
    };

    if (!config.externals) {
      config.externals = [];
    }

    if (isServer) {
      config.externals.push('@node-rs/jieba');
    } else {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false
        }
      };
    }

    config.experiments = {
      asyncWebAssembly: true,
      layers: true
    };

    if (isDev && !isMockMode) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        xrayPlugin({
          bundler: 'webpack',
          editor: 'code'
        })
      );
    }

    if (isDev && !isServer) {
      config.devtool = 'eval-cheap-module-source-map';
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.git', '**/dist', '**/coverage']
      };
      config.cache = {
        type: 'filesystem',
        name: 'client',
        buildDependencies: {
          config: [__filename]
        },
        cacheDirectory: path.resolve(__dirname, '.next-dev/cache/webpack'),
        maxMemoryGenerations: isDev ? 5 : Infinity,
        maxAge: 7 * 24 * 60 * 60 * 1000
      };
    }

    return config;
  },
  transpilePackages: ['@modelcontextprotocol/sdk', 'ahooks'],
  // 重定向配置：所有角色登录页统一指向 /login
  async redirects() {
    return [
      {
        source: '/admin/login',
        destination: '/login',
        permanent: false
      },
      {
        source: '/teacher/login',
        destination: '/login',
        permanent: false
      },
      {
        source: '/student/login',
        destination: '/login',
        permanent: false
      }
    ];
  },
  experimental: {
    serverComponentsExternalPackages: [
      'mongoose',
      'pg',
      'bullmq',
      '@zilliz/milvus2-sdk-node',
      'tiktoken',
      '@opentelemetry/api-logs'
    ],
    outputFileTracingRoot: path.join(__dirname, '../../'),
    instrumentationHook: true
  }
};

export default nextConfig;
