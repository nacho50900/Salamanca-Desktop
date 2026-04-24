<?php
/* Ignacio Hoyos Diego - UO300737 */
/* ReservaDAO.php - Acceso a datos de la tabla reserva */

declare(strict_types=1);

require_once __DIR__ . "/Database.php";
require_once __DIR__ . "/RecursoDAO.php";

class ReservaDAO {

    protected $db;
    protected $recursoDAO;

    public function __construct() {
        $this->db = Database::obtenerInstancia()->obtenerConexion();
        $this->recursoDAO = new RecursoDAO();
    }

    public function crear($idUsuario, $idRecurso, $numPersonas, $notas = "") {
        $recurso = $this->recursoDAO->obtenerPorId($idRecurso);
        if (!$recurso) return -1;

        $disponibles = $this->recursoDAO->plazasDisponibles($idRecurso);
        if ($numPersonas > $disponibles) return -2;

        $precioTotal = round($recurso["precio"] * $numPersonas, 2);

        $stmt = $this->db->prepare(
            "INSERT INTO reserva (id_usuario, id_recurso, num_personas, estado, precio_total, notas)
             VALUES (?, ?, ?, 'pendiente', ?, ?)"
        );
        $stmt->bind_param("iiids", $idUsuario, $idRecurso, $numPersonas, $precioTotal, $notas);
        $stmt->execute();
        $id = (int) $this->db->insert_id;
        $stmt->close();
        return $id;
    }

    public function confirmar($idReserva, $idUsuario) {
        $stmt = $this->db->prepare(
            "UPDATE reserva SET estado = 'confirmada'
             WHERE id_reserva = ? AND id_usuario = ? AND estado = 'pendiente'"
        );
        $stmt->bind_param("ii", $idReserva, $idUsuario);
        $stmt->execute();
        $afectadas = $stmt->affected_rows;
        $stmt->close();
        return $afectadas > 0;
    }

    public function anular($idReserva, $idUsuario) {
        $stmt = $this->db->prepare(
            "UPDATE reserva SET estado = 'anulada'
             WHERE id_reserva = ? AND id_usuario = ? AND estado IN ('pendiente','confirmada')"
        );
        $stmt->bind_param("ii", $idReserva, $idUsuario);
        $stmt->execute();
        $afectadas = $stmt->affected_rows;
        $stmt->close();
        return $afectadas > 0;
    }

    public function obtenerPorUsuario($idUsuario) {
        $stmt = $this->db->prepare(
            "SELECT rv.id_reserva, rv.num_personas, rv.fecha_reserva,
                    rv.estado, rv.precio_total, rv.notas,
                    r.nombre AS recurso_nombre, r.fecha_inicio, r.fecha_fin,
                    t.nombre AS tipo
            FROM reserva rv
            JOIN recurso_turistico r ON rv.id_recurso = r.id_recurso
            JOIN tipo_recurso t ON r.id_tipo = t.id_tipo
            WHERE rv.id_usuario = ? AND rv.estado = 'confirmada'
            ORDER BY rv.fecha_reserva DESC"
        );
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $reservas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $reservas;
    }

    public function obtenerPorId($idReserva, $idUsuario) {
        $stmt = $this->db->prepare(
            "SELECT rv.*, r.nombre AS recurso_nombre, r.descripcion AS recurso_descripcion,
                    r.precio AS precio_unitario, r.fecha_inicio, r.fecha_fin,
                    t.nombre AS tipo
             FROM reserva rv
             JOIN recurso_turistico r ON rv.id_recurso = r.id_recurso
             JOIN tipo_recurso t ON r.id_tipo = t.id_tipo
             WHERE rv.id_reserva = ? AND rv.id_usuario = ? LIMIT 1"
        );
        $stmt->bind_param("ii", $idReserva, $idUsuario);
        $stmt->execute();
        $reserva = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $reserva ?: null;
    }
}
