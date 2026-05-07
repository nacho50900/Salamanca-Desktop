<?php
/* Ignacio Hoyos Diego - UO300737 */
/* SesionDAO.php - Persistencia de sesiones en la base de datos */

declare(strict_types=1);

require_once __DIR__ . "/Database.php";

class SesionDAO {

    protected $db;

    public function __construct() {
        $this->db = Database::obtenerInstancia()->obtenerConexion();
    }

    /**
     * Inserta o actualiza una sesión activa para el usuario.
     * Usa REPLACE INTO para manejar reconexiones con el mismo session_id.
     */
    public function guardar(string $idSesion, int $idUsuario, int $duracionSegundos = 3600): bool {
        $stmt = $this->db->prepare(
            "REPLACE INTO sesion (id_sesion, id_usuario, fecha_creacion, fecha_expiracion)
             VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND))"
        );
        $stmt->bind_param("sii", $idSesion, $idUsuario, $duracionSegundos);
        $stmt->execute();
        $ok = $stmt->affected_rows > 0;
        $stmt->close();
        return $ok;
    }

    /**
     * Comprueba si una sesión existe en BD y no ha expirado.
     * Devuelve el id_usuario si es válida, null si no.
     */
    public function validar(string $idSesion): ?int {
        $stmt = $this->db->prepare(
            "SELECT id_usuario FROM sesion
             WHERE id_sesion = ? AND fecha_expiracion > NOW()
             LIMIT 1"
        );
        $stmt->bind_param("s", $idSesion);
        $stmt->execute();
        $fila = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $fila ? (int)$fila["id_usuario"] : null;
    }

    /**
     * Elimina la sesión de la BD al hacer logout.
     */
    public function eliminar(string $idSesion): bool {
        $stmt = $this->db->prepare(
            "DELETE FROM sesion WHERE id_sesion = ?"
        );
        $stmt->bind_param("s", $idSesion);
        $stmt->execute();
        $ok = $stmt->affected_rows > 0;
        $stmt->close();
        return $ok;
    }

    /**
     * Limpia las sesiones expiradas de la BD.
     * Se llama al iniciar sesión para mantener la tabla ordenada.
     */
    public function limpiarExpiradas(): void {
        $this->db->query("DELETE FROM sesion WHERE fecha_expiracion <= NOW()");
    }
}