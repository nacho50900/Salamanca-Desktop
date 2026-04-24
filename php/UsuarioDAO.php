<?php
/* Ignacio Hoyos Diego - UO300737 */
/* UsuarioDAO.php - Acceso a datos de la tabla usuario */

declare(strict_types=1);

require_once __DIR__ . "/Database.php";

class UsuarioDAO {

    protected $db;

    public function __construct() {
        $this->db = Database::obtenerInstancia()->obtenerConexion();
    }

    public function registrar($nombre, $apellidos, $email, $password, $telefono = "") {
        if ($this->existeEmail($email)) {
            return -1;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $this->db->prepare(
            "INSERT INTO usuario (nombre, apellidos, email, password, telefono)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("sssss", $nombre, $apellidos, $email, $hash, $telefono);
        $stmt->execute();
        $id = (int) $this->db->insert_id;
        $stmt->close();
        return $id;
    }

    public function autenticar($email, $password) {
        $stmt = $this->db->prepare(
            "SELECT id_usuario, nombre, apellidos, email, password
             FROM usuario WHERE email = ? AND activo = 1 LIMIT 1"
        );
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $resultado = $stmt->get_result();
        $usuario = $resultado->fetch_assoc();
        $stmt->close();

        if ($usuario && password_verify($password, $usuario["password"])) {
            unset($usuario["password"]);
            return $usuario;
        }
        return null;
    }

    public function existeEmail($email) {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) AS total FROM usuario WHERE email = ?"
        );
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $fila = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return (int)$fila["total"] > 0;
    }

    public function obtenerPorId($id) {
        $stmt = $this->db->prepare(
            "SELECT id_usuario, nombre, apellidos, email, telefono, fecha_registro
             FROM usuario WHERE id_usuario = ? AND activo = 1 LIMIT 1"
        );
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $usuario = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $usuario ?: null;
    }
}
