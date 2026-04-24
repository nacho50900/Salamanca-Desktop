-- ============================================================
-- turismo_salamanca.sql
-- Base de datos: turismo_salamanca
-- Usuario: DBUSER2026 / Contraseña: DBPWD2026
-- UO300737 – Software y estándares para la Web
-- ============================================================

CREATE DATABASE IF NOT EXISTS turismo_salamanca
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE turismo_salamanca;

-- Crear usuario y asignar permisos
CREATE USER IF NOT EXISTS 'DBUSER2026'@'localhost' IDENTIFIED BY 'DBPWD2026';
GRANT ALL PRIVILEGES ON turismo_salamanca.* TO 'DBUSER2026'@'localhost';
FLUSH PRIVILEGES;

-- ============================================================
-- TABLA: tipo_recurso
-- Catálogo de tipos de recursos turísticos
-- ============================================================
CREATE TABLE IF NOT EXISTS tipo_recurso (
    id_tipo     INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    descripcion VARCHAR(255)    NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: recurso_turistico
-- Recursos turísticos disponibles para reservar
-- ============================================================
CREATE TABLE IF NOT EXISTS recurso_turistico (
    id_recurso  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    id_tipo     INT UNSIGNED    NOT NULL,
    nombre      VARCHAR(150)    NOT NULL,
    descripcion TEXT            NOT NULL,
    plazas      SMALLINT UNSIGNED NOT NULL DEFAULT 10,
    fecha_inicio DATETIME       NOT NULL,
    fecha_fin    DATETIME       NOT NULL,
    precio      DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
    activo      TINYINT(1)      NOT NULL DEFAULT 1,
    CONSTRAINT fk_recurso_tipo
        FOREIGN KEY (id_tipo) REFERENCES tipo_recurso(id_tipo)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: usuario
-- Usuarios registrados en el sistema de reservas
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    apellidos   VARCHAR(150)    NOT NULL,
    email       VARCHAR(200)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,   -- bcrypt hash
    telefono    VARCHAR(20),
    fecha_registro DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo      TINYINT(1)      NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: reserva
-- Reservas realizadas por los usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS reserva (
    id_reserva      INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    id_usuario      INT UNSIGNED    NOT NULL,
    id_recurso      INT UNSIGNED    NOT NULL,
    num_personas    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    fecha_reserva   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado          ENUM('pendiente','confirmada','anulada') NOT NULL DEFAULT 'pendiente',
    precio_total    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    notas           TEXT,
    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reserva_recurso
        FOREIGN KEY (id_recurso) REFERENCES recurso_turistico(id_recurso)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: sesion
-- Gestión de sesiones activas de usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS sesion (
    id_sesion       VARCHAR(128)    PRIMARY KEY,
    id_usuario      INT UNSIGNED    NOT NULL,
    fecha_creacion  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME       NOT NULL,
    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS INICIALES – tipo_recurso
-- ============================================================
INSERT INTO tipo_recurso (nombre, descripcion) VALUES
    ('Museo',           'Museos y centros de interpretación'),
    ('Ruta guiada',     'Rutas turísticas con guía oficial'),
    ('Restaurante',     'Restaurantes de cocina tradicional'),
    ('Hotel',           'Alojamiento con servicios turísticos'),
    ('Actividad',       'Actividades de ocio y turismo activo');

-- ============================================================
-- DATOS INICIALES – recurso_turistico
-- ============================================================
INSERT INTO recurso_turistico (id_tipo, nombre, descripcion, plazas, fecha_inicio, fecha_fin, precio) VALUES
    (1, 'Museo Casa Lis',
        'Museo Art Nouveau y Art Déco ubicado en una espectacular casa modernista a orillas del Tormes.',
        30, '2026-04-01 10:00:00', '2026-12-31 20:00:00', 6.00),

    (2, 'Visita guiada Universidad de Salamanca',
        'Recorrido por la Universidad más antigua de España: Escuelas Mayores, Cielo de Salamanca y Biblioteca Histórica.',
        20, '2026-04-01 09:00:00', '2026-12-31 18:00:00', 12.00),

    (2, 'Ruta nocturna monumental',
        'Tour nocturno por el casco histórico con iluminación especial. Incluye degustación de farinato.',
        15, '2026-05-01 21:00:00', '2026-10-31 23:30:00', 18.00),

    (3, 'Experiencia gastronómica en La Alberca',
        'Cena de 5 platos con productos de la Sierra de Francia: jamón ibérico, farinato, hornazo y perrunillas.',
        12, '2026-04-15 20:30:00', '2026-11-30 23:00:00', 45.00),

    (5, 'Kayak en los Arribes del Duero',
        'Actividad de kayak por el espectacular cañón del Duero. Material y seguro incluidos. Nivel básico.',
        10, '2026-05-15 09:00:00', '2026-09-30 18:00:00', 35.00),

    (4, 'Hotel Hacienda Zorita Spa',
        'Estancia de 2 noches en bodega-hotel del siglo XV con spa, catas de vino D.O. Arribes y desayuno.',
        8, '2026-04-01 14:00:00', '2026-12-31 12:00:00', 220.00);
