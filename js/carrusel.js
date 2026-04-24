"use strict";

class Carrusel {
    constructor(busqueda) {
        this.busqueda = busqueda;
        this.actual = 0;
        this.maximo = 4;
        this.fotos = [];

        // Llamar al método para obtener las fotografías
        this.getFotografias();
    }

    getFotografias() {
        // Usar la API de Unsplash para obtener imágenes de Salamanca
        $.getJSON("https://api.unsplash.com/search/photos", {
            client_id: "-KhXDWwnlFHMsdk2YI0iaQxT3alLPOLtVNzuK-O2W4g",
            query: this.busqueda,
            per_page: 5,
            orientation: "landscape"
        })
        .done((data) => {
            console.log("Datos recibidos de Unsplash:", data);
            this.procesarJSONFotografias(data);
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            console.error("Error al cargar fotos:", textStatus, errorThrown);
            console.error("Detalles del error:", jqXHR);
        });
    }

    procesarJSONFotografias(data) {
        console.log("Procesando JSON...");
        if (data.results && data.results.length > 0) {
            // Adaptar el formato de Unsplash al formato que usa el carrusel
            this.fotos = data.results.map(photo => ({
                url: photo.urls.regular,
                title: photo.alt_description || photo.description || "Imagen de Salamanca"
            }));
            console.log("Fotos encontradas:", this.fotos.length);
            this.mostrarFotografias();
        } else {
            console.error("No se encontraron fotos en la respuesta");
            console.log("Estructura de datos recibida:", data);
        }
    }

    mostrarFotografias() {
        console.log("Mostrando fotografías...");

        // Crear el article y el h2
        let article = $("<article>");
        let h2 = $("<h2>").text("Imágenes de " + this.busqueda);

        // Obtener la primera foto
        let foto = this.fotos[0];

        console.log("URL de la primera imagen:", foto.url);

        // Crear la imagen
        let img = $("<img>").attr("src", foto.url).attr("alt", foto.title);

        // Añadir elementos al article
        article.append(h2);
        article.append(img);

        // Insertar después del header
        $("header").after(article);

        console.log("Carrusel insertado en el DOM");

        // Iniciar el cambio automático de imágenes cada 3 segundos
        setInterval(() => this.cambiarFotografia(), 3000);
    }

    cambiarFotografia() {
        this.actual++;
        if (this.actual > this.maximo) {
            this.actual = 0;
        }

        let foto = this.fotos[this.actual];

        console.log("Cambiando a imagen:", this.actual, foto.url);

        // Actualizar la imagen existente
        $("article img").attr("src", foto.url).attr("alt", foto.title);
    }
}

// Inicializar el carrusel cuando el documento esté listo
$(document).ready(() => {
    console.log("Documento listo, iniciando carrusel...");
    new Carrusel("Salamanca España monumento");
});
