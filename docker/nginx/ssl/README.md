# SSL/TLS — PDMS Home-Spital

## Development (Self-Signed)

```bash
cd docker/nginx/ssl
chmod +x generate-certs.sh
./generate-certs.sh
```

Generiert:
- `pdms.crt` — Self-Signed Zertifikat (365 Tage, SAN: localhost, pdms.local, 192.168.1.4)
- `pdms.key` — RSA 4096-bit Private Key
- `dhparam.pem` — DH-Parameter für Perfect Forward Secrecy

## Zugriff

```
HTTP:  http://localhost:8090  → Redirect auf HTTPS
HTTPS: https://localhost:8443 → Produktionsnah mit TLS
```

Browser-Warnung bei Self-Signed Zertifikaten ist normal.

## Produktion (Let's Encrypt)

```bash
# Certbot im Docker-Container:
docker run --rm -v certbot-webroot:/var/www/certbot \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d pdms.example.ch \
  --agree-tos -m admin@example.ch

# Zertifikate kopieren:
cp /etc/letsencrypt/live/pdms.example.ch/fullchain.pem docker/nginx/ssl/pdms.crt
cp /etc/letsencrypt/live/pdms.example.ch/privkey.pem docker/nginx/ssl/pdms.key
```

Certbot-Renewal per Cronjob:
```bash
0 3 * * * certbot renew --quiet && docker exec pdms-nginx nginx -s reload
```

## Security-Headers

| Header | Wert | Standard |
|--------|------|----------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | OWASP |
| X-Frame-Options | SAMEORIGIN | OWASP |
| X-Content-Type-Options | nosniff | OWASP |
| X-XSS-Protection | 1; mode=block | Legacy |
| Referrer-Policy | strict-origin-when-cross-origin | OWASP |
| Content-Security-Policy | default-src 'self'; ... | OWASP |
| Permissions-Policy | camera=(), microphone=(), ... | W3C |

## TLS-Konfiguration

- **Protokolle:** TLS 1.2, TLS 1.3 (kein TLS 1.0/1.1)
- **Cipher-Suites:** Nur AEAD (AES-GCM, ChaCha20-Poly1305)
- **PFS:** DH-Parameter 2048-bit
- **Session:** Cache 10m, keine Tickets
- **OCSP Stapling:** Vorbereitet (aktivieren mit CA-Zertifikat)

## Compliance

- **IEC 62304:** Verschlüsselte Datenübertragung für Medizinprodukte-Software
- **nDSG (CH):** Transport-Verschlüsselung für Gesundheitsdaten
- **OWASP:** Security-Headers gemäss Best Practices
