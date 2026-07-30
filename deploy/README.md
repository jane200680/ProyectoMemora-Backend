# Endurecer Nginx contra bypass de Cloudflare

Contexto: la app está detrás de Cloudflare (proxied) + Nginx en la EC2 (ver
`10GuiaSSL.md` en la raíz del repo de documentación). El rate limiter del
backend (`src/middleware/rateLimiter.ts`) ya usa el header `CF-Connecting-IP`
para identificar usuarios, porque **Cloudflare garantiza que ese header no se
puede falsificar** (lo sobrescribe en su borde). Se verificó en producción
que intentar enviarlo manualmente es bloqueado por el WAF de Cloudflare con
403.

Pero eso solo protege si el tráfico pasa por Cloudflare. El Security Group
actual de la EC2 tiene 80/443 abiertos a `0.0.0.0/0` (cualquiera), así que
alguien podría conectarse **directo a la IP pública de la EC2**, saltándose
Cloudflare, y ahí sí podría poner cualquier valor en `CF-Connecting-IP`
porque Nginx lo reenviaría tal cual. Los scripts de esta carpeta cierran esa
puerta en dos capas independientes (aplica al menos la 1; la 2 es opcional
pero recomendada).

## 1. Nginx: solo confiar/aceptar tráfico de Cloudflare (obligatorio)

`cloudflare-nginx.sh` genera `/etc/nginx/conf.d/cloudflare.conf` con los
rangos de IP de Cloudflare y:

- `set_real_ip_from` + `real_ip_header CF-Connecting-IP;`: le dice a Nginx
  que solo confíe en ese header cuando la conexión entrante viene realmente
  de un rango de Cloudflare (verificado por IP de socket TCP, no
  falsificable).
- `allow <rango>; ... deny all;`: rechaza cualquier conexión que no venga de
  Cloudflare, directo en Nginx.

### Pasos (por SSH en la EC2, con sudo)

```bash
scp backend/deploy/cloudflare-nginx.sh tu-usuario@tu-ec2:~/
ssh tu-usuario@tu-ec2
chmod +x cloudflare-nginx.sh
sudo ./cloudflare-nginx.sh
```

Deberías ver `cloudflare.conf actualizado y nginx recargado.`

Después, edita tu `/etc/nginx/sites-available/memora` (el que armaste
siguiendo `10GuiaSSL.md`) y agrega esta línea dentro de **cada** bloque
`server { ... }` que tengas (el de `listen 80` y el de `listen 443 ssl` que
agregó certbot):

```nginx
include /etc/nginx/conf.d/cloudflare.conf;
```

Mira `nginx-memora.conf.example` en esta misma carpeta para ver dónde va
exactamente. Luego:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Mantenerlo actualizado (Cloudflare cambia sus rangos de vez en cuando)

Agrega un cron semanal:

```bash
sudo crontab -e
# agrega:
0 4 * * 1 /ruta/a/cloudflare-nginx.sh >> /var/log/cloudflare-nginx.log 2>&1
```

## 2. AWS Security Group: mismo filtro a nivel de red (opcional, recomendado)

Esto es defensa en profundidad: aunque Nginx ya rechace lo que no venga de
Cloudflare, restringir el Security Group evita que ese tráfico "de más"
(escaneos, bots, intentos de DDoS directos) llegue siquiera a tocar la EC2.

Requiere [AWS CLI](https://docs.aws.amazon.com/cli/) configurado
(`aws configure`) con permisos sobre el Security Group.

```bash
# 1. Encuentra el Security Group ID de tu EC2 (o en la consola de AWS)
aws ec2 describe-instances --filters "Name=ip-address,Values=TU_IP_PUBLICA" \
  --query "Reservations[].Instances[].SecurityGroups"

# 2. Dry-run (no cambia nada, solo muestra qué haría)
./aws-security-group-cloudflare.sh sg-xxxxxxxxxxxx

# 3. Aplicar de verdad
./aws-security-group-cloudflare.sh sg-xxxxxxxxxxxx --apply
```

Esto quita la regla `0.0.0.0/0` en los puertos 80/443 y agrega una regla por
cada rango de Cloudflare (IPv4 e IPv6). Vuelve a correrlo (con `--apply`)
cada vez que Cloudflare actualice sus rangos, o prográmalo también por cron
si prefieres automatizarlo del todo.

**Importante**: no toques el puerto 22 (SSH) con este script — solo afecta
80/443. Verifica que tu acceso SSH siga funcionando antes de cerrar la
sesión actual, por si acaso.

## Cómo verificar que quedó bien

Desde tu máquina (no desde la EC2):

```bash
# Debe responder normal (pasa por Cloudflare)
curl -I https://tu-dominio.com

# Debe fallar / no conectar (te saltas Cloudflare, pegándole directo a la EC2)
curl -I --max-time 5 http://IP_PUBLICA_DE_LA_EC2
```

Si el segundo comando también responde, el Security Group y/o el `allow/deny`
de Nginx todavía no están aplicados correctamente.
