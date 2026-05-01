<?php
/* Ignacio Hoyos Diego - UO300737 */
/* reservas.php - Central de reservas de Turismo Salamanca */

require_once "php/Database.php";
require_once "php/SesionManager.php";
require_once "php/UsuarioDAO.php";
require_once "php/RecursoDAO.php";
require_once "php/ReservaDAO.php";

class Reservas {

    protected $usuarioDAO;
    protected $recursoDAO;
    protected $reservaDAO;
    protected $mensajes;
    protected $reservaPresupuesto;

    public function __construct() {
        SesionManager::iniciar();
        $this->usuarioDAO = new UsuarioDAO();
        $this->recursoDAO = new RecursoDAO();
        $this->reservaDAO = new ReservaDAO();
        $this->mensajes = [];
        $this->reservaPresupuesto = null;
    }

    public function procesarAccion() {
        $accion = $_POST["accion"] ?? $_GET["accion"] ?? "";

        switch ($accion) {
            case "registrar":
                $this->procesarRegistro();
                break;
            case "login":
                $this->procesarLogin();
                break;
            case "logout":
                SesionManager::cerrarSesion();
                $this->mensajes[] = ["tipo" => "exito", "texto" => "Sesión cerrada correctamente."];
                break;
            case "reservar":
                $this->procesarReserva();
                break;
            case "confirmar":
                $this->procesarConfirmacion();
                break;
            case "anular":
                $this->procesarAnulacion();
                break;
        }

        if (SesionManager::estaAutenticado() && isset($_GET["id_reserva"])) {
            $this->reservaPresupuesto = $this->reservaDAO->obtenerPorId(
                (int)$_GET["id_reserva"],
                SesionManager::obtenerIdUsuario()
            );
        }
    }

    protected function procesarRegistro() {
        $nombre    = trim(htmlspecialchars($_POST["nombre"]    ?? "", ENT_QUOTES));
        $apellidos = trim(htmlspecialchars($_POST["apellidos"] ?? "", ENT_QUOTES));
        $email     = filter_input(INPUT_POST, "email", FILTER_VALIDATE_EMAIL);
        $password  = $_POST["password"] ?? "";
        $telefono  = trim(htmlspecialchars($_POST["telefono"]  ?? "", ENT_QUOTES));

        if (!$nombre || !$apellidos || !$email || strlen($password) < 6) {
            $this->mensajes[] = ["tipo" => "error",
                "texto" => "Completa todos los campos. La contraseña debe tener al menos 6 caracteres."];
            return;
        }

        $id = $this->usuarioDAO->registrar($nombre, $apellidos, $email, $password, $telefono);
        if ($id === -1) {
            $this->mensajes[] = ["tipo" => "error", "texto" => "El email ya está registrado."];
        } elseif ($id > 0) {
            SesionManager::loginUsuario($id, $nombre);
            $this->mensajes[] = ["tipo" => "exito", "texto" => "¡Bienvenido, " . $nombre . "! Tu cuenta ha sido creada."];
        } else {
            $this->mensajes[] = ["tipo" => "error", "texto" => "Error al crear la cuenta. Inténtalo de nuevo."];
        }
    }

    protected function procesarLogin() {
        $email    = filter_input(INPUT_POST, "email", FILTER_VALIDATE_EMAIL);
        $password = $_POST["password"] ?? "";

        if (!$email || !$password) {
            $this->mensajes[] = ["tipo" => "error", "texto" => "Introduce tu email y contraseña."];
            return;
        }

        $usuario = $this->usuarioDAO->autenticar($email, $password);
        if ($usuario) {
            SesionManager::loginUsuario((int)$usuario["id_usuario"], $usuario["nombre"]);
            $this->mensajes[] = ["tipo" => "exito", "texto" => "¡Bienvenido de nuevo, " . $usuario["nombre"] . "!"];
        } else {
            $this->mensajes[] = ["tipo" => "error", "texto" => "Email o contraseña incorrectos."];
        }
    }

    protected function procesarReserva() {
        if (!SesionManager::estaAutenticado()) {
            $this->mensajes[] = ["tipo" => "error", "texto" => "Debes iniciar sesión para realizar una reserva."];
            return;
        }

        $idRecurso   = (int)($_POST["id_recurso"]   ?? 0);
        $numPersonas = (int)($_POST["num_personas"] ?? 1);
        $notas       = trim(htmlspecialchars($_POST["notas"] ?? "", ENT_QUOTES));

        if ($idRecurso <= 0 || $numPersonas < 1) {
            $this->mensajes[] = ["tipo" => "error", "texto" => "Selecciona un recurso y número de personas válidos."];
            return;
        }

        $idUsuario = SesionManager::obtenerIdUsuario();
        $idReserva = $this->reservaDAO->crear($idUsuario, $idRecurso, $numPersonas, $notas);

        if ($idReserva === -1) {
            $this->mensajes[] = ["tipo" => "error", "texto" => "El recurso seleccionado no existe."];
        } elseif ($idReserva === -2) {
            $this->mensajes[] = ["tipo" => "error", "texto" => "No hay suficientes plazas disponibles."];
        } elseif ($idReserva > 0) {
            $this->mensajes[] = ["tipo" => "exito",
                "texto" => "Reserva #" . $idReserva . " creada. Revisa el presupuesto y confírmala."];
            $this->reservaPresupuesto = $this->reservaDAO->obtenerPorId($idReserva, $idUsuario);
        }
    }

    protected function procesarConfirmacion() {
        if (!SesionManager::estaAutenticado()) {
            $this->mensajes[] = ["tipo" => "error", "texto" => "Debes iniciar sesión."];
            return;
        }

        $idReserva = (int)($_POST["id_reserva"] ?? 0);
        $idUsuario = SesionManager::obtenerIdUsuario();

        if ($this->reservaDAO->confirmar($idReserva, $idUsuario)) {
            $this->mensajes[] = ["tipo" => "exito", "texto" => "Reserva #" . $idReserva . " confirmada. ¡Disfruta de Salamanca!"];
        } else {
            $this->mensajes[] = ["tipo" => "error", "texto" => "No se pudo confirmar la reserva."];
        }
    }

    protected function procesarAnulacion() {
        if (!SesionManager::estaAutenticado()) {
            $this->mensajes[] = ["tipo" => "error", "texto" => "Debes iniciar sesión."];
            return;
        }

        $idReserva = (int)($_POST["id_reserva"] ?? 0);
        $idUsuario = SesionManager::obtenerIdUsuario();

        if ($this->reservaDAO->anular($idReserva, $idUsuario)) {
            $this->mensajes[] = ["tipo" => "exito", "texto" => "Reserva #" . $idReserva . " anulada correctamente."];
        } else {
            $this->mensajes[] = ["tipo" => "error", "texto" => "No se pudo anular la reserva."];
        }
    }

    public function mostrarMensajes() {
        foreach ($this->mensajes as $msg) {
            /* Sin clases: éxito → aria-live="polite", error → role="alert" */
            if ($msg["tipo"] === "exito") {
                echo "<p aria-live='polite'>" . htmlspecialchars($msg["texto"], ENT_QUOTES) . "</p>";
            } else {
                echo "<p role='alert'>" . htmlspecialchars($msg["texto"], ENT_QUOTES) . "</p>";
            }
        }
    }

    public function mostrarFormularioAcceso() {
        if (SesionManager::estaAutenticado()) return;
        ?>
        <section>
            <h2>Accede o regístrate para reservar</h2>

            <article>
                <h3>Iniciar sesión</h3>
                <form method="post" action="reservas.php">
                    <input type="hidden" name="accion" value="login" />
                    <div>
                        <label for="login-email">Email <abbr title="obligatorio">*</abbr></label>
                        <input type="email" id="login-email" name="email" required autocomplete="email" placeholder="tu@email.com" />
                    </div>
                    <div>
                        <label for="login-password">Contraseña <abbr title="obligatorio">*</abbr></label>
                        <input type="password" id="login-password" name="password" required autocomplete="current-password" />
                    </div>
                    <button type="submit">Iniciar sesión</button>
                </form>
            </article>

            <article>
                <h3>Crear cuenta nueva</h3>
                <form method="post" action="reservas.php">
                    <input type="hidden" name="accion" value="registrar" />
                    <div>
                        <label for="reg-nombre">Nombre <abbr title="obligatorio">*</abbr></label>
                        <input type="text" id="reg-nombre" name="nombre" required autocomplete="given-name" />
                    </div>
                    <div>
                        <label for="reg-apellidos">Apellidos <abbr title="obligatorio">*</abbr></label>
                        <input type="text" id="reg-apellidos" name="apellidos" required autocomplete="family-name" />
                    </div>
                    <div>
                        <label for="reg-email">Email <abbr title="obligatorio">*</abbr></label>
                        <input type="email" id="reg-email" name="email" required autocomplete="email" />
                    </div>
                    <div>
                        <label for="reg-password">Contraseña <abbr title="obligatorio">*</abbr></label>
                        <input type="password" id="reg-password" name="password" required autocomplete="new-password" minlength="6" />
                    </div>
                    <div>
                        <label for="reg-telefono">Teléfono</label>
                        <input type="tel" id="reg-telefono" name="telefono" autocomplete="tel" placeholder="+34 600 000 000" />
                    </div>
                    <button type="submit">Crear cuenta</button>
                </form>
            </article>
        </section>
        <?php
    }

    public function mostrarZonaAutenticada() {
        if (!SesionManager::estaAutenticado()) return;

        $nombreUsuario = SesionManager::obtenerNombreUsuario();
        $idUsuario     = SesionManager::obtenerIdUsuario();
        $recursos      = $this->recursoDAO->obtenerTodos();
        $misReservas   = $this->reservaDAO->obtenerPorUsuario($idUsuario);
        ?>
        <section>
            <h2>Bienvenido, <?php echo htmlspecialchars($nombreUsuario, ENT_QUOTES); ?></h2>
            <form method="post" action="reservas.php" style="display:inline">
                <input type="hidden" name="accion" value="logout" />
                <button type="submit">Cerrar sesión</button>
            </form>
        </section>

        <section>
            <h2>Presupuesto de tu reserva</h2>
            <?php if ($this->reservaPresupuesto): ?>
            <article>
                <p><strong>Reserva nº:</strong> <?php echo (int)$this->reservaPresupuesto["id_reserva"]; ?></p>
                <p><strong>Recurso:</strong> <?php echo htmlspecialchars($this->reservaPresupuesto["recurso_nombre"], ENT_QUOTES); ?></p>
                <p><strong>Tipo:</strong> <?php echo htmlspecialchars($this->reservaPresupuesto["tipo"], ENT_QUOTES); ?></p>
                <p><strong>Disponible:</strong>
                    <?php echo (new DateTime($this->reservaPresupuesto["fecha_inicio"]))->format("d/m/Y H:i"); ?>
                    - <?php echo (new DateTime($this->reservaPresupuesto["fecha_fin"]))->format("d/m/Y H:i"); ?>
                </p>
                <p><strong>Personas:</strong> <?php echo (int)$this->reservaPresupuesto["num_personas"]; ?></p>
                <p><strong>Precio/persona:</strong> <?php echo number_format((float)$this->reservaPresupuesto["precio_unitario"], 2); ?> €</p>
                <p><strong>Total: <?php echo number_format((float)$this->reservaPresupuesto["precio_total"], 2); ?> €</strong></p>
                <p><strong>Estado:</strong> <?php echo htmlspecialchars(ucfirst($this->reservaPresupuesto["estado"]), ENT_QUOTES); ?></p>

                <?php if ($this->reservaPresupuesto["estado"] === "pendiente"): ?>
                <form method="post" action="reservas.php" style="display:inline">
                    <input type="hidden" name="accion" value="confirmar" />
                    <input type="hidden" name="id_reserva" value="<?php echo (int)$this->reservaPresupuesto["id_reserva"]; ?>" />
                    <button type="submit">Confirmar reserva</button>
                </form>
                <form method="post" action="reservas.php" style="display:inline">
                    <input type="hidden" name="accion" value="anular" />
                    <input type="hidden" name="id_reserva" value="<?php echo (int)$this->reservaPresupuesto["id_reserva"]; ?>" />
                    <button type="submit">Anular</button>
                </form>
                <?php endif; ?>
            </article>
            <?php else: ?>
            <p>No hay ninguna reserva seleccionada.</p>
            <?php endif; ?>
        </section>

        <section>
            <h2>Mis reservas</h2>
            <?php if (empty($misReservas)): ?>
                <p>No tienes reservas registradas.</p>
            <?php else: ?>
                <?php foreach ($misReservas as $reserva): ?>
                <article>
                    <h3>
                        <?php echo htmlspecialchars($reserva["recurso_nombre"], ENT_QUOTES); ?>
                        <small>(<?php echo htmlspecialchars($reserva["tipo"], ENT_QUOTES); ?>)</small>
                    </h3>
                    <ul>
                        <li><strong>Reserva nº:</strong> <?php echo (int)$reserva["id_reserva"]; ?></li>
                        <li><strong>Fecha de reserva:</strong>
                            <?php echo (new DateTime($reserva["fecha_reserva"]))->format("d/m/Y H:i"); ?>
                        </li>
                        <li><strong>Personas:</strong> <?php echo (int)$reserva["num_personas"]; ?></li>
                        <li><strong>Total:</strong> <?php echo number_format((float)$reserva["precio_total"], 2); ?> €</li>
                        <li><strong>Estado:</strong> <?php echo htmlspecialchars(ucfirst($reserva["estado"]), ENT_QUOTES); ?></li>
                    </ul>
                    <?php if (in_array($reserva["estado"], ["pendiente", "confirmada"])): ?>
                    <form method="post" action="reservas.php">
                        <input type="hidden" name="accion" value="anular" />
                        <input type="hidden" name="id_reserva" value="<?php echo (int)$reserva["id_reserva"]; ?>" />
                        <button type="submit">Anular reserva</button>
                    </form>
                    <?php endif; ?>
                </article>
                <?php endforeach; ?>
            <?php endif; ?>
        </section>
        
        <div>
            <h2>Recursos turísticos disponibles</h2>
            <section>
                <?php if (empty($recursos)): ?>
                    <p>No hay recursos disponibles en este momento.</p>
                <?php else: ?>
                    <?php foreach ($recursos as $recurso): ?>
                <article>
                    <h3>
                        <?php echo htmlspecialchars($recurso["nombre"], ENT_QUOTES); ?>
                        <small>(<?php echo htmlspecialchars($recurso["tipo"], ENT_QUOTES); ?>)</small>
                    </h3>
                    <p><?php echo htmlspecialchars($recurso["descripcion"], ENT_QUOTES); ?></p>
                    <ul>
                        <li><strong>Precio:</strong> <?php echo number_format((float)$recurso["precio"], 2); ?> €/persona</li>
                        <li><strong>Disponible:</strong>
                            <?php echo (new DateTime($recurso["fecha_inicio"]))->format("d/m/Y H:i"); ?>
                            al <?php echo (new DateTime($recurso["fecha_fin"]))->format("d/m/Y H:i"); ?>
                        </li>
                        <li><strong>Plazas disponibles:</strong>
                            <?php echo $this->recursoDAO->plazasDisponibles((int)$recurso["id_recurso"]); ?>
                        </li>
                    </ul>
                    <form method="post" action="reservas.php">
                        <input type="hidden" name="accion" value="reservar" />
                        <input type="hidden" name="id_recurso" value="<?php echo (int)$recurso["id_recurso"]; ?>" />
                        <div>
                            <label for="personas-<?php echo (int)$recurso["id_recurso"]; ?>">Número de personas</label>
                            <input type="number"
                                   id="personas-<?php echo (int)$recurso["id_recurso"]; ?>"
                                   name="num_personas" min="1"
                                   max="<?php echo $this->recursoDAO->plazasDisponibles((int)$recurso["id_recurso"]); ?>"
                                   value="1" />
                        </div>
                        <div>
                            <label for="notas-<?php echo (int)$recurso["id_recurso"]; ?>">Notas</label>
                            <textarea id="notas-<?php echo (int)$recurso["id_recurso"]; ?>" name="notas" rows="2"></textarea>
                        </div>
                        <button type="submit">Reservar</button>
                    </form>
                </article>
                <?php endforeach; ?>
                <?php endif; ?>
            </section>
        </div>

        <?php
    }
}

$reservas = new Reservas();
$reservas->procesarAccion();
?>
<!DOCTYPE HTML>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Reservas - Turismo Salamanca</title>

    <link rel="stylesheet" type="text/css" href="estilo/estilo.css" />
    <link rel="stylesheet" type="text/css" href="estilo/layout.css" />
    <link rel="stylesheet" type="text/css" href="estilo/menu-movil.css" />
    <link rel="icon" type="image/ico" href="multimedia/favicon.ico" />

    <meta name="author" content="Ignacio - UO300737" />
    <meta name="description" content="Central de reservas de recursos turísticos de Salamanca" />
    <meta name="keywords" content="reservas, turismo, Salamanca, hoteles, museos, actividades" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <script src="js/menu-movil.js"></script>
</head>

<body>

    <header>
        <h1>
            <a href="index.html" title="Página principal">Turismo Salamanca</a>
        </h1>

        <button id="btn-menu" aria-label="Abrir menú de navegación" aria-expanded="false">☰ Menú</button>

        <nav>
            <a href="index.html" title="Página principal">Inicio</a>
            <a href="gastronomia.html" title="Gastronomía de Salamanca">Gastronomía</a>
            <a href="rutas.html" title="Rutas turísticas">Rutas</a>
            <a href="meteorologia.html" title="Meteorología de Salamanca">Meteorología</a>
            <a href="juego.html" title="Juego sobre Salamanca">Juego</a>
            <a href="reservas.php" title="Reservas de recursos turísticos" class="active">Reservas</a>
            <a href="ayuda.html" title="Ayuda y manual de uso">Ayuda</a>
        </nav>

        <p>Estás en: <a href="index.html" title="Página principal">Inicio</a> >> <strong>Reservas</strong></p>
    </header>

    <main>
        <h2>Central de Reservas</h2>

        <?php $reservas->mostrarMensajes(); ?>
        <?php $reservas->mostrarFormularioAcceso(); ?>
        <?php $reservas->mostrarZonaAutenticada(); ?>
    </main>

    <footer>
        <p>2026 Turismo Salamanca - UO300737 - Software y estándares para la Web</p>
    </footer>
</body>
</html>