#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xml2kml.py
Lee rutas.xml y genera un archivo KML de planimetría por cada ruta turística.

UO300737 - Software y estándares para la Web
"""

import xml.etree.ElementTree as ET
import os


class GeneradorKML:
    """Genera archivos KML de planimetría a partir de un elemento <ruta> XML."""

    ESTILO_HITO = "hitoStyle"
    ESTILO_LINEA = "lineaRuta"

    def __init__(self, ruta_elem: ET.Element):
        self._ruta = ruta_elem
        self._nombre = ruta_elem.findtext("nombre", default="Ruta")
        self._descripcion = ruta_elem.findtext("descripcion", default="").strip()
        self._puntos = self._extraer_puntos()

    # ------------------------------------------------------------------
    # Interfaz pública
    # ------------------------------------------------------------------

    def guardar(self, output_path: str) -> None:
        """Genera y escribe el archivo KML en output_path."""
        contenido = self._construir_kml()
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(contenido)
        print(f"  KML generado: {output_path}")

    # ------------------------------------------------------------------
    # Métodos privados
    # ------------------------------------------------------------------

    def _extraer_puntos(self) -> list:
        """Devuelve lista de (lon, lat, alt, nombre, desc) para cada hito."""
        puntos = []
        for hito in self._ruta.findall(".//hito"):
            coord = hito.find("coordenadas")
            if coord is not None:
                lon = float(coord.findtext("longitud", "0"))
                lat = float(coord.findtext("latitud", "0"))
                alt = float(coord.findtext("altitud", "0"))
                nombre = hito.findtext("nombre", "Hito")
                desc = hito.findtext("descripcion", "").strip()[:200]
                puntos.append((lon, lat, alt, nombre, desc))
        return puntos

    def _cabecera(self) -> list:
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<kml xmlns="http://www.opengis.net/kml/2.2">',
            "  <Document>",
            f"    <name>{_escapar(self._nombre)}</name>",
            f"    <description>{_escapar(self._descripcion[:300])}</description>",
            "",
        ]

    def _estilos(self) -> list:
        return [
            "    <!-- Estilo para los marcadores de hitos -->",
            f"    <Style id=\"{self.ESTILO_HITO}\">",
            "      <IconStyle>",
            "        <color>ff1400ff</color>",
            "        <scale>1.2</scale>",
            "        <Icon>",
            "          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>",
            "        </Icon>",
            "      </IconStyle>",
            "      <LabelStyle>",
            "        <color>ff1400ff</color>",
            "        <scale>0.8</scale>",
            "      </LabelStyle>",
            "    </Style>",
            "",
            "    <!-- Estilo para la línea de trazado -->",
            f"    <Style id=\"{self.ESTILO_LINEA}\">",
            "      <LineStyle>",
            "        <color>ff0000ff</color>",
            "        <width>3</width>",
            "      </LineStyle>",
            "    </Style>",
            "",
        ]

    def _placemarks_hitos(self) -> list:
        lineas = []
        for i, (lon, lat, alt, nombre, desc) in enumerate(self._puntos):
            lineas += [
                f"    <!-- Hito {i}: {_escapar(nombre)} -->",
                "    <Placemark>",
                f"      <name>{_escapar(nombre)}</name>",
                f"      <description>{_escapar(desc)}</description>",
                f"      <styleUrl>#{self.ESTILO_HITO}</styleUrl>",
                "      <Point>",
                f"        <coordinates>{lon},{lat},{alt}</coordinates>",
                "      </Point>",
                "    </Placemark>",
                "",
            ]
        return lineas

    def _placemark_trazado(self) -> list:
        coords_str = "\n          ".join(
            f"{lon},{lat},{alt}" for lon, lat, alt, _, _ in self._puntos
        )
        return [
            "    <!-- Trazado completo de la ruta -->",
            "    <Placemark>",
            f"      <name>Trazado - {_escapar(self._nombre)}</name>",
            f"      <styleUrl>#{self.ESTILO_LINEA}</styleUrl>",
            "      <LineString>",
            "        <tessellate>1</tessellate>",
            "        <altitudeMode>clampToGround</altitudeMode>",
            "        <coordinates>",
            f"          {coords_str}",
            "        </coordinates>",
            "      </LineString>",
            "    </Placemark>",
            "",
        ]

    def _pie(self) -> list:
        return [
            "  </Document>",
            "</kml>",
        ]

    def _construir_kml(self) -> str:
        lineas = (
            self._cabecera()
            + self._estilos()
            + self._placemarks_hitos()
            + self._placemark_trazado()
            + self._pie()
        )
        return "\n".join(lineas)


# ------------------------------------------------------------------
# Utilidades
# ------------------------------------------------------------------

def _escapar(texto: str) -> str:
    """Escapa caracteres especiales XML."""
    return (
        texto.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;")
             .replace("'", "&apos;")
    )


# ------------------------------------------------------------------
# Punto de entrada
# ------------------------------------------------------------------

def main():
    xml_path = os.path.join(os.path.dirname(__file__), "rutas.xml")
    output_dir = os.path.dirname(__file__)

    print("Generador de archivos KML - Turismo Salamanca")
    print("=" * 50)

    if not os.path.exists(xml_path):
        print(f"ERROR: No se encuentra el archivo {xml_path}")
        return

    raiz = ET.parse(xml_path).getroot()
    rutas = raiz.findall("ruta")
    print(f"Rutas encontradas: {len(rutas)}")

    for i, ruta in enumerate(rutas, start=1):
        nombre = ruta.findtext("nombre", "Ruta desconocida")
        print(f"\nProcesando ruta {i}: {nombre}")
        kml_path = os.path.join(output_dir, f"ruta{i}_planimetria.kml")
        GeneradorKML(ruta).guardar(kml_path)

    print("\n" + "=" * 50)
    print("Generación de KML completada.")


if __name__ == "__main__":
    main()
