# 硅基裂变 · 自定义网关镜像
#
# tsx 直接运行 TypeScript,无需编译产物;体积换启动简单。
# 构建上下文为 gateway/ 目录。

FROM node:22-alpine

WORKDIR /app

# 先装依赖,利用层缓存:源码变动时不重装 node_modules
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm i tsx@4.19.2 --no-save

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8788

EXPOSE 8788

# 容器内自检:根路径返回 {status:"ok"},不需要鉴权
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8788)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "src/index.ts"]
