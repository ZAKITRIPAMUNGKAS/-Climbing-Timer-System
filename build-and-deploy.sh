#!/bin/bash
# Script untuk build dan deploy di server production
# Usage: bash build-and-deploy.sh

echo "🚀 Starting Build & Deploy Process..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error installing root dependencies${NC}"
    exit 1
fi

cd client
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error installing client dependencies${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Build React app
echo -e "${YELLOW}Step 2: Building React app...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error building React app${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Step 3: Verify build files
echo -e "${YELLOW}Step 3: Verifying build files...${NC}"
if [ ! -f "public/react-build/index.html" ]; then
    echo -e "${RED}❌ Error: public/react-build/index.html not found${NC}"
    exit 1
fi

if [ ! -d "public/react-build/assets" ]; then
    echo -e "${RED}❌ Error: public/react-build/assets directory not found${NC}"
    exit 1
fi

ASSET_COUNT=$(ls -1 public/react-build/assets/*.js 2>/dev/null | wc -l)
if [ $ASSET_COUNT -eq 0 ]; then
    echo -e "${RED}❌ Error: No JavaScript files found in assets${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build files verified:${NC}"
echo "  - index.html: $(stat -f%z public/react-build/index.html 2>/dev/null || stat -c%s public/react-build/index.html 2>/dev/null) bytes"
echo "  - JavaScript files: $ASSET_COUNT"
echo "  - Build timestamp: $(stat -f%Sm public/react-build/index.html 2>/dev/null || stat -c%y public/react-build/index.html 2>/dev/null)"
echo ""

# Step 4: Instructions for restart
echo -e "${YELLOW}Step 4: Next steps...${NC}"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "📋 Now you need to:"
echo "  1. Restart server: pm2 restart timer-panjat (or npm start)"
echo "  2. Clear browser cache or hard refresh (Ctrl + Shift + R)"
echo "  3. Check browser console for any errors"
echo ""
echo "🔍 To verify build:"
echo "  ls -la public/react-build/index.html"
echo "  ls -la public/react-build/assets/ | head -10"
echo ""

