"use strict";

class Meteorologia {
    constructor(latitud, longitud, ciudad) {
        this.latitud = latitud;
        this.longitud = longitud;
        this.ciudad = ciudad;
        this.urlBase = "https://api.open-meteo.com/v1/forecast";

        // Mapa de códigos WMO a descripciones en español e icono emoji
        this.codigosWMO = {
            0:  { desc: "Cielo despejado",           icono: "☀️" },
            1:  { desc: "Principalmente despejado",  icono: "🌤️" },
            2:  { desc: "Parcialmente nublado",       icono: "⛅" },
            3:  { desc: "Nublado",                   icono: "☁️" },
            45: { desc: "Niebla",                    icono: "🌫️" },
            48: { desc: "Niebla con escarcha",       icono: "🌫️" },
            51: { desc: "Llovizna ligera",            icono: "🌦️" },
            53: { desc: "Llovizna moderada",          icono: "🌦️" },
            55: { desc: "Llovizna densa",             icono: "🌧️" },
            61: { desc: "Lluvia ligera",              icono: "🌧️" },
            63: { desc: "Lluvia moderada",            icono: "🌧️" },
            65: { desc: "Lluvia intensa",             icono: "🌧️" },
            71: { desc: "Nevada ligera",              icono: "🌨️" },
            73: { desc: "Nevada moderada",            icono: "🌨️" },
            75: { desc: "Nevada intensa",             icono: "❄️" },
            80: { desc: "Chubascos ligeros",          icono: "🌦️" },
            81: { desc: "Chubascos moderados",        icono: "🌧️" },
            82: { desc: "Chubascos intensos",         icono: "⛈️" },
            95: { desc: "Tormenta",                  icono: "⛈️" },
            99: { desc: "Tormenta con granizo",       icono: "⛈️" }
        };

        // Llamar al método para obtener los datos
        this.getDatos();
    }

    getDatos() {
        let params = {
            latitude: this.latitud,
            longitude: this.longitud,
            current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weathercode",
            daily: "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
            timezone: "Europe/Madrid",
            forecast_days: 7
        };

        $.getJSON(this.urlBase, params)
        .done((data) => {
            console.log("Datos meteorológicos recibidos:", data);
            this.mostrarActual(data.current, data.current_units);
            this.mostrarPrevision(data.daily, data.daily_units);
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            console.error("Error al cargar meteorología:", textStatus, errorThrown);
            $("#tiempo-actual-contenedor").html("<p>No se pudo obtener el tiempo actual. Inténtalo más tarde.</p>");
            $("#prevision-contenedor").html("");
        });
    }

    mostrarActual(current, currentUnits) {
        let info = this.codigosWMO[current.weathercode] || { desc: "Desconocido", icono: "🌡️" };
        let ahora = new Date().toLocaleString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        let html = "<p style='font-size:3em'>" + info.icono + "</p>" +
            "<h3>" + this.ciudad + "</h3>" +
            "<p><time datetime='" + current.time + "'>" + ahora + "</time></p>" +
            "<p><strong>" + info.desc + "</strong></p>" +
            "<ul>" +
            "<li><strong>Temperatura:</strong> " + current.temperature_2m + currentUnits.temperature_2m +
            " (sensación: " + current.apparent_temperature + currentUnits.apparent_temperature + ")</li>" +
            "<li><strong>Humedad:</strong> " + current.relative_humidity_2m + currentUnits.relative_humidity_2m + "</li>" +
            "<li><strong>Viento:</strong> " + current.wind_speed_10m + " " + currentUnits.wind_speed_10m +
            " (" + this.direccionViento(current.wind_direction_10m) + ")</li>" +
            "<li><strong>Precipitación:</strong> " + current.precipitation + " " + currentUnits.precipitation + "</li>" +
            "</ul>";

        $("#tiempo-actual-contenedor").html(html);
    }

    mostrarPrevision(daily, dailyUnits) {
        let $contenedor = $("#prevision-contenedor");
        $contenedor.empty();

        daily.time.forEach((fecha, i) => {
            let info = this.codigosWMO[daily.weathercode[i]] || { desc: "Desconocido", icono: "🌡️" };
            let fechaObj = new Date(fecha + "T12:00:00");
            let fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
                month: "short"
            });

            let $article = $("<article>").attr("aria-label", info.desc);
            let $fecha = $("<h3>").append($("<time>").attr("datetime", fecha).text(fechaFormateada));
            let $icono = $("<p>").text(info.icono);
            let $temp = $("<p>").html("<strong>" + daily.temperature_2m_max[i] + "°</strong> / " + daily.temperature_2m_min[i] + "°");
            let $lluvia = $("<p>").text("💧 " + daily.precipitation_sum[i] + " " + dailyUnits.precipitation_sum);

            $article.append($fecha).append($icono).append($temp).append($lluvia);
            $contenedor.append($article);
        });

        console.log("Previsión insertada en el DOM");
    }

    direccionViento(grados) {
        let puntos = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
        let indice = Math.round(grados / 45) % 8;
        return puntos[indice];
    }
}

// Inicializar meteorología cuando el documento esté listo
$(document).ready(() => {
    console.log("Documento listo, iniciando meteorología...");
    // Coordenadas de Salamanca capital
    new Meteorologia(40.9701, -5.6635, "Salamanca");
});
