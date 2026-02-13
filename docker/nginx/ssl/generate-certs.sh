#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# PDMS Home-Spital — SSL-Zertifikate generieren
# Erzeugt selbstsignierte Zertifikate für Development/Staging.
# Für Produktion: Let's Encrypt via Certbot (siehe unten).
#
# Verwendung:
#   chmod +x generate-certs.sh && ./generate-certs.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}"
DAYS=365
DOMAIN="${PDMS_DOMAIN:-pdms.local}"
SUBJECT="/C=CH/ST=Bern/L=Bern/O=PDMS Home-Spital/OU=IT/CN=${DOMAIN}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  PDMS SSL-Zertifikate — Self-Signed (Development)       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Domain:      ${DOMAIN}"
echo "  Gültigkeit:  ${DAYS} Tage"
echo "  Ausgabe:     ${CERT_DIR}/"
echo ""

# ── 1. RSA Private Key (4096-bit) ──────────────────────────────
echo "→ Generiere Private Key (4096-bit RSA)..."
openssl genrsa -out "${CERT_DIR}/pdms.key" 4096 2>/dev/null

# ── 2. CSR (Certificate Signing Request) ───────────────────────
echo "→ Generiere CSR..."
openssl req -new \
    -key "${CERT_DIR}/pdms.key" \
    -out "${CERT_DIR}/pdms.csr" \
    -subj "${SUBJECT}" \
    2>/dev/null

# ── 3. Self-Signed Certificate mit SAN ─────────────────────────
echo "→ Generiere Self-Signed Zertifikat mit SAN..."
cat > "${CERT_DIR}/san.cnf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C  = CH
ST = Bern
L  = Bern
O  = PDMS Home-Spital
OU = IT
CN = ${DOMAIN}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = *.${DOMAIN}
DNS.3 = localhost
IP.1  = 127.0.0.1
IP.2  = 192.168.1.4
EOF

openssl x509 -req \
    -in "${CERT_DIR}/pdms.csr" \
    -signkey "${CERT_DIR}/pdms.key" \
    -out "${CERT_DIR}/pdms.crt" \
    -days "${DAYS}" \
    -sha256 \
    -extfile "${CERT_DIR}/san.cnf" \
    -extensions v3_req \
    2>/dev/null

# ── 4. DH-Parameter (für Perfect Forward Secrecy) ──────────────
if [ ! -f "${CERT_DIR}/dhparam.pem" ]; then
    echo "→ Generiere DH-Parameter (2048-bit, kann 1-2 Min. dauern)..."
    openssl dhparam -out "${CERT_DIR}/dhparam.pem" 2048 2>/dev/null
else
    echo "→ DH-Parameter existieren bereits, überspringe."
fi

# ── 5. Aufräumen ───────────────────────────────────────────────
rm -f "${CERT_DIR}/pdms.csr" "${CERT_DIR}/san.cnf"

# ── 6. Berechtigungen setzen ───────────────────────────────────
chmod 644 "${CERT_DIR}/pdms.crt"
chmod 600 "${CERT_DIR}/pdms.key"
chmod 644 "${CERT_DIR}/dhparam.pem"

echo ""
echo "✔ Zertifikate erfolgreich erstellt:"
echo "  Zertifikat:    ${CERT_DIR}/pdms.crt"
echo "  Private Key:   ${CERT_DIR}/pdms.key"
echo "  DH-Parameter:  ${CERT_DIR}/dhparam.pem"
echo ""
echo "Fingerprint:"
openssl x509 -in "${CERT_DIR}/pdms.crt" -noout -fingerprint -sha256
echo ""
echo "─────────────────────────────────────────────────────────"
echo "Für Produktion → Let's Encrypt mit Certbot verwenden:"
echo "  certbot certonly --webroot -w /var/www/certbot \\"
echo "    -d ${DOMAIN} --agree-tos -m admin@${DOMAIN}"
echo "─────────────────────────────────────────────────────────"
