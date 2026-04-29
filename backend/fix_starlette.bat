@echo off
echo.
echo ===== SafePrayag — Targeted Starlette Fix =====
echo.

echo Fixing starlette only (no numpy rebuild)...
pip install "starlette==0.41.3" --force-reinstall --no-deps

echo.
echo Fixing fastapi only...
pip install "fastapi==0.115.12" --force-reinstall --no-deps

echo.
echo Removing python-jwt conflict...
pip uninstall python-jwt jwcrypto -y 2>nul

echo.
echo Verifying...
python -c "import starlette; print('starlette:', starlette.__version__)"
python -c "import fastapi;   print('fastapi:  ', fastapi.__version__)"
python -c "import jwt;       t=jwt.encode({'x':1},'k',algorithm='HS256'); d=jwt.decode(t,'k',algorithms=['HS256']); print('PyJWT OK:', jwt.__version__)"

echo.
echo ===== Done! Restart the backend now =====
echo.
pause
