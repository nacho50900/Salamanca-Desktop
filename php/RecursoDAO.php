<?php
/* Ignacio Hoyos Diego - UO300737 */
/* RecursoDAO.php - Acceso a datos de recursos turísticos */

declare(strict_types=1);

require_once __DIR__ . "/Database.php";

class RecursoDAO {

    protected $db;

    public function __construct() {
        $this->db = Database::obtenerInstancia()->obtenerConexion();
    }

    public function obtenerTodos() {
        $resultado = $this->db->query(
            "SELECT r.id_recurso, r.nombre, r.descripcion, r.plazas,
                    r.fecha_inicio, r.fecha_fin, r.precio,
                    t.nombre AS tipo
             FROM recurso_turistico r
             JOIN tipo_recurso t ON r.id_tipo = t.id_tipo
             WHERE r.activo = 1
             ORDER BY t.nombre, r.nombre"
        );
        return $resultado->fetch_all(MYSQLI_ASSOC);
    }

    public function obtenerPorId($id) {
        $stmt = $this->db->prepare(
            "SELECT r.id_recurso, r.nombre, r.descripcion, r.plazas,
                    r.fecha_inicio, r.fecha_fin, r.precio,
                    t.nombre AS tipo
             FROM recurso_turistico r
             JOIN tipo_recurso t ON r.id_tipo = t.id_tipo
             WHERE r.id_recurso = ? AND r.activo = 1 LIMIT 1"
        );
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $recurso = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $recurso ?: null;
    }

    public function plazasDisponibles($idRecurso) {
        $recurso = $this->obtenerPorId($idRecurso);
        if (!$recurso) return 0;

        $stmt = $this->db->prepare(
            "SELECT COALESCE(SUM(num_personas), 0) AS ocupadas
             FROM reserva
             WHERE id_recurso = ? AND estado IN ('pendiente','confirmada')"
        );
        $stmt->bind_param("i", $idRecurso);
        $stmt->execute();
        $fila = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        return max(0, (int)$recurso["plazas"] - (int)$fila["ocupadas"]);
    }
}
