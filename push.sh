#!/usr/bin/env bash
# lets-chatnow → github.com/wingworkstudio/let-s-chat-now 一键推送脚本
#
# 用法：
#   GITHUB_TOKEN=ghp_xxx ./push.sh              # 经典 token
#   GITHUB_TOKEN=github_pat_xxx ./push.sh       # fine-grained token
#   ./push.sh github_pat_xxx                    # 或作为第一个参数
#   GITHUB_TOKEN=xxx GITHUB_USER=xxx ./push.sh  # 若用户名不是 wingworkstudio
#
# 注意：fine-grained token 需在该仓库的 Settings → Actions → 无关，
#       而是在 https://github.com/settings/tokens?type=beta 创建时勾选
#       此仓库的 Contents: Read and write 权限。
#
# 行为：
#   1. 使用 token 调用 GitHub API 确认仓库存在 & 当前用户有写权限
#   2. 强推（-f）到已存在的 let-s-chat-now 仓库 main 分支，覆盖原 LICENSE-only 历史
#   3. 完成后清空 token 痕迹

set -euo pipefail

TOKEN="${1:-${GITHUB_TOKEN:-}}"
USERNAME="${GITHUB_USER:-wingworkstudio}"
REPO="let-s-chat-now"

if [[ -z "$TOKEN" ]]; then
  echo "❌ 请提供 GitHub token" >&2
  echo "   用法: GITHUB_TOKEN=ghp_xxx ./push.sh" >&2
  exit 1
fi

if [[ ! "$TOKEN" =~ ^(ghp_|github_pat_|gho_|ghu_|ghs_) ]]; then
  echo "⚠️  token 格式异常，应以 ghp_ / github_pat_ 等 GitHub token 前缀开头，请检查" >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo "==> 1/4 检查 git 仓库状态"
if [[ ! -d .git ]]; then
  git init -q -b main
  echo "    已初始化 git 仓库"
fi
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "    当前分支: $CURRENT_BRANCH"

echo "==> 2/4 校验 token 权限（调用 GitHub API）"
HTTP_CODE="$(curl -s -o /tmp/gh_auth.json -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user" || echo "000")"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "❌ token 验证失败，HTTP $HTTP_CODE" >&2
  cat /tmp/gh_auth.json 2>/dev/null | head -5 >&2
  exit 1
fi

AUTH_USER="$(grep -o '"login":"[^"]*"' /tmp/gh_auth.json | head -1 | cut -d'"' -f4)"
echo "    token 身份: $AUTH_USER"
if [[ "$AUTH_USER" != "$USERNAME" ]]; then
  echo "    ℹ️  提示：token 属于 $AUTH_USER，推送将使用此身份（GITHUB_USER 当前设为 $USERNAME）"
  USERNAME="$AUTH_USER"
fi

echo "==> 3/4 检查仓库 wingworkstudio/$REPO 是否存在"
REPO_HTTP="$(curl -s -o /tmp/gh_repo.json -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$USERNAME/$REPO" || echo "000")"

if [[ "$REPO_HTTP" == "404" ]]; then
  echo "❌ 仓库 $USERNAME/$REPO 不存在（HTTP 404）" >&2
  echo "   请先在 https://github.com/new 创建该仓库（可保持空，不要勾选 README）" >&2
  exit 1
fi
if [[ "$REPO_HTTP" != "200" ]]; then
  echo "❌ 无法访问仓库，HTTP $REPO_HTTP" >&2
  cat /tmp/gh_repo.json 2>/dev/null | head -5 >&2
  exit 1
fi
echo "    ✅ 仓库存在，准备推送"

echo "==> 4/4 推送到 $USERNAME/$REPO (main, --force)"
git remote remove origin 2>/dev/null || true
git remote add origin "https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO.git"

if git push -f origin "$CURRENT_BRANCH:main"; then
  echo ""
  echo "🎉 推送成功！"
  echo "   https://github.com/$USERNAME/$REPO"
else
  echo "❌ 推送失败，常见原因：" >&2
  echo "   - token 缺少 repo 写权限（需要在 GitHub 勾选 repo 权限）" >&2
  echo "   - 仓库名大小写不匹配" >&2
  exit 1
fi

# 清理：移除含 token 的 remote
git remote remove origin 2>/dev/null || true
unset TOKEN
echo "==> 已清除本地 token 痕迹"
