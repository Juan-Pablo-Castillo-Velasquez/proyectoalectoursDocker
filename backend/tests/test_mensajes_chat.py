"""
Chat privado admin<->cliente (mensaje_chat_route.py /
mensaje_chat_repository.py) -- un solo hilo continuo por cliente (no uno
por reserva), bandeja compartida (cualquier admin ve/responde cualquier
hilo), sin websockets (solo polling).

No existe ningún patrón de tests async ni pytest-asyncio en esta suite
(confirmado por grep antes de escribir este archivo) -- las rutas async
(envío de mensajes, que valida/sube la imagen) se prueban con
asyncio.run() dentro de tests sync normales, mismo criterio que el resto
de backend/tests/.

La fixture `db` (SQLite en memoria, una por test) vive en conftest.py,
compartida por toda la suite.
"""

import asyncio
import io

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.core.security import generate_token_pair
from app.models.cliente_model import Cliente
from app.models.mensaje_chat_model import MensajeChat
from app.models.user_model import Usuario
from app.routes import mensaje_chat_route


def _crear_cliente_con_usuario(db, cedula="1000000001"):
    cliente = Cliente(nombre="Cliente", apellido="Test", cedula=cedula, correo=f"{cedula}@test.com")
    db.add(cliente)
    db.commit()

    usuario = Usuario(
        username=f"cliente_{cedula}",
        correo_electronico=f"{cedula}@test.com",
        password_hash="hash-no-relevante-para-este-test",
        id_cliente=cliente.id_cliente,
        activo=True,
        verificado=True,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return cliente, usuario


def _crear_admin(db, username="admin_test"):
    """Cuenta admin -- el rol vive en usuarios_roles (auth_model.py), no en
    esta tabla; para las rutas que llaman require_admin directamente (sin
    decodificar un JWT) alcanza con pasar su id_usuario como admin_id, así
    que este helper no necesita sembrar ningún rol."""
    usuario = Usuario(
        username=username,
        correo_electronico=f"{username}@test.com",
        password_hash="hash-no-relevante-para-este-test",
        activo=True,
        verificado=True,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def _crear_empleado_sin_cliente(db, username="empleado_test"):
    """Cuenta sin rol admin y sin perfil de cliente vinculado -- caso real
    de un empleado que no debería poder usar ninguno de los dos lados del
    chat."""
    usuario = Usuario(
        username=username,
        correo_electronico=f"{username}@test.com",
        password_hash="hash-no-relevante-para-este-test",
        activo=True,
        verificado=True,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def _token_bearer(id_usuario: int, roles: list[str]) -> str:
    return f"Bearer {generate_token_pair(id_usuario, roles)['access_token']}"


class TestEnvioDeMensajes:
    def test_cliente_envia_mensaje_de_texto_en_su_propio_hilo(self, db):
        _cliente, usuario = _crear_cliente_con_usuario(db)

        resultado = asyncio.run(
            mensaje_chat_route.enviar_como_cliente(
                contenido="Hola, tengo una duda con mi reserva", imagen=None, db=db, current_user=usuario
            )
        )

        assert resultado["contenido"] == "Hola, tengo una duda con mi reserva"
        assert resultado["remitente_tipo"] == "cliente"
        assert resultado["id_usuario_remitente"] == usuario.id_usuario

    def test_admin_envia_mensaje_al_hilo_de_un_cliente_especifico(self, db):
        cliente, _usuario = _crear_cliente_con_usuario(db)
        admin = _crear_admin(db)

        resultado = asyncio.run(
            mensaje_chat_route.enviar_como_admin(
                id_cliente=cliente.id_cliente,
                contenido="Claro, dime en qué te ayudo",
                imagen=None,
                db=db,
                admin_id=admin.id_usuario,
            )
        )

        assert resultado["contenido"] == "Claro, dime en qué te ayudo"
        assert resultado["remitente_tipo"] == "admin"
        assert resultado["id_cliente"] == cliente.id_cliente


class TestAislamientoYPermisos:
    def test_cliente_no_puede_ver_el_hilo_de_otro_cliente(self, db):
        """get_mi_hilo SIEMPRE resuelve id_cliente del propio token, nunca
        de un parámetro -- este test confirma que dos clientes distintos
        obtienen cada uno solo su propio hilo."""
        cliente_a, usuario_a = _crear_cliente_con_usuario(db, cedula="1000000001")
        cliente_b, usuario_b = _crear_cliente_con_usuario(db, cedula="1000000002")
        admin = _crear_admin(db)

        asyncio.run(
            mensaje_chat_route.enviar_como_admin(
                id_cliente=cliente_a.id_cliente, contenido="Para A", imagen=None, db=db, admin_id=admin.id_usuario
            )
        )
        asyncio.run(
            mensaje_chat_route.enviar_como_admin(
                id_cliente=cliente_b.id_cliente, contenido="Para B", imagen=None, db=db, admin_id=admin.id_usuario
            )
        )

        hilo_a = mensaje_chat_route.get_mi_hilo(after_id=None, db=db, current_user=usuario_a)
        hilo_b = mensaje_chat_route.get_mi_hilo(after_id=None, db=db, current_user=usuario_b)

        assert [m["contenido"] for m in hilo_a] == ["Para A"]
        assert [m["contenido"] for m in hilo_b] == ["Para B"]

    def test_usuario_sin_admin_ni_cliente_recibe_403_en_ambos_lados(self, db):
        empleado = _crear_empleado_sin_cliente(db)

        with pytest.raises(HTTPException) as exc_info:
            mensaje_chat_route.get_mi_hilo(after_id=None, db=db, current_user=empleado)
        assert exc_info.value.status_code == 403

        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(
                mensaje_chat_route.enviar_como_cliente(contenido="hola", imagen=None, db=db, current_user=empleado)
            )
        assert exc_info.value.status_code == 403


class TestValidacionDeContenido:
    def test_enviar_sin_contenido_ni_imagen_es_rechazado(self, db):
        _cliente, usuario = _crear_cliente_con_usuario(db)

        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(
                mensaje_chat_route.enviar_como_cliente(contenido=None, imagen=None, db=db, current_user=usuario)
            )
        assert exc_info.value.status_code == 400

    def test_archivo_invalido_es_rechazado_por_magic_bytes(self, db):
        """validar_y_leer_archivo() (file_validation.py, Fase H-05) revisa
        los bytes reales de cabecera, no solo el content_type declarado --
        este archivo dice ser un JPG pero no tiene el magic number real."""
        _cliente, usuario = _crear_cliente_con_usuario(db)

        archivo_falso = UploadFile(
            filename="captura.jpg",
            file=io.BytesIO(b"esto no es una imagen real, son bytes cualquiera"),
            headers=Headers({"content-type": "image/jpeg"}),
        )

        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(
                mensaje_chat_route.enviar_como_cliente(
                    contenido=None, imagen=archivo_falso, db=db, current_user=usuario
                )
            )
        assert exc_info.value.status_code == 422


class TestHilosYPollingIncremental:
    def test_get_hilos_ordena_por_mensaje_mas_reciente_con_no_leidos_correcto(self, db):
        cliente_a, _usuario_a = _crear_cliente_con_usuario(db, cedula="1000000001")
        cliente_b, _usuario_b = _crear_cliente_con_usuario(db, cedula="1000000002")
        admin = _crear_admin(db)

        asyncio.run(
            mensaje_chat_route.enviar_como_admin(
                id_cliente=cliente_a.id_cliente, contenido="Primero", imagen=None, db=db, admin_id=admin.id_usuario
            )
        )
        asyncio.run(
            mensaje_chat_route.enviar_como_admin(
                id_cliente=cliente_b.id_cliente, contenido="Segundo", imagen=None, db=db, admin_id=admin.id_usuario
            )
        )
        # Mensaje del CLIENTE b, todavía no leído por ningún admin.
        usuario_b = db.query(Usuario).filter(Usuario.id_cliente == cliente_b.id_cliente).first()
        asyncio.run(
            mensaje_chat_route.enviar_como_cliente(contenido="Respondo", imagen=None, db=db, current_user=usuario_b)
        )

        hilos = mensaje_chat_route.get_hilos(db=db, admin_id=admin.id_usuario)

        assert hilos[0]["id_cliente"] == cliente_b.id_cliente  # el hilo con actividad más reciente va primero
        assert hilos[0]["no_leidos"] == 1
        assert hilos[1]["no_leidos"] == 0

    def test_after_id_devuelve_solo_los_mensajes_posteriores(self, db):
        """Contrato exacto que usa el polling incremental del frontend
        (cada 5s con el hilo abierto): no repetir mensajes ya cargados."""
        cliente, usuario = _crear_cliente_con_usuario(db)
        admin = _crear_admin(db)

        primero = asyncio.run(
            mensaje_chat_route.enviar_como_cliente(contenido="uno", imagen=None, db=db, current_user=usuario)
        )
        asyncio.run(mensaje_chat_route.enviar_como_cliente(contenido="dos", imagen=None, db=db, current_user=usuario))
        asyncio.run(mensaje_chat_route.enviar_como_cliente(contenido="tres", imagen=None, db=db, current_user=usuario))

        solo_nuevos = mensaje_chat_route.get_hilo_admin(
            cliente.id_cliente, after_id=primero["id_mensaje"], db=db, admin_id=admin.id_usuario
        )

        assert [m["contenido"] for m in solo_nuevos] == ["dos", "tres"]


class TestMarcarLeidoYConteos:
    def test_marcar_leido_solo_afecta_los_mensajes_de_la_otra_parte(self, db):
        cliente, usuario = _crear_cliente_con_usuario(db)
        admin = _crear_admin(db)

        asyncio.run(
            mensaje_chat_route.enviar_como_cliente(contenido="del cliente", imagen=None, db=db, current_user=usuario)
        )
        asyncio.run(
            mensaje_chat_route.enviar_como_admin(
                id_cliente=cliente.id_cliente, contenido="del admin", imagen=None, db=db, admin_id=admin.id_usuario
            )
        )

        token_admin = _token_bearer(admin.id_usuario, ["admin"])
        mensaje_chat_route.marcar_leido(
            mensaje_chat_route.MarcarLeidoRequest(id_cliente=cliente.id_cliente),
            db=db,
            current_user=admin,
            authorization=token_admin,
        )

        mensajes = db.query(MensajeChat).filter(MensajeChat.id_cliente == cliente.id_cliente).all()
        del_cliente = [m for m in mensajes if m.remitente_tipo == "cliente"][0]
        del_admin = [m for m in mensajes if m.remitente_tipo == "admin"][0]
        assert del_cliente.leido is True  # el admin marcó leído el mensaje del cliente
        assert del_admin.leido is False  # el suyo propio queda intacto

    def test_no_leidos_es_consciente_del_rol(self, db):
        cliente, usuario = _crear_cliente_con_usuario(db)
        admin = _crear_admin(db)

        asyncio.run(
            mensaje_chat_route.enviar_como_cliente(contenido="del cliente", imagen=None, db=db, current_user=usuario)
        )
        asyncio.run(
            mensaje_chat_route.enviar_como_admin(
                id_cliente=cliente.id_cliente, contenido="del admin", imagen=None, db=db, admin_id=admin.id_usuario
            )
        )

        token_admin = _token_bearer(admin.id_usuario, ["admin"])
        token_cliente = _token_bearer(usuario.id_usuario, ["cliente"])

        conteo_admin = mensaje_chat_route.get_no_leidos(db=db, current_user=admin, authorization=token_admin)
        conteo_cliente = mensaje_chat_route.get_no_leidos(db=db, current_user=usuario, authorization=token_cliente)

        assert conteo_admin["no_leidos"] == 1  # el mensaje del cliente, no leído por ningún admin
        assert conteo_cliente["no_leidos"] == 1  # el mensaje del admin, no leído por el cliente


class TestCascadaDeEliminacion:
    def test_borrar_usuario_remitente_elimina_sus_mensajes_en_cascada(self, db):
        """Corrección de esta ronda: id_usuario_remitente usa
        ondelete=CASCADE (no SET NULL, que era la suposición inicial antes
        de verificar la convención real en auth_model.py) -- prueba el
        comportamiento real a nivel de base de datos, no solo el valor
        declarado en el modelo. SQLite no aplica ON DELETE CASCADE salvo
        que se active este pragma por conexión."""
        from sqlalchemy import text

        cliente, _usuario_cliente = _crear_cliente_con_usuario(db)
        admin = _crear_admin(db)

        asyncio.run(
            mensaje_chat_route.enviar_como_admin(
                id_cliente=cliente.id_cliente,
                contenido="mensaje del admin",
                imagen=None,
                db=db,
                admin_id=admin.id_usuario,
            )
        )
        assert db.query(MensajeChat).filter(MensajeChat.id_cliente == cliente.id_cliente).count() == 1

        db.execute(text("PRAGMA foreign_keys=ON"))
        db.delete(admin)
        db.commit()

        mensajes_restantes = db.query(MensajeChat).filter(MensajeChat.id_cliente == cliente.id_cliente).all()
        assert mensajes_restantes == []
