@echo off
REM =============================================
REM  SafeScore Agent - Build .exe com Nuitka
REM  Desenvolvido por Compueletro
REM =============================================
REM
REM  Requisitos:
REM    1. Python 3.8+ instalado (python.org)
REM    2. Compilador C instalado (MinGW ou Visual Studio Build Tools)
REM       - Opcao facil: choco install mingw  (via Chocolatey)
REM       - Ou instale Visual Studio Build Tools (workload C++)
REM    3. Executar este script na mesma pasta do safescore-agent.py
REM
REM  Uso:
REM    Dê duplo clique neste arquivo ou execute no CMD:
REM    build-exe.bat
REM =============================================

echo.
echo ===================================
echo  SafeScore Agent - Build com Nuitka
echo  Compueletro
echo ===================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado! Instale em python.org
    pause
    exit /b 1
)

REM Instalar dependencias
echo [1/4] Instalando dependencias...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install nuitka requests ordered-set zstandard

REM Verificar compilador C
echo [2/4] Verificando compilador C...
where gcc >nul 2>&1
if errorlevel 1 (
    where cl >nul 2>&1
    if errorlevel 1 (
        echo.
        echo [AVISO] Nenhum compilador C encontrado.
        echo   Instale uma das opcoes:
        echo     - Chocolatey: choco install mingw
        echo     - Visual Studio Build Tools com workload C++
        echo.
        echo   Tentando continuar com download automatico do Nuitka...
        echo.
    )
)

REM Gerar .exe com Nuitka
echo [3/4] Compilando com Nuitka (pode demorar alguns minutos)...
python -m nuitka ^
    --onefile ^
    --output-filename=SafeScoreAgent.exe ^
    --output-dir=dist ^
    --remove-output ^
    --assume-yes-for-downloads ^
    --include-module=requests ^
    --include-module=socket ^
    --include-module=json ^
    --include-module=subprocess ^
    --include-module=platform ^
    --company-name=Compueletro ^
    --product-name="SafeScore Network Agent" ^
    --file-version=1.0.0 ^
    --product-version=1.0.0 ^
    --file-description="SafeScore Network Agent - Scanner de Rede" ^
    safescore-agent.py

if errorlevel 1 (
    echo.
    echo [ERRO] Falha na compilacao. Verifique se o compilador C esta instalado.
    echo   Tente: choco install mingw
    pause
    exit /b 1
)

echo.
echo [4/4] Concluido com sucesso!
echo.
echo O executavel foi gerado em:
echo   dist\SafeScoreAgent.exe
echo.
echo Uso:
echo   SafeScoreAgent.exe --company "Nome da Empresa" --range 192.168.1.0/24
echo.
echo Notas:
echo   - O .exe gerado pelo Nuitka e mais rapido e estavel que PyInstaller
echo   - Nao requer Python instalado na maquina do cliente
echo   - Requer privilegios de administrador para scan de rede
echo.
pause
