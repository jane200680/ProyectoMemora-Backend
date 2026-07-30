#!/usr/bin/env bash
# Genera/actualiza /etc/nginx/conf.d/cloudflare.conf con los rangos de IP de
# Cloudflare (https://www.cloudflare.com/ips/) y hace dos cosas:
#
#   1. set_real_ip_from + real_ip_header CF-Connecting-IP:
#      le dice a Nginx que SOLO confíe en el header CF-Connecting-IP cuando
#      la conexión entrante viene realmente de un rango de Cloudflare. Así,
#      $remote_addr (y por lo tanto X-Forwarded-For / X-Real-IP que Nginx
#      reenvía al backend) queda con la IP real del visitante y no puede
#      falsificarse enviando encabezados falsos directamente al servidor.
#
#   2. allow <rango> / deny all:
#      además de lo anterior, rechaza de plano cualquier conexión que no
#      venga de Cloudflare, para que nadie pueda pegarle directo a la IP de
#      la EC2 saltándose Cloudflare (WAF, rate limit de Cloudflare, etc.).
#
# Pensado para correr también por cron/systemd timer, ya que Cloudflare
# actualiza sus rangos de vez en cuando. Es idempotente: si no hay cambios,
# no toca nginx.
#
# Uso:
#   sudo ./cloudflare-nginx.sh

set -euo pipefail

OUT=/etc/nginx/conf.d/cloudflare.conf
TMP="$(mktemp)"

{
  echo "# Generado automáticamente por cloudflare-nginx.sh — no editar a mano."
  echo "# Fuente: https://www.cloudflare.com/ips/"
  echo "# Última actualización: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo

  for url in https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6; do
    curl -fsS "$url" | while IFS= read -r cidr; do
      [ -n "$cidr" ] && echo "set_real_ip_from $cidr;"
    done
  done

  echo
  echo "real_ip_header CF-Connecting-IP;"
  echo "real_ip_recursive on;"
  echo

  for url in https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6; do
    curl -fsS "$url" | while IFS= read -r cidr; do
      [ -n "$cidr" ] && echo "allow $cidr;"
    done
  done
  echo "deny all;"
} > "$TMP"

if [ ! -s "$TMP" ] || ! grep -q "^allow " "$TMP"; then
  echo "No se pudo descargar la lista de IPs de Cloudflare (revisa conectividad). No se modificó nginx." >&2
  rm -f "$TMP"
  exit 1
fi

if ! diff -q "$TMP" "$OUT" >/dev/null 2>&1; then
  mv "$TMP" "$OUT"
  nginx -t
  systemctl reload nginx
  echo "cloudflare.conf actualizado y nginx recargado."
else
  rm -f "$TMP"
  echo "Sin cambios en los rangos de Cloudflare."
fi
