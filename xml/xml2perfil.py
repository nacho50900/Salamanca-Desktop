#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xml2perfil.py
Lee rutas.xml y genera un archivo SVG de altimetría por cada ruta turística.
Muestra el perfil de alturas con escala horizontal (km) y vertical (m).
La polilínea del perfil es cerrada, según la especificación.

UO300737 - Software y estándares para la Web
"""

import xml.etree.ElementTree as ET
import os


class GeneradorSVG:
    """Genera archivos SVG de altimetría a partir de un elemento <ruta> XML."""

    # Dimensiones del SVG
    SVG_W = 800
    SVG_H = 400
    MARGEN_IZQ = 80
    MARGEN_DER = 30
    MARGEN_SUP = 30
    MARGEN_INF = 80

    def __init__(self, ruta_elem: ET.Element):
        self._ruta = ruta_elem
        self._nombre = ruta_elem.findtext("nombre", default="Ruta")
        self._hitos_data = self._extraer_hitos()
        self._calcular_escalas()

    # ------------------------------------------------------------------
    # Interfaz pública
    # ------------------------------------------------------------------

    def guardar(self, output_path: str) -> None:
        """Genera y escribe el archivo SVG en output_path."""
        contenido = self._construir_svg()
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(contenido)
        print(f"  SVG generado: {output_path}")

    # ------------------------------------------------------------------
    # Extracción de datos
    # ------------------------------------------------------------------

    def _extraer_hitos(self) -> list:
        """Devuelve lista de (distancia_acumulada_km, altitud, nombre)."""
        hitos = []
        distancia_acumulada = 0.0

        # Punto de inicio
        coord_inicio = self._ruta.find("coordenadasInicio")
        alt_inicio = 0
        if coord_inicio is not None:
            alt_inicio = int(coord_inicio.findtext("altitud", "0"))
        hitos.append((0.0, alt_inicio, self._ruta.findtext("lugarInicio", "Inicio")))

        # Hitos
        for hito in self._ruta.findall(".//hito"):
            dist_elem = hito.find("distanciaDesdeAnterior")
            if dist_elem is not None:
                dist_val = float(dist_elem.text or "0")
                if dist_elem.get("unidades", "m") == "m":
                    dist_val /= 1000.0
            else:
                dist_val = 0.0

            distancia_acumulada += dist_val
            coord = hito.find("coordenadas")
            altitud = int(coord.findtext("altitud", "0")) if coord is not None else 0
            hitos.append((distancia_acumulada, altitud, hito.findtext("nombre", "Hito")))

        return hitos

    # ------------------------------------------------------------------
    # Cálculo de escalas
    # ------------------------------------------------------------------

    def _calcular_escalas(self) -> None:
        self._ancho_grafico = self.SVG_W - self.MARGEN_IZQ - self.MARGEN_DER
        self._alto_grafico = self.SVG_H - self.MARGEN_SUP - self.MARGEN_INF

        self._dist_max = max(d for d, _, _ in self._hitos_data) or 1.0
        self._alt_min = min(a for _, a, _ in self._hitos_data) - 50
        self._alt_max = max(a for _, a, _ in self._hitos_data) + 100
        self._rango_alt = (self._alt_max - self._alt_min) or 1

    def _esc_x(self, dist_km: float) -> float:
        return self.MARGEN_IZQ + (dist_km / self._dist_max) * self._ancho_grafico

    def _esc_y(self, alt_m: int) -> float:
        return (
            self.MARGEN_SUP
            + self._alto_grafico
            - ((alt_m - self._alt_min) / self._rango_alt) * self._alto_grafico
        )

    # ------------------------------------------------------------------
    # Construcción del SVG
    # ------------------------------------------------------------------

    def _puntos_perfil(self) -> list:
        return [(self._esc_x(d), self._esc_y(a)) for d, a, _ in self._hitos_data]

    def _puntos_poligono(self, perfil: list) -> str:
        """Polilínea cerrada: baja al eje X en ambos extremos."""
        cierre = (
            perfil
            + [(perfil[-1][0], self.MARGEN_SUP + self._alto_grafico)]
            + [(perfil[0][0], self.MARGEN_SUP + self._alto_grafico)]
        )
        return " ".join(f"{x:.1f},{y:.1f}" for x, y in cierre)

    def _lineas_eje_y(self) -> list:
        lineas = [
            "",
            "  <!-- Cuadrícula y eje Y (altitud en metros) -->",
        ]
        alt_marca = (self._alt_min // 100) * 100
        while alt_marca <= self._alt_max:
            y = self._esc_y(alt_marca)
            if self.MARGEN_SUP <= y <= self.MARGEN_SUP + self._alto_grafico:
                lineas += [
                    f'  <line x1="{self.MARGEN_IZQ}" y1="{y:.1f}" '
                    f'x2="{self.MARGEN_IZQ + self._ancho_grafico}" y2="{y:.1f}" '
                    f'stroke="#ddd" stroke-width="1"/>',
                    f'  <text x="{self.MARGEN_IZQ - 8}" y="{y + 4:.1f}" '
                    f'text-anchor="end" font-family="Arial, sans-serif" '
                    f'font-size="11" fill="#555">{alt_marca} m</text>',
                ]
            alt_marca += 100
        return lineas

    def _lineas_eje_x(self) -> list:
        lineas = [
            "",
            "  <!-- Eje X (distancia en km) y marcas -->",
        ]
        y_base = self.MARGEN_SUP + self._alto_grafico
        num_marcas = min(int(self._dist_max) + 1, 10)
        paso = self._dist_max / num_marcas if num_marcas > 0 else 1
        for i in range(num_marcas + 1):
            dist_km = i * paso
            x = self._esc_x(dist_km)
            lineas += [
                f'  <line x1="{x:.1f}" y1="{y_base}" x2="{x:.1f}" y2="{y_base + 5}" '
                f'stroke="#333" stroke-width="1"/>',
                f'  <text x="{x:.1f}" y="{y_base + 18}" text-anchor="middle" '
                f'font-family="Arial, sans-serif" font-size="11" fill="#555">'
                f'{dist_km:.1f}</text>',
            ]
        lineas.append(
            f'  <text x="{self.MARGEN_IZQ + self._ancho_grafico // 2}" y="{self.SVG_H - 10}" '
            f'text-anchor="middle" font-family="Arial, sans-serif" '
            f'font-size="12" fill="#333">Distancia (km)</text>'
        )
        return lineas

    def _hitos_svg(self, perfil: list) -> list:
        lineas = ["", "  <!-- Hitos con etiquetas -->"]
        for (x, y), (_, _, nombre) in zip(perfil, self._hitos_data):
            nombre_corto = (nombre[:20] + "…") if len(nombre) > 20 else nombre
            lineas += [
                f'  <circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="#8b1a1a" stroke="white" stroke-width="1.5"/>',
                f'  <text x="{x:.1f}" y="{y - 10:.1f}" text-anchor="middle"',
                f'        font-family="Arial, sans-serif" font-size="10" fill="#333">',
                f'    {_escapar(nombre_corto)}',
                "  </text>",
            ]
        return lineas

    def _construir_svg(self) -> str:
        perfil = self._puntos_perfil()
        poligono = self._puntos_poligono(perfil)

        lineas = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            f'<svg xmlns="http://www.w3.org/2000/svg"',
            f'     viewBox="0 0 {self.SVG_W} {self.SVG_H}" role="img"',
            f'     width="100%" height="{self.SVG_H}" preserveAspectRatio="xMidYMid meet"',
            f'     aria-label="Altimetría de la ruta {_escapar(self._nombre)}">',
            f'  <title>Altimetría - {_escapar(self._nombre)}</title>',
            f'  <desc>Perfil de alturas de la ruta {_escapar(self._nombre)}, '
            f'distancia total {self._dist_max:.1f} km</desc>',
            "",
            "  <!-- Fondo -->",
            '  <rect width="100%" height="100%" fill="#f8f8f0" stroke="#ccc"/>',
            "",
            "  <!-- Título -->",
            f'  <text x="{self.SVG_W // 2}" y="20" text-anchor="middle"',
            '        font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#8b1a1a">',
            f'    Altimetría - {_escapar(self._nombre)}',
            "  </text>",
        ]

        lineas += self._lineas_eje_y()

        lineas += [
            "",
            "  <!-- Eje Y - etiqueta vertical -->",
            f'  <text x="15" y="{self.MARGEN_SUP + self._alto_grafico // 2}" '
            f'text-anchor="middle" font-family="Arial, sans-serif" '
            f'font-size="12" fill="#333" '
            f'transform="rotate(-90, 15, {self.MARGEN_SUP + self._alto_grafico // 2})">',
            "    Altitud (m)",
            "  </text>",
        ]

        lineas += self._lineas_eje_x()

        lineas += [
            "",
            "  <!-- Ejes principales -->",
            f'  <line x1="{self.MARGEN_IZQ}" y1="{self.MARGEN_SUP}" '
            f'x2="{self.MARGEN_IZQ}" y2="{self.MARGEN_SUP + self._alto_grafico}" '
            f'stroke="#333" stroke-width="2"/>',
            f'  <line x1="{self.MARGEN_IZQ}" y1="{self.MARGEN_SUP + self._alto_grafico}" '
            f'x2="{self.MARGEN_IZQ + self._ancho_grafico}" y2="{self.MARGEN_SUP + self._alto_grafico}" '
            f'stroke="#333" stroke-width="2"/>',
            "",
            "  <!-- Perfil de altimetría: polilínea cerrada -->",
            f'  <polygon points="{poligono}"',
            '           fill="rgba(139,26,26,0.2)" stroke="#8b1a1a" stroke-width="2"/>',
        ]

        lineas += self._hitos_svg(perfil)
        lineas.append("</svg>")

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

    print("Generador de archivos SVG - Turismo Salamanca")
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
        svg_path = os.path.join(output_dir, f"ruta{i}_altimetria.svg")
        GeneradorSVG(ruta).guardar(svg_path)

    print("\n" + "=" * 50)
    print("Generación de SVG completada.")


if __name__ == "__main__":
    main()
