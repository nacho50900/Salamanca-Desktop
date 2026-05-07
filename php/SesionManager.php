<?php
/* Ignacio Hoyos Diego - UO300737 */
/* SesionManager.php - Gestión de sesiones con persistencia en base de datos */

declare(strict_types=1);

require_once __DIR__ . "/SesionDAO.php";

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

        /* Limpiar sesiones expiradas en BD de forma periódica (1 de cada 10 requests) */
        if (mt_rand(1, 10) === 1) {
            (new SesionDAO())->limpiarExpiradas();
        }
    }

    public static function loginUsuario(int $idUsuario, string $nombre): void {
        self::iniciar();
        session_regenerate_id(true);

        $_SESSION[self::CLAVE_USUARIO] = $idUsuario;
        $_SESSION[self::CLAVE_NOMBRE]  = $nombre;

        /* Persistir la sesión en la base de datos */
        (new SesionDAO())->guardar(session_id(), $idUsuario, self::DURACION);
    }

    public static function estaAutenticado(): bool {
        self::iniciar();

        /* Verificación doble: $_SESSION + registro vigente en BD */
        if (!isset($_SESSION[self::CLAVE_USUARIO])) {
            return false;
        }

        $idEnBD = (new SesionDAO())->validar(session_id());

        if ($idEnBD === null) {
            /* La sesión expiró o fue eliminada en BD: limpiar también $_SESSION */
            $_SESSION = [];
            return false;
        }

        return true;
    }

    public static function obtenerIdUsuario(): ?int {
        self::iniciar();
        return isset($_SESSION[self::CLAVE_USUARIO])
            ? (int)$_SESSION[self::CLAVE_USUARIO]
            : null;
    }

    public static function obtenerNombreUsuario(): ?string {
        self::iniciar();
        return $_SESSION[self::CLAVE_NOMBRE] ?? null;
    }

    public static function cerrarSesion(): void {
        self::iniciar();

        /* Eliminar la sesión de la base de datos */
        (new SesionDAO())->eliminar(session_id());

        $_SESSION = [];
        session_destroy();
    }
}