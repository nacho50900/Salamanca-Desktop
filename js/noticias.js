"use strict";

class Noticias {
    constructor(query, maxNoticias) {
        this.query = query;
        this.maxNoticias = maxNoticias || 6;
        this.urlRSS = "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=es&gl=ES&ceid=ES:es";

        // Llamar al método para obtener las noticias
        this.getNoticias();
    }

    getNoticias() {
        // Proxy público para acceder al RSS de Google News
        let urlProxy = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(this.urlRSS);

        $.getJSON(urlProxy)
        .done((data) => {
            console.log("Noticias recibidas:", data);
            this.procesarJSONNoticias(data);
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            console.error("Error al cargar noticias:", textStatus, errorThrown);
            this.mostrarError();
        });
    }

    procesarJSONNoticias(data) {
        console.log("Procesando noticias...");
        if (data.items && data.items.length > 0) {
            this.mostrarNoticias(data.items.slice(0, this.maxNoticias));
        } else {
            console.error("No se encontraron noticias en la respuesta");
            this.mostrarError();
        }
    }

    mostrarNoticias(noticias) {
        let $contenedor = $("main > section:last-of-type > aside");
        $contenedor.empty();

        noticias.forEach((noticia) => {
            let fecha = new Date(noticia.pubDate).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });

            let descripcion = noticia.description
                ? noticia.description.replace(/<[^>]*>/g, "").substring(0, 150) + "…"
                : "Sin descripción disponible.";

            let article = $("<article>");
            let h3 = $("<h3>").text(noticia.title);
            let time = $("<time>").attr("datetime", noticia.pubDate).text(fecha);
            let p = $("<p>").text(descripcion);
            let a = $("<a>")
                .attr("href", noticia.link)
                .attr("target", "_blank")
                .attr("rel", "noopener noreferrer")
                .text("Leer más →");

            article.append(h3).append(time).append(p).append(a);
            $contenedor.append(article);
        });

        console.log("Noticias insertadas en el DOM");
    }

    mostrarError() {
        $("main > section:last-of-type > aside").html(
            "<p>No se pudieron cargar las noticias en este momento. " +
            "Consulta las últimas noticias sobre Salamanca en " +
            "<a href='https://www.elnortedecastilla.es/salamanca/' " +
            "target='_blank' rel='noopener noreferrer'>El Norte de Castilla</a>.</p>"
        );
    }
}

// Inicializar las noticias cuando el documento esté listo
$(document).ready(() => {
    console.log("Documento listo, iniciando noticias...");
    new Noticias("Salamanca turismo", 6);
});
