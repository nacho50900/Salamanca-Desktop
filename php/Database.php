<?php
/* Ignacio Hoyos Diego - UO300737 */
/* Database.php - Clase singleton para la conexión a MySQL */

declare(strict_types=1);

class Database {

    protected static $instancia = null;
    protected $conexion;

    private const HOST    = "localhost";
    private const USUARIO = "DBUSER2026";
    private const PASSWORD = "DBPWD2026";
    private const BD      = "turismo_salamanca";
    private const CHARSET = "utf8mb4";

    protected function __construct() {
        $this->conexion = new mysqli(
            self::HOST,
            self::USUARIO,
            self::PASSWORD,
            self::BD
        );

        if ($this->conexion->connect_error) {
            throw new RuntimeException(
                "Error de conexión a la base de datos: " . $this->conexion->connect_error
            );
        }

        $this->conexion->set_charset(self::CHARSET);
    }

    public static function obtenerInstancia() {
        if (self::$instancia === null) {
            self::$instancia = new self();
        }
        return self::$instancia;
    }

    public function obtenerConexion() {
        return $this->conexion;
    }

    public function cerrar() {
        $this->conexion->close();
        self::$instancia = null;
    }

    private function __clone() {}
}
