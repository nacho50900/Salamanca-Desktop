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
                    $tabs.find("button").removeAttr("data-activa");
                    $btn.attr("data-activa", "true");
                    this.mostrarRuta(indice);
                });

            if (indice === 0) $btn.attr("data-activa", "true");
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

            let videosHtml = hito.videos.map(v =>
                "<video controls>" +
                "<source src='multimedia/" + v + "' />" +
                "Tu navegador no soporta el elemento de vídeo." +
                "</video>"
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
                (fotosHtml ? "<figure>" + fotosHtml + "</figure>" : "") +
                (videosHtml ? "<figure>" + videosHtml + "</figure>" : "") +
                "</article>";
        }).join("");

        let referenciasHtml = ruta.referencias.map(ref =>
            "<li><a href='" + ref + "' target='_blank' rel='noopener noreferrer'>" + ref + "</a></li>"
        ).join("");

        let html =
            "<h3>" + ruta.nombre + "</h3>" +
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
            "<h4>Hitos de la ruta</h4>" +
            "<section aria-label='Hitos de la ruta'>" + hitosHtml + "</section>" +
            "<h4>Referencias</h4>" +
            "<ul>" + referenciasHtml + "</ul>";

        $("#info-ruta-contenido").html(html);
    }

    cargarMapa(ruta) {
        let contenedorMapa = document.getElementById("mapa-ruta");
        contenedorMapa.innerHTML = "";

        if (typeof google === "undefined" || typeof google.maps === "undefined") {
            contenedorMapa.innerHTML = "<p>El mapa no está disponible. Añade tu API Key de Google Maps en rutas.html.</p>";
            return;
        }

        // Esperar a que google.maps.Map esté disponible (condición de carrera con loading=async)
        if (typeof google.maps.Map !== "function") {
            setTimeout(() => this.cargarMapa(ruta), 100);
            return;
        }

        // Cargar y parsear el archivo KML generado por Python
        $.ajax({
            url: ruta.planimetria,
            method: "GET",
            dataType: "xml",
            success: (kmlDoc) => {
                console.log("KML cargado:", ruta.planimetria);
                this._renderizarKmlEnMapa(kmlDoc, ruta, contenedorMapa);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.error("Error al cargar KML:", textStatus, errorThrown);
                contenedorMapa.innerHTML = "<p>No se pudo cargar el archivo KML de planimetría (<em>" +
                    ruta.planimetria + "</em>).</p>";
            }
        });
    }

    _renderizarKmlEnMapa(kmlDoc, ruta, contenedorMapa) {
        // El KML usa el namespace http://www.opengis.net/kml/2.2
        // jQuery no maneja namespaces en XML, usamos la API DOM directamente
        let ns = "http://www.opengis.net/kml/2.2";

        let mapa = new google.maps.Map(contenedorMapa, {
            center: { lat: ruta.latInicio, lng: ruta.lonInicio },
            zoom: 12,
            mapTypeId: "terrain",
            mapId: "DEMO_MAP_ID"
        });

        let placemarks = kmlDoc.getElementsByTagNameNS(ns, "Placemark");
        // El primer Placemark es el punto de inicio de la ruta (no es un hito numerado).
        // Arrancamos en -1: al procesar ese primero sube a 0 y no muestra número;
        // a partir del segundo (hito 1) muestra 1, 2, 3…
        let marcadorIndex = 0;
        // Puesto en 0 para obviar el marcador de inicio ya que al mostart los marcadores 
        // de hitos numerados se sobrenteinde que es el 1

        for (let i = 0; i < placemarks.length; i++) {
            let placemark = placemarks[i];
            let nombreElem = placemark.getElementsByTagNameNS(ns, "name")[0];
            let descElem   = placemark.getElementsByTagNameNS(ns, "description")[0];
            let nombre     = nombreElem ? nombreElem.textContent.trim() : "";
            let desc       = descElem   ? descElem.textContent.trim()   : "";

            // --- Placemark de tipo Point -> marcador ---
            let pointElems = placemark.getElementsByTagNameNS(ns, "Point");
            if (pointElems.length > 0) {
                let coordsText = pointElems[0]
                    .getElementsByTagNameNS(ns, "coordinates")[0]
                    .textContent.trim();
                // Formato KML: lon,lat,alt
                let partes = coordsText.split(",");
                let lon = parseFloat(partes[0]);
                let lat = parseFloat(partes[1]);

                marcadorIndex++;
                let contenidoPin = document.createElement("div");
                /* Cambiado, no pongo punto inicial se sobreentiendo con la
                numeración de los
                if (marcadorIndex === 0) {
                    // Punto de inicio: estrella sin número
                    contenidoPin.textContent = "★";
                    contenidoPin.style.cssText =
                        "background:#2255AA;color:#fff;border-radius:50%;" +
                        "width:24px;height:24px;display:flex;align-items:center;" +
                        "justify-content:center;font-weight:bold;font-size:14px;";
                } else {
                    // Hitos numerados desde 1
                    contenidoPin.textContent = String(marcadorIndex);
                    contenidoPin.style.cssText =
                        "background:#8B1A1A;color:#fff;border-radius:50%;" +
                        "width:24px;height:24px;display:flex;align-items:center;" +
                        "justify-content:center;font-weight:bold;font-size:12px;";
                }*/
                contenidoPin.textContent = String(marcadorIndex);
                contenidoPin.style.cssText =
                    "background:#8B1A1A;color:#fff;border-radius:50%;" +
                    "width:24px;height:24px;display:flex;align-items:center;" +
                    "justify-content:center;font-weight:bold;font-size:12px;";

                let marcador = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: lat, lng: lon },
                    map: mapa,
                    title: nombre,
                    content: contenidoPin
                });

                let ventana = new google.maps.InfoWindow({
                    content: "<strong>" + nombre + "</strong>" +
                        (desc ? "<p>" + desc.substring(0, 120) + "…</p>" : "")
                });
                marcador.addListener("gmp-click", () => ventana.open(mapa, marcador));
            }

            // --- Placemark de tipo LineString -> polilínea del trazado ---
            let lineElems = placemark.getElementsByTagNameNS(ns, "LineString");
            if (lineElems.length > 0) {
                let coordsText = lineElems[0]
                    .getElementsByTagNameNS(ns, "coordinates")[0]
                    .textContent.trim();
                // Cada coordenada: lon,lat,alt separadas por espacios o saltos de línea
                let coordenadas = coordsText
                    .split(/\s+/)
                    .filter(c => c.length > 0)
                    .map(c => {
                        let p = c.split(",");
                        return { lat: parseFloat(p[1]), lng: parseFloat(p[0]) };
                    });

                new google.maps.Polyline({
                    path: coordenadas,
                    geodesic: true,
                    strokeColor: "#8B1A1A",
                    strokeOpacity: 1.0,
                    strokeWeight: 3,
                    map: mapa
                });
            }
        }

        console.log("Mapa renderizado desde KML para ruta:", ruta.nombre);
    }

    cargarAltimetria(ruta) {
        let $contenedor = $("#altimetria-ruta");
        $contenedor.empty();

        $.ajax({
            url: ruta.altimetria,
            method: "GET",
            dataType: "text",
            success: (svgTexto) => {
                $contenedor.html(svgTexto);
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