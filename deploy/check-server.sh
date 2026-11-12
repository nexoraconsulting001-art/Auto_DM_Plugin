#!/usr/bin/env bash
# Read-only. Lists what is listening on the server and which ports Docker publishes,
# then says whether the port you want (default 8150) is free. Changes nothing.
set -u
want=${1:-8150}
echo "Listening TCP ports:"
ss -ltnH | awk '{print $4}' | sed 's/.*://' | sort -n | uniq | tr '\n' ' '
echo; echo
echo "Docker containers and published ports:"
docker ps --format '  {{.Names}}  {{.Ports}}' 2>/dev/null || echo "  (docker ps not allowed for this user)"
echo
echo "Caddy site files:"
ls /etc/caddy/sites 2>/dev/null | sed 's/^/  /' || echo "  (none found)"
echo
case " 8000 8080 8100 8110 8120 8130 8140 " in *" $want "*) echo "Port $want is reserved for another project. Pick another."; exit 1;; esac
if ss -ltnH "( sport = :$want )" | grep -q . || docker ps --format '{{.Ports}}' 2>/dev/null | grep -q ":$want->"; then
  echo "Port $want is IN USE. Pick another."
  exit 1
fi
echo "Port $want is free."
