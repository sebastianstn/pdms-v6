#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

echo "🔧 Konfiguriere sicheren Git-Workflow für dieses Repository ..."

git config --local commit.template .gitmessage.txt
git config --local core.hooksPath .githooks
git config --local pull.rebase true
git config --local rebase.autoStash true

chmod +x .githooks/pre-commit .githooks/pre-push

echo "✅ Fertig. Aktivierte Einstellungen:"
echo "   - commit.template = .gitmessage.txt"
echo "   - core.hooksPath = .githooks"
echo "   - pull.rebase = true"
echo "   - rebase.autoStash = true"
echo
echo "Optionaler Bypass im Notfall:"
echo "   SKIP_PREPUSH_TESTS=1 git push"
echo "   SKIP_GIT_CHECKS=1 git commit"