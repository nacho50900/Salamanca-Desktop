<?php
/* Ignacio Hoyos Diego - UO300737 */
/* SesionManager.php - Gestión de sesiones de usuario */

declare(strict_types=1);

class SesionManager {

    private const CLAVE_USUARIO = "usuario_id";
    private const CLAVE_NOMBRE  = "usuario_nombre";
    private const DURACION      = 3600;

    public static function iniciar() {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                "lifetime" => self::DURACION,
                "path"     => "/",
                "secure"   => false,
                "httponly" => true,
                "samesite" => "Lax"
            ]);
            session_start();
        }
    }

    public static function loginUsuario($idUsuario, $nombre) {
        self::iniciar();
        session_regenerate_id(true);
        $_SESSION[self::CLAVE_USUARIO] = $idUsuario;
        $_SESSION[self::CLAVE_NOMBRE]  = $nombre;
    }

    public static function estaAutenticado() {
        self::iniciar();
        return isset($_SESSION[self::CLAVE_USUARIO]);
    }

    public static function obtenerIdUsuario() {
        self::iniciar();
        return isset($_SESSION[self::CLAVE_USUARIO])
            ? (int)$_SESSION[self::CLAVE_USUARIO]
            : null;
    }

    public static function obtenerNombreUsuario() {
        self::iniciar();
        return $_SESSION[self::CLAVE_NOMBRE] ?? null;
    }

    public static function cerrarSesion() {
        self::iniciar();
        $_SESSION = [];
        session_destroy();
    }
}
