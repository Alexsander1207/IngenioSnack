"""
Genera hashes bcrypt para los usuarios seed de desarrollo.

Uso:
    cd backend
    .venv\\Scripts\\python.exe scripts/generate_dev_password_hash.py

Salida:
    Hashes bcrypt e instrucciones SQL UPDATE para reemplazar los placeholders
    en public.usuarios luego de ejecutar database/seed.sql en Supabase.

Nunca usar estas contraseñas en produccion.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.security import get_password_hash

DEV_USERS = [
    {
        "id": "00000000-0000-4000-8000-000000000001",
        "correo": "admin.dev@ingeniosnack.local",
        "rol": "ADMIN",
        "password": "admin123",
    },
    {
        "id": "00000000-0000-4000-8000-000000000002",
        "correo": "estudiante.dev@ingeniosnack.local",
        "rol": "ESTUDIANTE",
        "password": "estudiante123",
    },
]


def main() -> None:
    print("=" * 64)
    print("IngenioSnack — Hashes bcrypt para usuarios seed de desarrollo")
    print("=" * 64)
    print()
    print("ADVERTENCIA: Solo para entorno de desarrollo.")
    print("Nunca reutilizar estas contraseñas en produccion.")
    print()

    sql_statements: list[str] = []

    for user in DEV_USERS:
        hashed = get_password_hash(user["password"])
        print(f"Usuario : {user['correo']} ({user['rol']})")
        print(f"Password: {user['password']}")
        print(f"Hash    : {hashed}")
        print()
        sql_statements.append(
            f"UPDATE public.usuarios\n"
            f"SET hashed_password = '{hashed}'\n"
            f"WHERE id = '{user['id']}';"
        )

    print("-" * 64)
    print("SQL UPDATE — Ejecutar en Supabase SQL Editor despues del seed:")
    print("-" * 64)
    print()
    for stmt in sql_statements:
        print(stmt)
        print()


if __name__ == "__main__":
    main()
