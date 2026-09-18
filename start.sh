#!/bin/bash
# Script de inicialização do servidor Fila (systemd chama este arquivo).
# Deve ficar em /opt/fila/start.sh, com permissão de execução (chmod +x).
set -e
cd /opt/fila
exec npx next start -p "${PORT:-3001}" -H 127.0.0.1
