"""seed datos demo

Revision ID: 523e6283e58b
Revises: 2b118189cd9d
Create Date: 2026-08-16 18:06:41.661519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '523e6283e58b'
down_revision: Union[str, None] = '2b118189cd9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
INSERT INTO metodos_pago (nombre_metodo) VALUES 
('Tarjeta de Credito'), ('Tarjeta de Debito'), ('Efectivo'), ('Transferencia Bancaria'), 
('PayPal'), ('Criptomonedas'), ('Nequi'), ('Daviplata'), ('PSE'), ('Cheque');

INSERT INTO hoteles (nombre_hotel, calificacion, direccion, ciudad, pais, codigo_postal, correo_electronico, telefono) VALUES
('Hotel Paraiso', 5, 'Calle 1 # 2-3', 'Bogota', 'Colombia', '110111', 'contacto@paraiso.com', '+573001234567'),
('Resort Sol y Arena', 4, 'Av. Maritima 45', 'Cartagena', 'Colombia', '130001', 'info@solyarena.com', '+573009876543'),
('Montana Magica', 3, 'Via al Parque', 'Medellin', 'Colombia', '050001', 'reservas@montana.com', '+573101112233'),
('Gran Hotel Centro', 5, 'Carrera 7 # 14-20', 'Bogota', 'Colombia', '110221', 'gerencia@granhotel.com', '+573204445566'),
('Cabanas del Bosque', 2, 'Km 5 Via Salento', 'Salento', 'Colombia', '631020', 'hola@bosque.com', '+573115556677'),
('Plaza Mayor Hotel', 4, 'Plaza Central', 'Villa de Leyva', 'Colombia', '154001', 'info@plazamayor.com', '+573128889900'),
('Boutique Santa Marta', 5, 'Centro Historico', 'Santa Marta', 'Colombia', '470004', 'boutique@santamarta.com', '+573142223344'),
('EcoLodge Tayrona', 3, 'Entrada Parque Tayrona', 'Santa Marta', 'Colombia', '470005', 'eco@tayrona.com', '+573153334455'),
('Hotel Imperial', 4, 'Av. El Poblado', 'Medellin', 'Colombia', '050021', 'imperial@hotel.com', '+573167778899'),
('Cali Pachanguero H.', 3, 'Barrio Granada', 'Cali', 'Colombia', '760001', 'reservas@calih.com', '+573178889900');

INSERT INTO caracteristicas_hotel (nombre_caracteristica) VALUES
('Piscina al aire libre'), ('Gimnasio'), ('Spa y masajes'), ('Restaurante buffet'),
('Parqueadero gratuito'), ('Pet Friendly'), ('Casino'), ('Guarderia'),
('Traslado al aeropuerto'), ('Bar en la azotea');

INSERT INTO hotel_caracteristicas (id_hotel, id_caracteristica, disponible) VALUES
(1, 1, TRUE), (1, 2, TRUE), (2, 1, TRUE), (2, 3, TRUE), (3, 5, TRUE),
(4, 2, TRUE), (4, 4, TRUE), (5, 6, TRUE), (6, 5, TRUE), (7, 3, TRUE),
(8, 6, TRUE), (9, 7, TRUE), (10, 10, TRUE), (1, 9, FALSE), (2, 8, TRUE);

INSERT INTO tipo_habitacion (nombre_tipo, descripcion, capacidad_personas) VALUES
('Sencilla', 'Habitacion para una persona con cama individual.', 1),
('Doble', 'Habitacion con cama matrimonial.', 2),
('Twin', 'Habitacion con dos camas individuales.', 2),
('Familiar', 'Habitacion amplia para familias.', 4),
('Suite', 'Suite de lujo con sala de estar.', 2),
('Presidencial', 'La mejor habitacion del hotel, maximo lujo.', 2),
('Cuadruple', 'Cuatro camas individuales.', 4),
('Cabana', 'Cabana independiente en la naturaleza.', 5),
('Penthouse', 'Apartamento en el ultimo piso con vista.', 4),
('Economica', 'Habitacion basica sin ventanas grandes.', 2);

INSERT INTO habitaciones (id_hotel, id_tipo_habitacion, numero_habitacion, precio_noche, estado) VALUES
(1, 1, '101', 150000.00, 'disponible'),
(1, 5, '501', 450000.00, 'ocupada'),
(2, 2, '201', 200000.00, 'disponible'),
(2, 4, '301', 350000.00, 'mantenimiento'),
(3, 8, 'C-1', 180000.00, 'disponible'),
(4, 6, '1001', 850000.00, 'ocupada'),
(5, 10, '10', 90000.00, 'disponible'),
(6, 3, '205', 160000.00, 'disponible'),
(7, 5, '305', 500000.00, 'ocupada'),
(8, 8, 'E-5', 220000.00, 'mantenimiento');

INSERT INTO clientes (nombre, apellido, cedula, correo, celular, direccion, ciudad, pais, fecha_nacimiento) VALUES
('Juan', 'Perez', '1000111222', 'juan.perez@email.com', '3001111111', 'Calle 10 # 20-30', 'Bogota', 'Colombia', '1990-05-15'),
('Maria', 'Gomez', '1000222333', 'maria.gomez@email.com', '3002222222', 'Carrera 15 # 40-50', 'Medellin', 'Colombia', '1985-08-20'),
('Carlos', 'Lopez', '1000333444', 'carlos.lopez@email.com', '3003333333', 'Av. Siempre Viva 123', 'Cali', 'Colombia', '1992-11-10'),
('Ana', 'Martinez', '1000444555', 'ana.martinez@email.com', '3004444444', 'Calle 50 # 10-10', 'Barranquilla', 'Colombia', '1988-03-25'),
('Luis', 'Rodriguez', '1000555666', 'luis.rodriguez@email.com', '3005555555', 'Transversal 5 # 3-2', 'Cartagena', 'Colombia', '1995-07-08'),
('Laura', 'Fernandez', '1000666777', 'laura.fernandez@email.com', '3006666666', 'Diagonal 20 # 15-5', 'Bucaramanga', 'Colombia', '1991-12-12'),
('Pedro', 'Sanchez', '1000777888', 'pedro.sanchez@email.com', '3007777777', 'Carrera 8 # 12-34', 'Pereira', 'Colombia', '1980-01-30'),
('Sofia', 'Diaz', '1000888999', 'sofia.diaz@email.com', '3008888888', 'Calle Principal 1', 'Manizales', 'Colombia', '1993-09-18'),
('Diego', 'Ramirez', '1000999000', 'diego.ramirez@email.com', '3009999999', 'Conjunto Los Pinos', 'Armenia', 'Colombia', '1987-04-05'),
('Valentina', 'Torres', '1000000111', 'valentina.torres@email.com', '3000000000', 'Avenida del Rio', 'Santa Marta', 'Colombia', '1998-06-22');

INSERT INTO empleados (nombre, apellido, cedula, correo_electronico, celular, direccion, ciudad, pais, fecha_nacimiento, fecha_contratacion) VALUES
('Andres', 'Castro', '2000111222', 'andres.castro@alektours.com', '3101111111', 'Calle 1 # 1-1', 'Bogota', 'Colombia', '1985-01-10', '2020-02-15'),
('Camila', 'Vargas', '2000222333', 'camila.vargas@alektours.com', '3102222222', 'Calle 2 # 2-2', 'Bogota', 'Colombia', '1990-02-20', '2021-03-10'),
('Javier', 'Rojas', '2000333444', 'javier.rojas@alektours.com', '3103333333', 'Calle 3 # 3-3', 'Bogota', 'Colombia', '1988-05-15', '2019-08-01'),
('Natalia', 'Molina', '2000444555', 'natalia.molina@alektours.com', '3104444444', 'Calle 4 # 4-4', 'Medellin', 'Colombia', '1992-09-25', '2022-01-10'),
('Felipe', 'Guzman', '2000555666', 'felipe.guzman@alektours.com', '3105555555', 'Calle 5 # 5-5', 'Cartagena', 'Colombia', '1987-11-30', '2018-05-20'),
('Daniela', 'Rios', '2000666777', 'daniela.rios@alektours.com', '3106666666', 'Calle 6 # 6-6', 'Cali', 'Colombia', '1995-04-12', '2023-06-15'),
('Oscar', 'Silva', '2000777888', 'oscar.silva@alektours.com', '3107777777', 'Calle 7 # 7-7', 'Bogota', 'Colombia', '1980-08-08', '2015-10-10'),
('Monica', 'Herrera', '2000888999', 'monica.herrera@alektours.com', '3108888888', 'Calle 8 # 8-8', 'Bogota', 'Colombia', '1993-12-05', '2021-11-20'),
('Hector', 'Pena', '2000999000', 'hector.pena@alektours.com', '3109999999', 'Calle 9 # 9-9', 'Medellin', 'Colombia', '1989-07-22', '2020-09-05'),
('Paola', 'Cruz', '2000000111', 'paola.cruz@alektours.com', '3100000000', 'Calle 10 # 10-10', 'Bogota', 'Colombia', '1991-03-18', '2022-04-01');

INSERT INTO usuarios (username, correo_electronico, password_hash, id_cliente, id_empleado, verificado) VALUES
('juanp', 'juan.perez@email.com', 'hash12345', 1, NULL, TRUE),
('mariag', 'maria.gomez@email.com', 'hash12345', 2, NULL, TRUE),
('carlosl', 'carlos.lopez@email.com', 'hash12345', 3, NULL, FALSE),
('anam', 'ana.martinez@email.com', 'hash12345', 4, NULL, TRUE),
('luisr', 'luis.rodriguez@email.com', 'hash12345', 5, NULL, TRUE),
('andresc', 'andres.castro@alektours.com', 'hash12345', NULL, 1, TRUE),
('camilav', 'camila.vargas@alektours.com', 'hash12345', NULL, 2, TRUE),
('javierr', 'javier.rojas@alektours.com', 'hash12345', NULL, 3, TRUE),
('nataliam', 'natalia.molina@alektours.com', 'hash12345', NULL, 4, TRUE),
('felipeg', 'felipe.guzman@alektours.com', 'hash12345', NULL, 5, TRUE);

INSERT INTO sesiones_usuario (id_usuario, refresh_token, direccion_ip, user_agent, fecha_expiracion) VALUES
(1, 'token_abc1', '192.168.1.1', 'Mozilla/5.0 Windows', '2026-12-31 23:59:59'),
(2, 'token_abc2', '192.168.1.2', 'Safari/537.36 Mac', '2026-12-31 23:59:59'),
(3, 'token_abc3', '192.168.1.3', 'Chrome/91.0 Android', '2026-12-31 23:59:59'),
(4, 'token_abc4', '192.168.1.4', 'Mozilla/5.0 Linux', '2026-12-31 23:59:59'),
(5, 'token_abc5', '192.168.1.5', 'Edge/91.0 Windows', '2026-12-31 23:59:59'),
(6, 'token_abc6', '10.0.0.1', 'Mozilla/5.0 Windows', '2026-12-31 23:59:59'),
(7, 'token_abc7', '10.0.0.2', 'Safari/537.36 Mac', '2026-12-31 23:59:59'),
(8, 'token_abc8', '10.0.0.3', 'Chrome/91.0 iOS', '2026-12-31 23:59:59'),
(9, 'token_abc9', '10.0.0.4', 'Mozilla/5.0 Windows', '2026-12-31 23:59:59'),
(10, 'token_abc10', '10.0.0.5', 'Edge/91.0 Mac', '2026-12-31 23:59:59');

INSERT INTO recuperacion_password (id_usuario, token_recuperacion, usado, fecha_expiracion) VALUES
(1, 'rec_token_1', FALSE, '2026-07-01 10:00:00'),
(2, 'rec_token_2', TRUE, '2026-01-01 10:00:00'),
(3, 'rec_token_3', FALSE, '2026-07-02 10:00:00'),
(4, 'rec_token_4', TRUE, '2026-02-15 10:00:00'),
(5, 'rec_token_5', FALSE, '2026-07-05 10:00:00'),
(6, 'rec_token_6', TRUE, '2025-11-20 10:00:00'),
(7, 'rec_token_7', FALSE, '2026-08-10 10:00:00'),
(8, 'rec_token_8', TRUE, '2026-03-25 10:00:00'),
(9, 'rec_token_9', FALSE, '2026-09-12 10:00:00'),
(10, 'rec_token_10', TRUE, '2025-12-05 10:00:00');

INSERT INTO destinos (nombre_destino, descripcion, ciudad, pais, temporada_alta_inicio, temporada_alta_fin) VALUES
('Muralla Historica', 'Centro historico amurallado.', 'Cartagena', 'Colombia', '2026-12-01', '2027-01-31'),
('Parque Tayrona', 'Reserva natural con playas virgenes.', 'Santa Marta', 'Colombia', '2026-12-15', '2027-01-15'),
('Piedra del Penol', 'Monolito gigante con vista al embalse.', 'Guatape', 'Colombia', '2026-06-15', '2026-08-15'),
('Santuario de Monserrate', 'Iglesia en la cima de la montana.', 'Bogota', 'Colombia', '2026-03-25', '2026-04-05'),
('Valle del Cocora', 'Hogar de la palma de cera.', 'Salento', 'Colombia', '2026-12-20', '2027-01-20'),
('Desierto de la Tatacoa', 'Zona arida con observatorio astronomico.', 'Villavieja', 'Colombia', '2026-06-01', '2026-07-31'),
('Cano Cristales', 'El rio de los cinco colores.', 'La Macarena', 'Colombia', '2026-07-01', '2026-11-30'),
('Isla de San Andres', 'Mar de los siete colores.', 'San Andres', 'Colombia', '2026-12-01', '2027-02-28'),
('Santuario de Las Lajas', 'Iglesia construida sobre el canon.', 'Ipiales', 'Colombia', '2026-03-20', '2026-04-10'),
('Museo del Oro', 'Coleccion de orfebreria prehispanica.', 'Bogota', 'Colombia', '2026-06-01', '2026-08-01');

INSERT INTO categoria_servicio (nombre_categoria) VALUES
('Tour Guiado'), ('Transporte'), ('Aventura y Deportes'), ('Gastronomia'), 
('Cultura y Museos'), ('Relajacion y Spa'), ('Vida Nocturna'), ('Fotografia'),
('Ecoturismo'), ('Compras');

INSERT INTO servicios (nombre_servicio, descripcion, id_categoria, id_destino, duracion_horas, precio_base, capacidad_maxima) VALUES
('City Tour Historico', 'Recorrido por la ciudad amurallada.', 1, 1, 3.5, 80000.00, 20),
('Caminata Ecologica Tayrona', 'Senderismo hasta Cabo San Juan.', 9, 2, 6.0, 120000.00, 15),
('Escalada Penol', 'Subida a los 740 escalones.', 3, 3, 2.0, 45000.00, 50),
('Teleferico Monserrate', 'Subida y bajada en teleferico.', 2, 4, 1.5, 25000.00, 100),
('Cabalgata Cocora', 'Paseo en caballo por el valle.', 9, 5, 2.5, 60000.00, 10),
('Tour Astronomico', 'Observacion de estrellas en el desierto.', 1, 6, 2.0, 35000.00, 25),
('Safari Fotografico Macarena', 'Tour en lancha y caminata.', 8, 7, 8.0, 250000.00, 12),
('Buceo San Andres', 'Inmersion para principiantes.', 3, 8, 4.0, 180000.00, 6),
('Tour Religioso Las Lajas', 'Visita guiada al santuario.', 5, 9, 3.0, 40000.00, 30),
('Entrada VIP Museo', 'Acceso sin filas y guia privado.', 5, 10, 2.5, 90000.00, 5);

INSERT INTO proveedores (nombre_proveedor, tipo_proveedor, contacto, telefono, correo_electronico, direccion, ciudad, pais, comision_porcentaje) VALUES
('Transportes Caribe', 'Transporte', 'Luis Ramos', '3001112233', 'luis@transcaribe.com', 'Calle 10', 'Cartagena', 'Colombia', 15.00),
('Guias Nativos', 'Guianza', 'Pedro Pataquiva', '3002223344', 'pedro@guias.com', 'Calle 11', 'Santa Marta', 'Colombia', 20.00),
('Aventuras Extremas', 'Recreacion', 'Ana Roa', '3003334455', 'ana@aventuras.com', 'Calle 12', 'Medellin', 'Colombia', 10.00),
('Monserrate Tour SAS', 'Operador', 'Juan Diaz', '3004445566', 'juan@montour.com', 'Calle 13', 'Bogota', 'Colombia', 12.50),
('Caballos del Quindio', 'Recreacion', 'Carlos Ruiz', '3005556677', 'carlos@caballos.com', 'Calle 14', 'Salento', 'Colombia', 18.00),
('Tatacoa Stars', 'Guianza', 'Maria Luz', '3006667788', 'maria@stars.com', 'Calle 15', 'Villavieja', 'Colombia', 15.00),
('Cristales Eco', 'Operador', 'Jorge Pan', '3007778899', 'jorge@eco.com', 'Calle 16', 'La Macarena', 'Colombia', 25.00),
('Dive Master SA', 'Recreacion', 'Sofia Mar', '3008889900', 'sofia@dive.com', 'Calle 17', 'San Andres', 'Colombia', 20.00),
('Sur Turismo', 'Operador', 'Diego Sur', '3009990011', 'diego@sur.com', 'Calle 18', 'Ipiales', 'Colombia', 10.00),
('Cultura Capital', 'Guianza', 'Laura Ley', '3000001122', 'laura@cultura.com', 'Calle 19', 'Bogota', 'Colombia', 15.00);

INSERT INTO servicio_proveedor (id_servicio, id_proveedor, precio_proveedor, es_proveedor_principal) VALUES
(1, 1, 65000.00, TRUE), (2, 2, 95000.00, TRUE), (3, 3, 35000.00, TRUE),
(4, 4, 20000.00, TRUE), (5, 5, 45000.00, TRUE), (6, 6, 28000.00, TRUE),
(7, 7, 180000.00, TRUE), (8, 8, 140000.00, TRUE), (9, 9, 32000.00, TRUE),
(10, 10, 75000.00, TRUE);

INSERT INTO paquetes (nombre_paquete, descripcion, duracion_dias, precio_base, activo) VALUES
('Magia del Caribe', 'Recorrido por Cartagena y Santa Marta.', 5, 1200000.00, TRUE),
('Aventura Paisa', 'Medellin, Penol y Guatape.', 4, 850000.00, TRUE),
('Bogota Cultural', 'Museos, Monserrate y gastronomia.', 3, 500000.00, TRUE),
('Eje Cafetero Total', 'Salento, Cocora y fincas cafeteras.', 4, 900000.00, TRUE),
('Maravillas Ocultas', 'Tatacoa y Cano Cristales.', 6, 1800000.00, TRUE),
('San Andres Premium', 'Buceo y relax total.', 5, 1500000.00, TRUE),
('Sur de Colombia', 'Pasto, Las Lajas y Laguna de la Cocha.', 4, 750000.00, TRUE),
('Ruta del Sol', 'Costa caribena completa.', 7, 2100000.00, TRUE),
('Escapada Romantica', 'Fin de semana en cabana con spa.', 2, 600000.00, TRUE),
('Full Adrenalina', 'Deportes extremos en Santander.', 4, 950000.00, TRUE);

INSERT INTO paquete_servicios (id_paquete, id_servicio, dia_actividad, incluido) VALUES
(1, 1, 1, TRUE), (1, 2, 3, TRUE), (2, 3, 2, TRUE), (3, 4, 1, TRUE),
(3, 10, 2, TRUE), (4, 5, 2, TRUE), (5, 6, 1, TRUE), (5, 7, 4, TRUE),
(6, 8, 2, TRUE), (7, 9, 2, TRUE);

INSERT INTO paquete_hotel (id_paquete, id_hotel, noches_incluidas) VALUES
(1, 2, 2), (1, 8, 2), (2, 9, 3), (3, 4, 2),
(4, 5, 3), (5, 10, 1), (6, 7, 4), (7, 10, 3),
(8, 2, 3), (9, 3, 1);

INSERT INTO reservas (id_cliente, id_empleado, id_paquete, fecha_inicio, fecha_fin, numero_personas, estado) VALUES
(1, 1, 1, '2026-07-10', '2026-07-15', 2, 'confirmada'),
(2, 2, 2, '2026-08-01', '2026-08-05', 4, 'pendiente'),
(3, 3, 3, '2026-06-20', '2026-06-23', 1, 'finalizada'),
(4, 4, 4, '2026-09-10', '2026-09-14', 2, 'confirmada'),
(5, 5, 5, '2026-10-05', '2026-10-11', 2, 'cancelada'),
(6, 1, 6, '2026-11-15', '2026-11-20', 2, 'confirmada'),
(7, 2, 7, '2026-12-01', '2026-12-05', 4, 'pendiente'),
(8, 3, 8, '2027-01-10', '2027-01-17', 2, 'confirmada'),
(9, 4, 9, '2026-07-25', '2026-07-27', 2, 'finalizada'),
(10, 5, 10, '2026-08-15', '2026-08-19', 3, 'confirmada');

INSERT INTO reserva_habitaciones (id_reserva, id_habitacion, fecha_checkin, fecha_checkout, precio_acordado) VALUES
(1, 3, '2026-07-10', '2026-07-12', 400000.00),
(2, 4, '2026-08-01', '2026-08-05', 1400000.00),
(3, 6, '2026-06-20', '2026-06-23', 2550000.00),
(4, 5, '2026-09-10', '2026-09-14', 720000.00),
(5, 7, '2026-10-05', '2026-10-07', 180000.00),
(6, 9, '2026-11-15', '2026-11-20', 2500000.00),
(7, 10, '2027-01-10', '2027-01-17', 1540000.00),
(8, 3, '2027-01-10', '2027-01-13', 600000.00),
(9, 8, '2026-07-25', '2026-07-27', 320000.00),
(10, 1, '2026-08-15', '2026-08-19', 600000.00);

INSERT INTO reserva_servicios (id_reserva, id_servicio, fecha_servicio, numero_personas, precio_acordado) VALUES
(1, 1, '2026-07-11', 2, 160000.00),
(2, 3, '2026-08-02', 4, 180000.00),
(3, 4, '2026-06-21', 1, 25000.00),
(3, 10, '2026-06-22', 1, 90000.00),
(4, 5, '2026-09-12', 2, 120000.00),
(5, 6, '2026-10-06', 2, 70000.00),
(6, 8, '2026-11-17', 2, 360000.00),
(7, 9, '2026-12-03', 4, 160000.00),
(9, 6, '2026-07-26', 2, 70000.00),
(10, 2, '2026-08-17', 3, 360000.00);

INSERT INTO pagos (id_reserva, id_metodo_pago, monto, referencia, estado) VALUES
(1, 1, 1200000.00, 'REF-001', 'pagado'),
(2, 4, 425000.00, 'REF-002', 'pendiente'),
(3, 3, 500000.00, 'REF-003', 'pagado'),
(4, 1, 900000.00, 'REF-004', 'pagado'),
(5, 2, 1800000.00, 'REF-005', 'rechazado'),
(6, 5, 1500000.00, 'REF-006', 'pagado'),
(7, 4, 375000.00, 'REF-007', 'pendiente'),
(8, 1, 2100000.00, 'REF-008', 'pagado'),
(9, 7, 600000.00, 'REF-009', 'pagado'),
(10, 9, 950000.00, 'REF-010', 'pagado');

INSERT INTO historial_reservas (id_reserva, estado_anterior, estado_nuevo, id_empleado_responsable, comentarios) VALUES
(1, 'pendiente', 'confirmada', 1, 'Pago recibido con exito.'),
(2, NULL, 'pendiente', 2, 'Cliente solicito prorroga para el pago.'),
(3, 'confirmada', 'finalizada', 3, 'El cliente completo su viaje satisfactoriamente.'),
(4, 'pendiente', 'confirmada', 4, 'Transferencia validada por contabilidad.'),
(5, 'confirmada', 'cancelada', 5, 'Cancelacion por motivos de salud del cliente.'),
(6, 'pendiente', 'confirmada', 1, 'Pago por PayPal aprobado.'),
(7, NULL, 'pendiente', 2, 'Reserva creada en el sistema.'),
(8, 'pendiente', 'confirmada', 3, 'Tarjeta de credito procesada.'),
(9, 'confirmada', 'finalizada', 4, 'Viaje finalizado sin novedades.'),
(10, 'pendiente', 'confirmada', 5, 'Pago por PSE ingresado.');

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS canal_origen VARCHAR(20) DEFAULT 'web'
  CHECK (canal_origen IN ('web', 'empleado', 'telefono'));

CREATE OR REPLACE VIEW vista_paquetes_populares AS
SELECT
    p.id_paquete,
    p.nombre_paquete,
    p.descripcion,
    p.duracion_dias,
    p.precio_base,
    p.activo,
    COUNT(r.id_reserva) AS total_reservas,
    ROUND(AVG(CASE WHEN pa.estado = 'pagado' THEN 1.0 ELSE 0.0 END) * 5, 1) AS calificacion_estimada
FROM paquetes p
LEFT JOIN reservas r ON r.id_paquete = p.id_paquete
LEFT JOIN pagos pa ON pa.id_reserva = r.id_reserva
WHERE p.activo = TRUE
GROUP BY p.id_paquete
ORDER BY total_reservas DESC, calificacion_estimada DESC;
""")


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vista_paquetes_populares;")
    op.execute("ALTER TABLE reservas DROP COLUMN IF EXISTS canal_origen;")
    op.execute("""
        TRUNCATE TABLE
            historial_reservas, pagos, reserva_servicios, reserva_habitaciones,
            reservas, paquete_hotel, paquete_servicios, paquetes,
            servicio_proveedor, proveedores, servicios, categoria_servicio,
            destinos, recuperacion_password, sesiones_usuario, usuarios,
            empleados, clientes, habitaciones, tipo_habitacion,
            hotel_caracteristicas, caracteristicas_hotel, hoteles, metodos_pago
        RESTART IDENTITY CASCADE;
    """)
