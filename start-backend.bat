@echo off
echo ============================================
echo   InvestIA - Iniciando Backend Flask
echo ============================================

cd /d "%~dp0backend"

:: Verifica se o venv existe
if not exist "venv\Scripts\activate" (
    echo Criando ambiente virtual Python...
    python -m venv venv
)

:: Ativa o venv
call venv\Scripts\activate

:: Instala dependências
echo Instalando dependencias...
pip install -r requirements.txt --quiet

:: Inicia Flask
echo.
echo Backend rodando em: http://localhost:5000
echo Pressione Ctrl+C para parar.
echo.
python app.py

pause
