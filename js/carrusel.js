"use strict";

class Carrusel {
    constructor(imagenes) {
        this.imagenes = imagenes;
        this.actual = 0;
        this.maximo = imagenes.length - 1;

        // Llamar al metodo para mostrar las fotografias
        this.mostrarFotografias();
    }

    mostrarFotografias() {
        console.log("Mostrando fotografias...");

        // Crear el article y el h2
        let article = $("<article>");
        let h2 = $("<h2>").text("Principales recursos turísticos de Salamanca");

        // Obtener la primera foto
        let foto = this.imagenes[0];

        console.log("URL de la primera imagen:", foto.url);

        // Crear la imagen
        let img = $("<img>")
            .attr("src", foto.url)
            .attr("alt", foto.title);

        // Crear el pie de foto
        let figcaption = $("<figcaption>").text(foto.title);

        // Envolver imagen y pie en un figure
        let figure = $("<figure>").append(img).append(figcaption);

        // Anadir elementos al article
        article.append(h2);
        article.append(figure);

        // Insertar despues del header
        $("header").after(article);

        console.log("Carrusel insertado en el DOM");

        // Iniciar el cambio automatico de imagenes cada 3 segundos
        setInterval(() => this.cambiarFotografia(), 3000);
    }

    cambiarFotografia() {
        this.actual++;
        if (this.actual > this.maximo) {
            this.actual = 0;
        }

        let foto = this.imagenes[this.actual];

        console.log("Cambiando a imagen:", this.actual, foto.url);

        // Actualizar la imagen y el pie de foto existentes
        $("header + article figure img").attr("src", foto.url).attr("alt", foto.title);
        $("header + article figure figcaption").text(foto.title);
    }
}

// Inicializar el carrusel cuando el documento este listo
$(document).ready(() => {
    console.log("Documento listo, iniciando carrusel...");

    // Imagenes locales de la carpeta multimedia/
    let imagenes = [
        { url: "multimedia/carrusel-mapa-salamanca.jpg",   title: "Mapa de situación de la provincia de Salamanca" },
        { url: "multimedia/carrusel-plaza-mayor.jpg",      title: "Plaza Mayor de Salamanca" },
        { url: "multimedia/carrusel-catedral.jpg",         title: "Catedral Nueva de Salamanca" },
        { url: "multimedia/carrusel-arribes.jpg",          title: "Arribes del Duero" },
        { url: "multimedia/carrusel-alberca.jpg",          title: "La Alberca" }
    ];

    new Carrusel(imagenes);
});