#!/bin/bash

# Landing Page Deployment Script
# 用于将最新的落地页更新部署到生产环境

set -e  # 遇到错误立即退出

echo "🚀 开始部署落地页到生产环境..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 请在 deploy/production 目录下运行此脚本${NC}"
    exit 1
fi

# 1. 拉取最新代码
echo -e "${YELLOW}📥 拉取最新代码...${NC}"
cd ../..
git pull origin main

# 2. 检查 brand 目录是否存在
if [ ! -d "deploy/production/brand" ]; then
    echo -e "${RED}错误: deploy/production/brand 目录不存在${NC}"
    exit 1
fi

# 3. 重启 Caddy 服务以加载新的静态文件
echo -e "${YELLOW}🔄 重启 Caddy 服务...${NC}"
cd deploy/production
docker-compose restart caddy

# 4. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 3

# 5. 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
docker-compose ps

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}落地页已更新，请访问 https://siliconfission.com 查看效果${NC}"
echo ""
echo -e "${YELLOW}💡 提示: 如果浏览器仍显示旧版本，请清除浏览器缓存或使用无痕模式访问${NC}"
