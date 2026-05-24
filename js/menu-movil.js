"use strict";

class MenuMovil {
    constructor() {
        // Esperar a que el DOM esté listo
        document.addEventListener("DOMContentLoaded", () => {
            this.inicializar();
        });
    }

    inicializar() {
        let boton = document.getElementById("btn-menu");
        let nav = document.querySelector("header > nav");

        if (boton && nav) {
            boton.addEventListener("click", () => {
                this.toggleMenu(boton, nav);
            });

            // Cerrar menú al hacer clic en un enlace
            nav.querySelectorAll("a").forEach((enlace) => {
                enlace.addEventListener("click", () => {
                    this.cerrarMenu(boton, nav);
                });
            });

            // Cerrar menú al hacer clic fuera
            document.addEventListener("click", (evento) => {
                if (!nav.contains(evento.target) && !boton.contains(evento.target)) {
                    this.cerrarMenu(boton, nav);
                }
            });

            console.log("Menú móvil inicializado");
        }
    }

    toggleMenu(boton, nav) {
        let visible = nav.getAttribute("aria-expanded") === "true";
        nav.setAttribute("aria-expanded", (!visible).toString());
        boton.setAttribute("aria-expanded", (!visible).toString());
        console.log("Menú móvil:", !visible ? "abierto" : "cerrado");
    }

    cerrarMenu(boton, nav) {
        nav.setAttribute("aria-expanded", "false");
        boton.setAttribute("aria-expanded", "false");
    }
}

// Inicializar el menú móvil
new MenuMovil();
