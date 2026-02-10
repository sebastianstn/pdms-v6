#!/bin/bash
# Dashboard-Update Installer für PDMS Home-Spital
# Dieses Skript kopiert die neuen Dashboard-Dateien an die richtigen Stellen.

set -e

PROJECT_DIR="/mnt/data/pdms-v6/pdms-home-spital"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🏥 PDMS Dashboard-Update"
echo "========================"

# 1. Dashboard-Components Ordner erstellen
echo "→ Erstelle Dashboard-Components Ordner..."
mkdir -p "$PROJECT_DIR/apps/web/src/components/dashboard"

# 2. Komponenten kopieren
echo "→ Kopiere 8 neue Dashboard-Komponenten..."
cp "$SCRIPT_DIR/components/patient-list-sidebar.tsx" "$PROJECT_DIR/apps/web/src/components/dashboard/"
cp "$SCRIPT_DIR/components/vital-monitor-chart.tsx" "$PROJECT_DIR/apps/web/src/components/dashboard/"
cp "$SCRIPT_DIR/components/medication-timeline.tsx" "$PROJECT_DIR/apps/web/src/components/dashboard/"
cp "$SCRIPT_DIR/components/remote-alarms.tsx" "$PROJECT_DIR/apps/web/src/components/dashboard/"
cp "$SCRIPT_DIR/components/patient-detail-panel.tsx" "$PROJECT_DIR/apps/web/src/components/dashboard/"
cp "$SCRIPT_DIR/components/home-visit-panel.tsx" "$PROJECT_DIR/apps/web/src/components/dashboard/"
cp "$SCRIPT_DIR/components/remote-devices-panel.tsx" "$PROJECT_DIR/apps/web/src/components/dashboard/"
cp "$SCRIPT_DIR/components/status-bar.tsx" "$PROJECT_DIR/apps/web/src/components/dashboard/"
cp "$SCRIPT_DIR/components/index.ts" "$PROJECT_DIR/apps/web/src/components/dashboard/"

# 3. Dashboard Page ersetzen (Backup erstellen)
echo "→ Backup der alten Dashboard-Page..."
cp "$PROJECT_DIR/apps/web/src/app/(dashboard)/dashboard/page.tsx" \
   "$PROJECT_DIR/apps/web/src/app/(dashboard)/dashboard/page.tsx.bak"

echo "→ Neue Dashboard-Page kopieren..."
cp "$SCRIPT_DIR/page.tsx" "$PROJECT_DIR/apps/web/src/app/(dashboard)/dashboard/page.tsx"

# 4. Docker Container neu starten
echo "→ Starte pdms-web Container neu..."
cd "$PROJECT_DIR/docker"
docker compose restart pdms-web

echo ""
echo "✅ Dashboard-Update erfolgreich!"
echo ""
echo "Neue Dateien:"
echo "  📁 apps/web/src/components/dashboard/"
echo "     ├── patient-list-sidebar.tsx"
echo "     ├── vital-monitor-chart.tsx"
echo "     ├── medication-timeline.tsx"
echo "     ├── remote-alarms.tsx"
echo "     ├── patient-detail-panel.tsx"
echo "     ├── home-visit-panel.tsx"
echo "     ├── remote-devices-panel.tsx"
echo "     ├── status-bar.tsx"
echo "     └── index.ts"
echo "  📄 apps/web/src/app/(dashboard)/dashboard/page.tsx (aktualisiert)"
echo ""
echo "Backup der alten Seite:"
echo "  📄 page.tsx.bak"
echo ""
echo "Öffne http://raspberrypi.local:3000 zum Testen!"
