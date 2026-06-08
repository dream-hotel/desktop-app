#!/usr/bin/env bash
#
# Sube la versión en los 3 archivos del proyecto a la vez:
#   - package.json
#   - package-lock.json
#   - src-tauri/tauri.conf.json
#   - src-tauri/Cargo.toml
#
# Uso:
#   ./scripts/bump-version.sh 0.2.0           # solo cambia los archivos
#   ./scripts/bump-version.sh 0.2.0 --tag     # además: commit + tag v0.2.0 + push
#
set -euo pipefail

# --- Validaciones -----------------------------------------------------------
VERSION="${1:-}"
DO_TAG="${2:-}"

if [[ -z "$VERSION" ]]; then
  echo "❌ Falta la versión. Uso: ./scripts/bump-version.sh X.Y.Z [--tag]"
  exit 1
fi

# Tauri/Cargo exigen semver completo X.Y.Z (números).
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Versión inválida: '$VERSION'. Debe ser X.Y.Z (ej. 0.2.0)."
  exit 1
fi

# Ubica la raíz del proyecto (carpeta padre de este script).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
cd "$ROOT"

PKG="package.json"
LOCK="package-lock.json"
CONF="src-tauri/tauri.conf.json"
CARGO="src-tauri/Cargo.toml"

for f in "$PKG" "$LOCK" "$CONF" "$CARGO"; do
  [[ -f "$f" ]] || { echo "❌ No encuentro $f (¿estás en el repo desktop-app?)"; exit 1; }
done

echo "🔧 Actualizando a la versión $VERSION ..."

# --- package.json (clave de nivel raíz "version") --------------------------
node -e '
  const fs = require("fs");
  const f = process.argv[1], v = process.argv[2];
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  j.version = v;
  fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
' "$PKG" "$VERSION"
echo "  ✓ $PKG"

# --- package-lock.json (root + paquete raíz) -------------------------------
node -e '
  const fs = require("fs");
  const f = process.argv[1], v = process.argv[2];
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  j.version = v;
  if (j.packages && j.packages[""]) j.packages[""].version = v;
  fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
' "$LOCK" "$VERSION"
echo "  ✓ $LOCK"

# --- tauri.conf.json (clave de nivel raíz "version") -----------------------
node -e '
  const fs = require("fs");
  const f = process.argv[1], v = process.argv[2];
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  j.version = v;
  fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
' "$CONF" "$VERSION"
echo "  ✓ $CONF"

# --- Cargo.toml (solo la línea version del bloque [package]) ----------------
node -e '
  const fs = require("fs");
  const f = process.argv[1], v = process.argv[2];
  let t = fs.readFileSync(f, "utf8");
  // Reemplaza la primera "version = ..." que aparece bajo [package].
  const pkgIdx = t.indexOf("[package]");
  if (pkgIdx === -1) { console.error("No hay [package] en Cargo.toml"); process.exit(1); }
  const before = t.slice(0, pkgIdx);
  let after = t.slice(pkgIdx);
  after = after.replace(/^version\s*=\s*".*?"/m, `version = "${v}"`);
  fs.writeFileSync(f, before + after);
' "$CARGO" "$VERSION"
echo "  ✓ $CARGO"

echo "✅ Versión actualizada a $VERSION en los 4 archivos."

# --- Opcional: commit + tag + push -----------------------------------------
if [[ "$DO_TAG" == "--tag" ]]; then
  echo "🏷  Creando commit y tag v$VERSION ..."
  git add "$PKG" "$LOCK" "$CONF" "$CARGO"
  git commit -m "chore: bump version to v$VERSION"
  git tag "v$VERSION"
  git push origin HEAD
  git push origin "v$VERSION"
  echo "🚀 Tag v$VERSION pusheado. El workflow de Release ya debería estar corriendo."
else
  echo "ℹ️  Revisá los cambios y luego:"
  echo "     git add $PKG $LOCK $CONF $CARGO && git commit -m \"chore: bump version to v$VERSION\""
  echo "     git tag v$VERSION && git push origin HEAD && git push origin v$VERSION"
  echo "⚠️  Sin --tag no se dispara GitHub Actions porque release.yml solo escucha tags v*."
fi
