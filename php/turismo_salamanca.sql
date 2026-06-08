-- ============================================================
-- turismo_salamanca.sql
-- Base de datos: turismo_salamanca
-- Usuario: DBUSER2026 / Contraseña: DBPWD2026
-- UO300737 – Software y estándares para la Web
-- ============================================================
-- INSTRUCCIONES DE IMPORTACIÓN EN phpMyAdmin:
--   1. Importar este archivo SQL (crea tablas y usuario)
--   2. Los CSV deben estar en una ruta accesible por el servidor
--      o usar el panel de Import de phpMyAdmin tabla a tabla.
--   Para servidor local con permisos: ejecutar las sentencias
--   LOAD DATA LOCAL INFILE desde consola MySQL con:
--      mysql --local-infile=1 -u root -p < turismo_salamanca.sql
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
-- ============================================================
CREATE TABLE IF NOT EXISTS tipo_recurso (
    id_tipo     INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    descripcion VARCHAR(255)    NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: recurso_turistico
-- ============================================================
CREATE TABLE IF NOT EXISTS recurso_turistico (
    id_recurso   INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
    id_tipo      INT UNSIGNED      NOT NULL,
    nombre       VARCHAR(150)      NOT NULL,
    descripcion  TEXT              NOT NULL,
    plazas       SMALLINT UNSIGNED NOT NULL DEFAULT 10,
    fecha_inicio DATETIME          NOT NULL,
    fecha_fin    DATETIME          NOT NULL,
    precio       DECIMAL(8,2)      NOT NULL DEFAULT 0.00,
    activo       TINYINT(1)        NOT NULL DEFAULT 1,
    CONSTRAINT fk_recurso_tipo
        FOREIGN KEY (id_tipo) REFERENCES tipo_recurso(id_tipo)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    apellidos      VARCHAR(150) NOT NULL,
    email          VARCHAR(200) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,   -- bcrypt hash
    telefono       VARCHAR(20),
    fecha_registro DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo         TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: reserva
-- ============================================================
CREATE TABLE IF NOT EXISTS reserva (
    id_reserva    INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    id_usuario    INT UNSIGNED  NOT NULL,
    id_recurso    INT UNSIGNED  NOT NULL,
    num_personas  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    fecha_reserva DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado        ENUM('pendiente','confirmada','anulada') NOT NULL DEFAULT 'pendiente',
    precio_total  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notas         TEXT,
    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reserva_recurso
        FOREIGN KEY (id_recurso) REFERENCES recurso_turistico(id_recurso)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: sesion
-- ============================================================
CREATE TABLE IF NOT EXISTS sesion (
    id_sesion        VARCHAR(128) PRIMARY KEY,
    id_usuario       INT UNSIGNED NOT NULL,
    fecha_creacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME     NOT NULL,
    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CARGA DE DATOS DESDE CSV
-- ============================================================

LOAD DATA LOCAL INFILE 'php/tipo_recurso.csv'
INTO TABLE tipo_recurso
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id_tipo, nombre, descripcion);

LOAD DATA LOCAL INFILE 'php/recurso_turistico.csv'
INTO TABLE recurso_turistico
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id_recurso, id_tipo, nombre, descripcion, plazas, fecha_inicio, fecha_fin, precio, activo);

LOAD DATA LOCAL INFILE 'php/usuario.csv'
INTO TABLE usuario
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id_usuario, nombre, apellidos, email, password, telefono, fecha_registro, activo);

LOAD DATA LOCAL INFILE 'php/reserva.csv'
INTO TABLE reserva
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id_reserva, id_usuario, id_recurso, num_personas, fecha_reserva, estado, precio_total, notas);

-- sesion.csv no se carga: las sesiones se crean en tiempo de ejecución
