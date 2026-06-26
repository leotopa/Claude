@echo off
echo ========================================
echo        RECIBOO - Iniciar App
echo ========================================
echo.

cd /d C:\Users\workl\Claude

echo [1/3] A buscar atualizacoes do codigo...
git pull origin claude/reciboo-fullstack-setup-umqkoc
echo.

echo [2/3] A entrar na pasta reciboo...
cd reciboo
echo.

echo [3/3] A iniciar o servidor...
echo Quando aparecer "Ready", abre o browser em: http://localhost:3000
echo Para parar o servidor, fecha esta janela.
echo.
npm run dev
