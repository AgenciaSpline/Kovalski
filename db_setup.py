import subprocess
import sys
import os

def run_cmd(cmd):
    print(f"Executando: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print("STDOUT:")
    print(res.stdout)
    if res.stderr:
        print("STDERR:")
        print(res.stderr)
    return res.returncode

# Forçar leitura do arquivo .env
if os.path.exists(".env"):
    with open(".env") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key] = val.strip('"')

# Executar o push do banco com reset forçado por padrão para aceitar as mudanças estruturais
print("Sincronizando o banco de dados (Forçando reset)...")
code = run_cmd("npx prisma db push --force-reset")
if code == 0:
    # Executar o seed
    print("Populando o banco de dados...")
    run_cmd("npx prisma db seed")
else:
    print("Erro ao sincronizar o banco de dados.")
    sys.exit(code)
