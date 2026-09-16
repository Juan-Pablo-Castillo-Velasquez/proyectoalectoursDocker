"""
Tests del flujo de verificación de cuenta por código de 6 dígitos (OTP) --
Fase de mejora de correos/registro de esta sesión.

Antes de esta suite, la verificación por código (generate_verification_code,
hash_verification_code, verify_verification_code en app/core/security.py, y
verify_email_code/regenerar_codigo_verificacion en app/services/auth_service.py)
tenía CERO cobertura automatizada -- el único archivo con "verification" en
el nombre (test_email_verification.py) no era un test de pytest: era un
script manual que le pegaba por HTTP a un servidor corriendo en
localhost:8000, ya roto contra el contrato actual de la API (esperaba que
`/auth/register` expusiera `verification_token`, algo que la ruta actual
nunca hace a propósito), y por eso el propio CI nunca lo ejecutaba -- se
eliminó en la reorganización de testing de esta sesión, superseded por
esta suite.

La fixture `db` base (SQLite en memoria) vive en conftest.py, compartida
por toda la suite; acá se extiende para sembrar el rol 'cliente' que
register_user()/verify_email_code() asumen que ya existe.
"""

from datetime import UTC, datetime, timedelta

import pytest

from app.core.security import (
    generate_verification_code,
    hash_verification_code,
    verify_verification_code,
)
from app.models.auth_model import Rol, UsuarioRol
from app.models.user_model import Usuario
from app.services.auth_service import (
    CODIGO_VERIFICACION_MAX_INTENTOS,
    _generar_y_guardar_codigo,
    regenerar_codigo_verificacion,
    register_user,
    verify_email_code,
)


@pytest.fixture
def db(db):
    """Extiende la fixture `db` de conftest.py sembrando el rol 'cliente'
    (id_rol=2) -- en producción lo siembra la migración
    2b118189cd9d_seed_roles_iniciales.py; acá se replica a mano porque
    register_user()/verify_email_code() asumen que ese rol ya existe."""
    db.add(Rol(id_rol=2, nombre_rol="cliente"))
    db.commit()
    return db


def _crear_usuario_no_verificado(db, con_codigo=True):
    user = Usuario(
        username="viajero_test",
        correo_electronico="viajero@test.com",
        password_hash="hash-no-relevante-para-este-test",
        activo=True,
        verificado=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(UsuarioRol(id_usuario=user.id_usuario, id_rol=2))
    db.commit()

    codigo = None
    if con_codigo:
        codigo = _generar_y_guardar_codigo(db, user)
    return user, codigo


class TestGenerarYVerificarCodigo:
    """app/core/security.py -- funciones puras, sin base de datos."""

    def test_generate_verification_code_son_6_digitos(self):
        for _ in range(20):
            codigo = generate_verification_code()
            assert isinstance(codigo, str)
            assert len(codigo) == 6
            assert codigo.isdigit()

    def test_hash_y_verify_roundtrip(self):
        codigo = "042917"
        codigo_hash = hash_verification_code(codigo)
        assert codigo_hash != codigo  # nunca se guarda en texto plano
        assert verify_verification_code(codigo, codigo_hash) is True

    def test_verify_rechaza_codigo_incorrecto(self):
        codigo_hash = hash_verification_code("042917")
        assert verify_verification_code("000000", codigo_hash) is False


class TestVerifyEmailCode:
    """app/services/auth_service.py::verify_email_code -- el endpoint
    POST /auth/verify-email-code (auth_route.py) es un wrapper delgado
    sobre esta función, así que probarla acá cubre esa ruta también."""

    def test_codigo_correcto_verifica_la_cuenta_y_devuelve_tokens(self, db):
        user, codigo = _crear_usuario_no_verificado(db)

        resultado = verify_email_code(db, "viajero@test.com", codigo)

        assert "error" not in resultado
        assert resultado["access_token"]
        assert resultado["refresh_token"]
        assert resultado["verificado"] is True
        assert resultado["roles"] == ["cliente"]

        db.refresh(user)
        assert user.verificado is True
        # El hash/expiración/intentos se limpian tras verificar -- no deben
        # quedar reutilizables ni consultables.
        assert user.codigo_verificacion_hash is None
        assert user.codigo_verificacion_expira is None
        assert user.intentos_verificacion == 0

    def test_codigo_incorrecto_incrementa_intentos_sin_verificar(self, db):
        user, _codigo = _crear_usuario_no_verificado(db)

        resultado = verify_email_code(db, "viajero@test.com", "000000")

        assert "error" in resultado
        assert "incorrecto" in resultado["error"].lower()
        db.refresh(user)
        assert user.intentos_verificacion == 1
        assert user.verificado is False

    def test_agotar_intentos_bloquea_y_exige_codigo_nuevo(self, db):
        user, codigo = _crear_usuario_no_verificado(db)

        for _ in range(CODIGO_VERIFICACION_MAX_INTENTOS):
            resultado = verify_email_code(db, "viajero@test.com", "000000")

        assert "Demasiados intentos" in resultado["error"]

        # Ni siquiera con el código correcto pasa mientras no se pida uno
        # nuevo -- si esto fallara, el límite de intentos no protegería nada
        # (bastaría con seguir probando el código real, que no cambia).
        resultado_con_codigo_real = verify_email_code(db, "viajero@test.com", codigo)
        assert "Demasiados intentos" in resultado_con_codigo_real["error"]

    def test_codigo_expirado_es_rechazado(self, db):
        user, codigo = _crear_usuario_no_verificado(db)
        # Simula que el código se generó hace más de 15 minutos.
        user.codigo_verificacion_expira = datetime.now(UTC) - timedelta(minutes=1)
        db.commit()

        resultado = verify_email_code(db, "viajero@test.com", codigo)

        assert "expiró" in resultado["error"].lower()

    def test_cuenta_ya_verificada_devuelve_tokens_en_vez_de_error(self, db):
        """Un segundo intento de verificación (doble clic, o verificar por
        el enlace y luego volver al modal del código) no debe romperse --
        debe loguear a la persona igual, no repetir el error genérico."""
        user, codigo = _crear_usuario_no_verificado(db)
        primer_intento = verify_email_code(db, "viajero@test.com", codigo)
        assert "error" not in primer_intento

        segundo_intento = verify_email_code(db, "viajero@test.com", "cualquier-cosa")

        assert "error" not in segundo_intento
        assert segundo_intento["access_token"]
        assert segundo_intento["verificado"] is True

    def test_correo_inexistente_no_filtra_informacion(self, db):
        resultado = verify_email_code(db, "no-existe@test.com", "123456")
        assert resultado["error"] == "Código incorrecto o expirado"

    def test_usuario_sin_codigo_generado_devuelve_error_generico(self, db):
        user, _codigo = _crear_usuario_no_verificado(db, con_codigo=False)
        resultado = verify_email_code(db, "viajero@test.com", "123456")
        assert resultado["error"] == "Código incorrecto o expirado"


class TestRegenerarCodigoVerificacion:
    def test_regenerar_produce_un_codigo_distinto_y_resetea_intentos(self, db):
        user, codigo_original = _crear_usuario_no_verificado(db)
        # Se "gastan" intentos antes de pedir uno nuevo.
        verify_email_code(db, "viajero@test.com", "000000")
        db.refresh(user)
        assert user.intentos_verificacion == 1

        codigo_nuevo = regenerar_codigo_verificacion(db, user)

        assert codigo_nuevo != codigo_original
        db.refresh(user)
        assert user.intentos_verificacion == 0
        # El código viejo ya no debe servir.
        resultado_codigo_viejo = verify_email_code(db, "viajero@test.com", codigo_original)
        assert "error" in resultado_codigo_viejo
        # El nuevo sí.
        resultado_codigo_nuevo = verify_email_code(db, "viajero@test.com", codigo_nuevo)
        assert "error" not in resultado_codigo_nuevo


class TestRegisterUser:
    def test_register_user_genera_codigo_y_no_lo_expone_en_texto_plano_reutilizable(self, db):
        resultado = register_user(db, "nuevo_viajero", "nuevo@test.com", "PasswordSegura123")

        assert "error" not in resultado
        assert resultado["verification_code"]
        assert len(resultado["verification_code"]) == 6
        assert resultado["access_token"]

        user = db.query(Usuario).filter(Usuario.correo_electronico == "nuevo@test.com").first()
        assert user is not None
        assert user.verificado is False

        # El código que devolvió register_user debe ser el mismo que quedó
        # hasheado en la base -- si no, el correo de bienvenida mandaría un
        # código que la propia base rechazaría.
        confirmacion = verify_email_code(db, "nuevo@test.com", resultado["verification_code"])
        assert "error" not in confirmacion

    def test_register_user_rechaza_correo_duplicado(self, db):
        register_user(db, "primero", "duplicado@test.com", "PasswordSegura123")
        resultado = register_user(db, "segundo", "duplicado@test.com", "OtraPassword456")
        assert resultado["error"] == "El correo electrónico ya está registrado"

    def test_register_user_rechaza_username_duplicado(self, db):
        register_user(db, "mismo_user", "uno@test.com", "PasswordSegura123")
        resultado = register_user(db, "mismo_user", "dos@test.com", "OtraPassword456")
        assert resultado["error"] == "El nombre de usuario ya existe"
