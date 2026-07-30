#!/usr/bin/env bash
# Opcional (defensa en profundidad además del fix de Nginx): restringe el
# Security Group de la EC2 para que los puertos 80/443 solo acepten tráfico
# desde los rangos de IP de Cloudflare, en vez de 0.0.0.0/0 (cualquiera).
#
# Requiere AWS CLI configurado (`aws configure`) con permisos sobre el
# Security Group indicado.
#
# Por defecto corre en modo DRY-RUN (solo imprime lo que haría). Pasa
# --apply para ejecutar los cambios de verdad.
#
# Uso:
#   ./aws-security-group-cloudflare.sh sg-xxxxxxxxxxxx            # dry-run
#   ./aws-security-group-cloudflare.sh sg-xxxxxxxxxxxx --apply    # aplica

set -euo pipefail

SG_ID="${1:-}"
APPLY="${2:-}"

if [ -z "$SG_ID" ]; then
  echo "Uso: $0 <security-group-id> [--apply]" >&2
  exit 1
fi

RUN=echo
if [ "$APPLY" = "--apply" ]; then
  RUN=eval
fi

echo "== Revocando reglas existentes 0.0.0.0/0 en 80/443 (si existen) =="
for port in 80 443; do
  $RUN "aws ec2 revoke-security-group-ingress --group-id '$SG_ID' --protocol tcp --port $port --cidr 0.0.0.0/0 2>/dev/null || true"
done

echo "== Autorizando rangos de Cloudflare (IPv4) en 80/443 =="
for cidr in $(curl -fsS https://www.cloudflare.com/ips-v4); do
  for port in 80 443; do
    $RUN "aws ec2 authorize-security-group-ingress --group-id '$SG_ID' --protocol tcp --port $port --cidr '$cidr' 2>/dev/null || true"
  done
done

echo "== Autorizando rangos de Cloudflare (IPv6) en 80/443 =="
for cidr in $(curl -fsS https://www.cloudflare.com/ips-v6); do
  for port in 80 443; do
    $RUN "aws ec2 authorize-security-group-ingress --group-id '$SG_ID' --protocol tcp --port $port --ipv6-cidr '$cidr' 2>/dev/null || true"
  done
done

if [ "$APPLY" != "--apply" ]; then
  echo
  echo "Esto fue un DRY-RUN, no se cambió nada. Vuelve a correr con --apply para aplicar de verdad."
fi
