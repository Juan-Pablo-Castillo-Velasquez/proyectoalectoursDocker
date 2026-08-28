from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import verify_password, hash_password
from app.core.cache import get_cached, set_cached, delete_pattern
from app.core.exceptions import ClienteDependencyError, EmpleadoDependencyError, NotFoundError
from app.schemas.cliente_schema import ClienteCreate, ClienteUpdate, ClienteResponse, EmpleadoCreate, EmpleadoUpdate, EmpleadoResponse
from app.repositories.cliente_repository import ClienteRepository, EmpleadoRepository
from app.models.user_model import Usuario

router = APIRouter(prefix="/api", tags=["Clientes y Empleados"])


# ===================== CLIENTES CRUD =====================

@router.get("/clientes", response_model=list[ClienteResponse])
def get_clientes(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=300), db: Session = Depends(get_db)):
    # Cacheado 2 min: este listado lo pide el panel de admin completo
    # (?limit=100) cada vez que se abre — invalidado en cualquier escritura
    # de cliente (crear/editar/eliminar) o de su foto de perfil (usuario_route.py).
    cache_key = f"clientes:list:{skip}:{limit}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    clientes = ClienteRepository.get_all(db, skip, limit)
    data = [ClienteResponse.model_validate(c).model_dump(mode="json") for c in clientes]
    set_cached(cache_key, data, ttl_seconds=120)
    return data


@router.get("/clientes/{cliente_id}", response_model=ClienteResponse)
def get_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = ClienteRepository.get_by_id(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("/clientes", response_model=ClienteResponse, status_code=201)
def create_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    if ClienteRepository.get_by_cedula(db, cliente.cedula):
        raise HTTPException(status_code=400, detail="Cliente con esa cédula ya existe")
    if cliente.correo and ClienteRepository.get_by_email(db, cliente.correo):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    nuevo = ClienteRepository.create(db, cliente.dict())
    delete_pattern("clientes:list:*")
    return nuevo


# IMPORTANTE: esta ruta debe ir ANTES de PUT /clientes/{cliente_id}


class CambiarContrasenaRequest(BaseModel):
    contrasena_actual: str
    nueva_contrasena: str

@router.put("/clientes/{cliente_id}/cambiar-contrasena")
def cambiar_contrasena(cliente_id: int, data: CambiarContrasenaRequest, db: Session = Depends(get_db)):
    cliente = ClienteRepository.get_by_id(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    usuario = db.query(Usuario).filter(Usuario.id_cliente == cliente_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not verify_password(data.contrasena_actual, usuario.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    if len(data.nueva_contrasena) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")

    usuario.password_hash = hash_password(data.nueva_contrasena)
    db.commit()
    return {"message": "Contraseña actualizada correctamente"}
class VincularClienteRequest(BaseModel):
    id_cliente: int

@router.put("/usuarios/{usuario_id}/vincular-cliente")
def vincular_cliente(usuario_id: int, data: VincularClienteRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.id_cliente = data.id_cliente
    db.commit()
    return {"message": "Cliente vinculado correctamente"}

@router.put("/clientes/{cliente_id}", response_model=ClienteResponse)
def update_cliente(cliente_id: int, cliente: ClienteUpdate, db: Session = Depends(get_db)):
    if not ClienteRepository.get_by_id(db, cliente_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    # create_cliente ya validaba correo duplicado con un mensaje claro;
    # update_cliente no lo hacía y dejaba que el CHECK/UNIQUE de la base de
    # datos reventara con un IntegrityError sin capturar (500 crudo).
    if cliente.correo and ClienteRepository.existe_otro_con_correo(db, cliente_id, cliente.correo):
        raise HTTPException(status_code=400, detail="Email ya registrado por otro cliente")
    actualizado = ClienteRepository.update(db, cliente_id, cliente.dict(exclude_unset=True))
    delete_pattern("clientes:list:*")
    return actualizado


@router.delete("/clientes/{cliente_id}")
def delete_cliente(cliente_id: int, db: Session = Depends(get_db)):
    try:
        resultado = ClienteRepository.delete(db, cliente_id)
        delete_pattern("clientes:list:*")
        return {"message": "Cliente eliminado exitosamente"}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except ClienteDependencyError as e:
        raise HTTPException(status_code=409, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================== EMPLEADOS CRUD =====================

@router.get("/empleados", response_model=list[EmpleadoResponse])
def get_empleados(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    cache_key = f"empleados:list:{skip}:{limit}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    empleados = EmpleadoRepository.get_all(db, skip, limit)
    data = [EmpleadoResponse.model_validate(e).model_dump(mode="json") for e in empleados]
    set_cached(cache_key, data, ttl_seconds=120)
    return data


@router.get("/empleados/activos/lista", response_model=list[EmpleadoResponse])
def get_empleados_activos(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return EmpleadoRepository.get_activos(db, skip, limit)


@router.get("/empleados/{empleado_id}", response_model=EmpleadoResponse)
def get_empleado(empleado_id: int, db: Session = Depends(get_db)):
    empleado = EmpleadoRepository.get_by_id(db, empleado_id)
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado


@router.post("/empleados", response_model=EmpleadoResponse, status_code=201)
def create_empleado(empleado: EmpleadoCreate, db: Session = Depends(get_db)):
    if EmpleadoRepository.get_by_cedula(db, empleado.cedula):
        raise HTTPException(status_code=400, detail="Empleado con esa cédula ya existe")
    if empleado.correo_electronico and EmpleadoRepository.get_by_email(db, empleado.correo_electronico):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    nuevo = EmpleadoRepository.create(db, empleado.dict())
    delete_pattern("empleados:list:*")
    return nuevo


@router.put("/empleados/{empleado_id}", response_model=EmpleadoResponse)
def update_empleado(empleado_id: int, empleado: EmpleadoUpdate, db: Session = Depends(get_db)):
    if not EmpleadoRepository.get_by_id(db, empleado_id):
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    actualizado = EmpleadoRepository.update(db, empleado_id, empleado.dict(exclude_unset=True))
    delete_pattern("empleados:list:*")
    return actualizado


@router.delete("/empleados/{empleado_id}")
def delete_empleado(empleado_id: int, db: Session = Depends(get_db)):
    try:
        EmpleadoRepository.delete(db, empleado_id)
        delete_pattern("empleados:list:*")
        return {"message": "Empleado eliminado exitosamente"}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except EmpleadoDependencyError as e:
        raise HTTPException(status_code=409, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))