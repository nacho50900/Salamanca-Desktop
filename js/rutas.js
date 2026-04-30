"use strict";

class GestorRutas {
    constructor(xmlPath) {
        this.xmlPath = xmlPath;
        this.rutas = [];
        this.indiceActivo = 0;

        this.cargarXML();
    }

    cargarXML() {
        $.ajax({
            url: this.xmlPath,
            method: "GET",
            dataType: "xml",
            success: (xmlDoc) => {
                console.log("XML de rutas cargado correctamente");
                this.parsearXML(xmlDoc);
                this.renderizarTabs();
                this.mostrarRuta(0);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.error("Error al cargar rutas.xml:", textStatus, errorThrown);
                $("main > section nav").html("<p>Error al cargar las rutas. Comprueba que rutas.xml está disponible.</p>");
            }
        });
    }

    parsearXML(xmlDoc) {
        let $rutas = $(xmlDoc).find("ruta");

        $rutas.each((i, rutaElem) => {
            let $ruta = $(rutaElem);
            let hitos = [];
            let referencias = [];

            $ruta.find("hito").each((j, hitoElem) => {
                let $hito = $(hitoElem);
                let fotos = [];
                let videos = [];

                $hito.find("fotos foto").each((k, f) => fotos.push($(f).text().trim()));
                $hito.find("videos video").each((k, v) => videos.push($(v).text().trim()));

                let coordHito = $hito.find("coordenadas").first();
                hitos.push({
                    id:                $hito.attr("id"),
                    nombre:            $hito.find("nombre").first().text().trim(),
                    descripcion:       $hito.find("descripcion").first().text().trim(),
                    longitud:          parseFloat(coordHito.find("longitud").text()),
                    latitud:           parseFloat(coordHito.find("latitud").text()),
                    altitud:           parseInt(coordHito.find("altitud").text()),
                    distancia:         $hito.find("distanciaDesdeAnterior").text().trim(),
                    unidadesDistancia: $hito.find("distanciaDesdeAnterior").attr("unidades"),
                    fotos:             fotos,
                    videos:            videos
                });
            });

            $ruta.find("referencias referencia").each((k, r) => {
                referencias.push($(r).text().trim());
            });

            let coordInicio = $ruta.find("coordenadasInicio").first();
            this.rutas.push({
                id:            $ruta.attr("id"),
                nombre:        $ruta.find("> nombre").text().trim(),
                tipo:          $ruta.find("> tipo").text().trim(),
                transporte:    $ruta.find("> transporte").text().trim(),
                duracion:      $ruta.find("> duracion").text().trim(),
                agencia:       $ruta.find("> agencia").text().trim(),
                descripcion:   $ruta.find("> descripcion").text().trim(),
                personas:      $ruta.find("> personas").text().trim(),
                lugarInicio:   $ruta.find("> lugarInicio").text().trim(),
                recomendacion: $ruta.find("> recomendacion").text().trim(),
                lonInicio:     parseFloat(coordInicio.find("longitud").text()),
                latInicio:     parseFloat(coordInicio.find("latitud").text()),
                referencias:   referencias,
                hitos:         hitos,
                planimetria:   $ruta.find("> planimetria").text().trim(),
                altimetria:    $ruta.find("> altimetria").text().trim()
            });
        });

        console.log("Rutas parseadas:", this.rutas.length);
    }

    renderizarTabs() {
        let $tabs = $("main > section nav");
        $tabs.empty();

        this.rutas.forEach((ruta, indice) => {
            let $btn = $("<button>")
                .attr("type", "button")
                .text(ruta.nombre)
                .on("click", () => {
                    $tabs.find("button").removeClass("active");
                    $btn.addClass("active");
                    this.mostrarRuta(indice);
                });

            if (indice === 0) $btn.addClass("active");
            $tabs.append($btn);
        });
    }

    mostrarRuta(indice) {
        this.indiceActivo = indice;
        let ruta = this.rutas[indice];

        // Mostrar los contenedores que estaban ocultos
        $("#info-ruta").prop("hidden", false);
        $("#mapa-ruta").prop("hidden", false);
        $("#altimetria-ruta").prop("hidden", false);
        $("main > h2:nth-of-type(2)").prop("hidden", false);
        $("main > h2:nth-of-type(3)").prop("hidden", false);

        this.renderizarInfoRuta(ruta);
        this.cargarMapa(ruta);
        this.cargarAltimetria(ruta);
    }

    renderizarInfoRuta(ruta) {
        let hitosHtml = ruta.hitos.map((hito, i) => {
            let fotosHtml = hito.fotos.map(f =>
                "<img src='multimedia/" + f + "' alt='Fotografía de " + hito.nombre + "' loading='lazy' />"
            ).join("");

            let distTexto = i > 0
                ? "<p><strong>Distancia desde anterior:</strong> " + hito.distancia + " " + hito.unidadesDistancia + "</p>"
                : "";

            return "<article>" +
                "<h3>" + hito.nombre + "</h3>" +
                "<p>" + hito.descripcion + "</p>" +
                distTexto +
                "<p><strong>Coordenadas:</strong> Lat: " + hito.latitud +
                ", Lon: " + hito.longitud + ", Alt: " + hito.altitud + " m</p>" +
                "<div>" + fotosHtml + "</div>" +
                "</article>";
        }).join("");

        let referenciasHtml = ruta.referencias.map(ref =>
            "<li><a href='" + ref + "' target='_blank' rel='noopener noreferrer'>" + ref + "</a></li>"
        ).join("");

        let html = "<h2>" + ruta.nombre + "</h2>" +
            "<ul>" +
            "<li><strong>Tipo:</strong> " + ruta.tipo + "</li>" +
            "<li><strong>Transporte:</strong> " + ruta.transporte + "</li>" +
            "<li><strong>Duración:</strong> " + ruta.duracion + "</li>" +
            "<li><strong>Agencia:</strong> " + ruta.agencia + "</li>" +
            "<li><strong>Recomendación:</strong> " + ruta.recomendacion + "/10</li>" +
            "<li><strong>Adecuada para:</strong> " + ruta.personas + "</li>" +
            "<li><strong>Inicio:</strong> " + ruta.lugarInicio + "</li>" +
            "</ul>" +
            "<p>" + ruta.descripcion + "</p>" +
            "<h3>Hitos de la ruta</h3>" +
            "<section>" + hitosHtml + "</section>" +
            "<h3>Referencias</h3>" +
            "<ul>" + referenciasHtml + "</ul>";

        $("#info-ruta").html(html);
    }

    cargarMapa(ruta) {
        let contenedorMapa = document.getElementById("mapa-ruta");
        contenedorMapa.innerHTML = "";

        if (typeof google === "undefined" || typeof google.maps === "undefined") {
            contenedorMapa.innerHTML = "<p>El mapa no está disponible. Añade tu API Key de Google Maps en rutas.html.</p>";
            return;
        }

        let mapa = new google.maps.Map(contenedorMapa, {
            center: { lat: ruta.latInicio, lng: ruta.lonInicio },
            zoom: 12,
            mapTypeId: "terrain"
        });

        ruta.hitos.forEach((hito, i) => {
            let marcador = new google.maps.Marker({
                position: { lat: hito.latitud, lng: hito.longitud },
                map: mapa,
                title: hito.nombre,
                label: String(i + 1)
            });

            let ventana = new google.maps.InfoWindow({
                content: "<strong>" + hito.nombre + "</strong><p>" +
                    hito.descripcion.substring(0, 100) + "…</p>"
            });

            marcador.addListener("click", () => ventana.open(mapa, marcador));
        });

        let coordenadas = ruta.hitos.map(h => ({ lat: h.latitud, lng: h.longitud }));
        new google.maps.Polyline({
            path: coordenadas,
            geodesic: true,
            strokeColor: "#8B1A1A",
            strokeOpacity: 1.0,
            strokeWeight: 3,
            map: mapa
        });

        console.log("Mapa cargado para ruta:", ruta.nombre);
    }

    cargarAltimetria(ruta) {
        let $contenedor = $("#altimetria-ruta");
        $contenedor.empty();

        $.ajax({
            url: ruta.altimetria,
            method: "GET",
            dataType: "text",
            success: (svgTexto) => {
                $contenedor.html("<div class='altimetria-scroll'>" + svgTexto + "</div>");
                console.log("SVG de altimetría cargado");
            },
            error: () => {
                $contenedor.html("<p>No se pudo cargar el SVG de altimetría.</p>");
            }
        });
    }
}

$(document).ready(() => {
    console.log("Documento listo, iniciando gestor de rutas...");
    new GestorRutas("xml/rutas.xml");
});