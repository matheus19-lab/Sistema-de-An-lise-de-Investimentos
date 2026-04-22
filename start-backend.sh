#!/bin/bash
# start-backend.sh - Inicia o backend Flask do InvestIA

echo "============================================"
echo "  InvestIA - Iniciando Backend Flask"
echo "============================================"

cd "$(dirname "$0")/backend"

# Cria venv se não existir
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual Python..."
    python3 -m venv venv
fi

# Ativa venv
source venv/bin/activate

# Instala dependências
echo "Instalando dependências..."
pip install -r requirements.txt --quiet

# Inicia servidor
echo ""
echo "✅ Backend rodando em: http://localhost:5000"
echo "   Pressione Ctrl+C para parar."
echo ""
python app.py
