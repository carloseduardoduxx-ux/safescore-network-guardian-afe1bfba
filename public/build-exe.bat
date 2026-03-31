@echo off
REM ========================================
REM  SafeScore Agent - Build .exe (Windows)
REM  Desenvolvido por Compueletro
REM ========================================
REM
REM  Requisitos:
REM    1. Python 3.8+ instalado (python.org)
REM    2. Executar este script na mesma pasta do safescore-agent.py
REM
REM  Uso:
REM    Dê duplo clique neste arquivo ou execute no CMD:
REM    build-exe.bat
REM ========================================

echo.
echo ===================================
echo  SafeScore Agent - Gerando .exe
echo  Compueletro
echo ===================================
echo.

REM Instalar dependencias
echo [1/3] Instalando dependencias...
pip install pyinstaller requests 2>nul
if errorlevel 1 (
    python -m pip install pyinstaller requests
)

REM Gerar .exe
echo [2/3] Gerando executavel...
pyinstaller --onefile --name SafeScoreAgent --clean --noconfirm safescore-agent.py

echo.
echo [3/3] Concluido!
echo.
echo O arquivo SafeScoreAgent.exe foi gerado em:
echo   dist\SafeScoreAgent.exe
echo.
echo Uso:
echo   SafeScoreAgent.exe --company "Nome da Empresa" --range 192.168.1.0/24
echo.
pause
