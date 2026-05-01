"use strict";

class Pregunta {
    constructor(enunciado, opciones, correcta) {
        this.enunciado = enunciado;
        this.opciones = opciones;
        this.correcta = correcta;
    }

    esCorrecta(indice) {
        return indice === this.correcta;
    }
}

class Juego {
    constructor(preguntas) {
        this.preguntas = preguntas;
        this.indiceActual = 0;
        this.puntuacion = 0;
        this.respondida = false;

        // Referencias DOM
        this.elInicio        = document.getElementById("juego-inicio");
        this.elPregunta      = document.getElementById("juego-pregunta");
        this.elResultado     = document.getElementById("juego-resultado");
        this.elNumPregunta   = document.getElementById("num-pregunta");
        this.elTextoPregunta = document.getElementById("texto-pregunta");
        this.elOpciones      = document.getElementById("opciones-lista");
        this.elBtnSiguiente  = document.getElementById("btn-siguiente-pregunta");
        this.elPuntuacion    = document.getElementById("puntuacion-final");
        this.elMensaje       = document.getElementById("mensaje-resultado");
        // Sin ID: la barra es el div[role="progressbar"] dentro del article de pregunta
        // y el relleno es su único div hijo
        this.elBarra         = this.elPregunta.querySelector("div[role='progressbar']");
        this.elBarraRelleno  = this.elBarra.querySelector("div");

        this.vincularBotones();
    }

    vincularBotones() {
        document.getElementById("btn-iniciar-juego")
            .addEventListener("click", () => this.iniciar());

        this.elBtnSiguiente
            .addEventListener("click", () => this.avanzar());

        document.getElementById("btn-reiniciar-juego")
            .addEventListener("click", () => this.reiniciar());
    }

    iniciar() {
        this.elInicio.hidden = true;
        this.elResultado.hidden = true;
        this.elPregunta.hidden = false;
        this.mostrarPregunta();
    }

    reiniciar() {
        this.indiceActual = 0;
        this.puntuacion = 0;
        this.respondida = false;
        this.elResultado.hidden = true;
        this.elPregunta.hidden = false;
        this.mostrarPregunta();
    }

    mostrarPregunta() {
        this.respondida = false;
        let pregunta = this.preguntas[this.indiceActual];
        let numero = this.indiceActual + 1;

        // Actualizar número y barra de progreso
        this.elNumPregunta.textContent = numero;
        let porcentaje = ((numero - 1) / this.preguntas.length) * 100;
        this.elBarraRelleno.style.width = porcentaje + "%";
        this.elBarra.setAttribute("aria-valuenow", numero - 1);

        // Actualizar texto de la pregunta
        this.elTextoPregunta.textContent = pregunta.enunciado;

        // Generar opciones
        this.elOpciones.innerHTML = "";
        pregunta.opciones.forEach((texto, indice) => {
            let li = document.createElement("li");
            let inputId = "opcion-" + indice;

            let input = document.createElement("input");
            input.type = "radio";
            input.name = "opcion";
            input.id = inputId;
            input.value = indice;

            let label = document.createElement("label");
            label.setAttribute("for", inputId);
            label.textContent = texto;

            li.appendChild(input);
            li.appendChild(label);
            this.elOpciones.appendChild(li);

            input.addEventListener("change", () => this.seleccionarOpcion(indice));
        });

        this.elBtnSiguiente.hidden = true;
    }

    seleccionarOpcion(indice) {
        if (this.respondida) return;
        this.respondida = true;

        let pregunta = this.preguntas[this.indiceActual];
        let esCorrecta = pregunta.esCorrecta(indice);

        if (esCorrecta) {
            this.puntuacion++;
        }

        // Marcar con atributos ARIA (sin clases): CSS usa li[aria-selected] y li[aria-invalid]
        let items = this.elOpciones.querySelectorAll("li");
        items.forEach((li, i) => {
            li.querySelector("input").disabled = true;
            if (i === pregunta.correcta) {
                li.setAttribute("aria-selected", "true");
            } else if (i === indice && !esCorrecta) {
                li.setAttribute("aria-invalid", "true");
            }
        });

        let esUltima = this.indiceActual === this.preguntas.length - 1;
        this.elBtnSiguiente.textContent = esUltima ? "Ver resultado" : "Siguiente pregunta";
        this.elBtnSiguiente.hidden = false;
    }

    avanzar() {
        if (!this.respondida) return;

        this.indiceActual++;
        if (this.indiceActual < this.preguntas.length) {
            this.mostrarPregunta();
        } else {
            this.mostrarResultado();
        }
    }

    mostrarResultado() {
        this.elPregunta.hidden = true;
        this.elResultado.hidden = false;
        this.elPuntuacion.textContent = this.puntuacion;
        this.elBarraRelleno.style.width = "100%";
        this.elBarra.setAttribute("aria-valuenow", this.preguntas.length);

        let mensaje;
        if (this.puntuacion === 10) {
            mensaje = "🏆 ¡Perfecto! Eres un experto en Salamanca.";
        } else if (this.puntuacion >= 7) {
            mensaje = "🌟 ¡Muy bien! Conoces Salamanca a fondo.";
        } else if (this.puntuacion >= 5) {
            mensaje = "👍 Bien, pero aún hay mucho que descubrir. ¡Explora el sitio!";
        } else {
            mensaje = "📖 Te recomendamos explorar el sitio web para conocer mejor Salamanca.";
        }
        this.elMensaje.textContent = mensaje;
    }
}

// Datos del juego: 10 preguntas sobre Salamanca
let preguntas = [
    new Pregunta(
        "¿En qué año fue fundada la Universidad de Salamanca?",
        ["1150", "1218", "1300", "1492", "1521"],
        1
    ),
    new Pregunta(
        "¿Cuál es el plato más típico de Salamanca, especialmente en el Lunes de Aguas?",
        ["Cocido madrileño", "Fabada asturiana", "Hornazo", "Chanfaina", "Patatas bravas"],
        2
    ),
    new Pregunta(
        "¿Por qué se conoce a Salamanca como la 'Ciudad Dorada'?",
        ["Por la gran cantidad de flores amarillas en sus jardines",
         "Por el color de su piedra arenisca que brilla con el sol",
         "Porque fue la ciudad más rica de España en el siglo XV",
         "Por el color del río Tormes al atardecer",
         "Por los techos dorados de su Catedral"],
        1
    ),
    new Pregunta(
        "¿Cuál es el embutido típico de Ciudad Rodrigo elaborado con harina de trigo, manteca de cerdo y anís?",
        ["Chorizo ibérico", "Morcilla de Burgos", "Farinato", "Lomo embuchado", "Salchichón"],
        2
    ),
    new Pregunta(
        "¿Qué denominación de origen tiene el jamón más famoso de la provincia de Salamanca?",
        ["Jamón de Teruel", "Jamón de Los Pedroches", "Jamón de Jabugo",
         "Jamón de Guijuelo", "Jamón de Extremadura"],
        3
    ),
    new Pregunta(
        "¿Cómo se llama el dulce típico salmantino elaborado con harina, manteca de cerdo, azúcar y anís?",
        ["Polvorones", "Mantecados", "Rosquillas", "Perrunillas", "Pestiños"],
        3
    ),
    new Pregunta(
        "¿En qué año fue declarado el casco histórico de Salamanca Patrimonio de la Humanidad por la UNESCO?",
        ["1982", "1985", "1988", "1991", "2000"],
        2
    ),
    new Pregunta(
        "¿Cómo se llama el Parque Natural ubicado en el oeste de la provincia, en la frontera con Portugal?",
        ["Parque Natural de las Hoces del Duratón",
         "Parque Natural de los Arribes del Duero",
         "Parque Natural de Las Batuecas-Sierra de Francia",
         "Parque Nacional de los Picos de Europa",
         "Parque Natural de la Alberca"],
        1
    ),
    new Pregunta(
        "¿Cuál es el punto más alto de la Sierra de Francia, donde se ubica un convento dominico?",
        ["Pico de Almanzor", "Pico de Gredos", "Peña de Francia",
         "Sierra de Béjar", "Cerro de Guadarrama"],
        2
    ),
    new Pregunta(
        "¿Qué elemento escondido en la fachada de la Universidad de Salamanca trae buena suerte según la tradición?",
        ["Un dragón", "Una rana sobre una calavera", "Una lechuza",
         "Una estrella de cinco puntas", "Un toro ibérico"],
        1
    )
];

// Inicializar el juego cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
    console.log("Documento listo, iniciando juego...");
    new Juego(preguntas);
});