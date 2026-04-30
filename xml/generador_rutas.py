#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generador_rutas.py
Genera archivos KML (planimetría) y SVG (altimetría) para cada ruta turística
de Salamanca a partir del archivo rutas.xml.

UO300737 – Software y estándares para la Web
"""

import xml.etree.ElementTree as ET
import os

# Rutas de archivos (relativas al directorio del proyecto)
RUTAS_XML = os.path.join(os.path.dirname(__file__), 'rutas.xml')
OUTPUT_DIR = os.path.dirname(__file__)


def parsear_rutas(xml_path: str) -> ET.Element:
    """Parsea el archivo rutas.xml y retorna el elemento raíz."""
    tree = ET.parse(xml_path)
    return tree.getroot()


def generar_kml(ruta: ET.Element, output_path: str) -> None:
    """
    Genera un archivo KML de planimetría para una ruta turística.
    Incluye un Placemark por cada hito y una LineString con el trazado completo.
    """
    nombre_ruta = ruta.findtext('nombre', default='Ruta')
    descripcion_ruta = ruta.findtext('descripcion', default='').strip()

    # Recopilar coordenadas de inicio y de cada hito
    puntos = []

    # Coordenadas de inicio
    coord_inicio = ruta.find('coordenadasInicio')
    if coord_inicio is not None:
        lon = float(coord_inicio.findtext('longitud', '0'))
        lat = float(coord_inicio.findtext('latitud', '0'))
        alt = float(coord_inicio.findtext('altitud', '0'))
        puntos.append((lon, lat, alt, ruta.findtext('lugarInicio', 'Inicio'), ''))

    # Coordenadas de cada hito
    for hito in ruta.findall('.//hito'):
        coord = hito.find('coordenadas')
        if coord is not None:
            lon = float(coord.findtext('longitud', '0'))
            lat = float(coord.findtext('latitud', '0'))
            alt = float(coord.findtext('altitud', '0'))
            nombre_hito = hito.findtext('nombre', 'Hito')
            desc_hito = hito.findtext('descripcion', '').strip()[:200]
            puntos.append((lon, lat, alt, nombre_hito, desc_hito))

    # Construir KML
    kml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        '  <Document>',
        f'    <name>{_escape_xml(nombre_ruta)}</name>',
        f'    <description>{_escape_xml(descripcion_ruta[:300])}</description>',
        '',
        '    <!-- Estilo para los marcadores de hitos -->',
        '    <Style id="hitoStyle">',
        '      <IconStyle>',
        '        <color>ff1400ff</color>',
        '        <scale>1.2</scale>',
        '        <Icon>',
        '          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>',
        '        </Icon>',
        '      </IconStyle>',
        '      <LabelStyle>',
        '        <color>ff1400ff</color>',
        '        <scale>0.8</scale>',
        '      </LabelStyle>',
        '    </Style>',
        '',
        '    <!-- Estilo para la línea de trazado -->',
        '    <Style id="lineaRuta">',
        '      <LineStyle>',
        '        <color>ff0000ff</color>',
        '        <width>3</width>',
        '      </LineStyle>',
        '    </Style>',
        '',
    ]

    # Placemarks para cada hito
    for i, (lon, lat, alt, nombre, desc) in enumerate(puntos):
        kml_lines += [
            f'    <!-- Hito {i}: {_escape_xml(nombre)} -->',
            '    <Placemark>',
            f'      <name>{_escape_xml(nombre)}</name>',
            f'      <description>{_escape_xml(desc)}</description>',
            '      <styleUrl>#hitoStyle</styleUrl>',
            '      <Point>',
            f'        <coordinates>{lon},{lat},{alt}</coordinates>',
            '      </Point>',
            '    </Placemark>',
            '',
        ]

    # LineString con el trazado completo
    coords_str = '\n          '.join(
        f'{lon},{lat},{alt}' for lon, lat, alt, _, _ in puntos
    )
    kml_lines += [
        '    <!-- Trazado completo de la ruta -->',
        '    <Placemark>',
        f'      <name>Trazado - {_escape_xml(nombre_ruta)}</name>',
        '      <styleUrl>#lineaRuta</styleUrl>',
        '      <LineString>',
        '        <tessellate>1</tessellate>',
        '        <altitudeMode>clampToGround</altitudeMode>',
        '        <coordinates>',
        f'          {coords_str}',
        '        </coordinates>',
        '      </LineString>',
        '    </Placemark>',
        '',
        '  </Document>',
        '</kml>',
    ]

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(kml_lines))

    print(f'  KML generado: {output_path}')


def generar_svg(ruta: ET.Element, output_path: str) -> None:
    """
    Genera un archivo SVG de altimetría para una ruta turística.
    Muestra el perfil de alturas con escala horizontal (km) y vertical (m).
    Es una polilínea cerrada según la especificación.
    """
    nombre_ruta = ruta.findtext('nombre', default='Ruta')

    # Recopilar datos de hitos: (distancia_acumulada_km, altitud, nombre)
    hitos_data = []
    distancia_acumulada = 0.0

    # Punto de inicio
    coord_inicio = ruta.find('coordenadasInicio')
    alt_inicio = 0
    if coord_inicio is not None:
        alt_inicio = int(coord_inicio.findtext('altitud', '0'))
    hitos_data.append((0.0, alt_inicio, ruta.findtext('lugarInicio', 'Inicio')))

    # Hitos
    for hito in ruta.findall('.//hito'):
        dist_elem = hito.find('distanciaDesdeAnterior')
        if dist_elem is not None:
            dist_val = float(dist_elem.text or '0')
            unidades = dist_elem.get('unidades', 'm')
            if unidades == 'm':
                dist_val = dist_val / 1000.0  # convertir a km
        else:
            dist_val = 0.0

        distancia_acumulada += dist_val
        coord = hito.find('coordenadas')
        altitud = 0
        if coord is not None:
            altitud = int(coord.findtext('altitud', '0'))
        nombre_hito = hito.findtext('nombre', 'Hito')
        hitos_data.append((distancia_acumulada, altitud, nombre_hito))

    # Dimensiones del SVG
    SVG_W = 800
    SVG_H = 400
    MARGEN_IZQ = 80
    MARGEN_DER = 30
    MARGEN_SUP = 30
    MARGEN_INF = 80

    ancho_grafico = SVG_W - MARGEN_IZQ - MARGEN_DER
    alto_grafico = SVG_H - MARGEN_SUP - MARGEN_INF

    dist_max = max(d for d, _, _ in hitos_data) if hitos_data else 1.0
    alt_min = min(a for _, a, _ in hitos_data) - 50
    alt_max = max(a for _, a, _ in hitos_data) + 100
    rango_alt = alt_max - alt_min if alt_max != alt_min else 1

    def escalar_x(dist_km: float) -> float:
        return MARGEN_IZQ + (dist_km / dist_max) * ancho_grafico

    def escalar_y(alt_m: int) -> float:
        return MARGEN_SUP + alto_grafico - ((alt_m - alt_min) / rango_alt) * alto_grafico

    # Construir puntos de la polilínea del perfil
    puntos_perfil = [(escalar_x(d), escalar_y(a)) for d, a, _ in hitos_data]

    # Polilínea cerrada: añadir punto de cierre (mismo x del último, y en la base)
    puntos_cierre = (
        puntos_perfil
        + [(puntos_perfil[-1][0], MARGEN_SUP + alto_grafico)]
        + [(puntos_perfil[0][0], MARGEN_SUP + alto_grafico)]
    )
    puntos_str = ' '.join(f'{x:.1f},{y:.1f}' for x, y in puntos_cierre)

    # Marcas del eje Y (altitud) cada 100 m
    marcas_y = []
    alt_marca = (alt_min // 100) * 100
    while alt_marca <= alt_max:
        marcas_y.append(alt_marca)
        alt_marca += 100

    # Generar SVG
    svg_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg"',
        f'     viewBox="0 0 {SVG_W} {SVG_H}" role="img"',
        f'     width="100%" height="auto" preserveAspectRatio="xMidYMid meet"',
        f'     aria-label="Altimetría de la ruta {_escape_xml(nombre_ruta)}">',
        f'  <title>Altimetría – {_escape_xml(nombre_ruta)}</title>',
        f'  <desc>Perfil de alturas de la ruta {_escape_xml(nombre_ruta)}, '
        f'distancia total {dist_max:.1f} km</desc>',
        '',
        '  <!-- Fondo -->',
        f'  <rect width="100%" height="100%" fill="#f8f8f0" stroke="#ccc"/>',
        '',
        f'  <!-- Título -->',
        f'  <text x="{SVG_W // 2}" y="20" text-anchor="middle"',
        f'        font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#8b1a1a">',
        f'    Altimetría – {_escape_xml(nombre_ruta)}',
        '  </text>',
        '',
        '  <!-- Cuadrícula y eje Y (altitud en metros) -->',
    ]

    for alt_m in marcas_y:
        y = escalar_y(alt_m)
        if MARGEN_SUP <= y <= MARGEN_SUP + alto_grafico:
            svg_lines += [
                f'  <line x1="{MARGEN_IZQ}" y1="{y:.1f}" '
                f'x2="{MARGEN_IZQ + ancho_grafico}" y2="{y:.1f}" '
                f'stroke="#ddd" stroke-width="1"/>',
                f'  <text x="{MARGEN_IZQ - 8}" y="{y + 4:.1f}" '
                f'text-anchor="end" font-family="Arial, sans-serif" '
                f'font-size="11" fill="#555">{alt_m} m</text>',
            ]

    svg_lines += [
        '',
        '  <!-- Eje Y – etiqueta vertical -->',
        f'  <text x="15" y="{MARGEN_SUP + alto_grafico // 2}" '
        f'text-anchor="middle" font-family="Arial, sans-serif" '
        f'font-size="12" fill="#333" '
        f'transform="rotate(-90, 15, {MARGEN_SUP + alto_grafico // 2})">',
        '    Altitud (m)',
        '  </text>',
        '',
        '  <!-- Eje X (distancia en km) y marcas -->',
    ]

    # Marcas del eje X cada ~1 km
    num_marcas_x = min(int(dist_max) + 1, 10)
    paso_x = dist_max / num_marcas_x if num_marcas_x > 0 else 1
    for i in range(num_marcas_x + 1):
        dist_km = i * paso_x
        x = escalar_x(dist_km)
        y_base = MARGEN_SUP + alto_grafico
        svg_lines += [
            f'  <line x1="{x:.1f}" y1="{y_base}" x2="{x:.1f}" y2="{y_base + 5}" '
            f'stroke="#333" stroke-width="1"/>',
            f'  <text x="{x:.1f}" y="{y_base + 18}" text-anchor="middle" '
            f'font-family="Arial, sans-serif" font-size="11" fill="#555">'
            f'{dist_km:.1f}</text>',
        ]

    svg_lines += [
        f'  <text x="{MARGEN_IZQ + ancho_grafico // 2}" y="{SVG_H - 10}" '
        f'text-anchor="middle" font-family="Arial, sans-serif" '
        f'font-size="12" fill="#333">Distancia (km)</text>',
        '',
        '  <!-- Ejes principales -->',
        f'  <line x1="{MARGEN_IZQ}" y1="{MARGEN_SUP}" '
        f'x2="{MARGEN_IZQ}" y2="{MARGEN_SUP + alto_grafico}" '
        f'stroke="#333" stroke-width="2"/>',
        f'  <line x1="{MARGEN_IZQ}" y1="{MARGEN_SUP + alto_grafico}" '
        f'x2="{MARGEN_IZQ + ancho_grafico}" y2="{MARGEN_SUP + alto_grafico}" '
        f'stroke="#333" stroke-width="2"/>',
        '',
        '  <!-- Perfil de altimetría: polilínea cerrada -->',
        f'  <polygon points="{puntos_str}"',
        '           fill="rgba(139,26,26,0.2)" stroke="#8b1a1a" stroke-width="2"/>',
        '',
        '  <!-- Hitos con etiquetas -->',
    ]

    for (x, y), (dist_km, alt_m, nombre) in zip(puntos_perfil, hitos_data):
        nombre_corto = nombre[:20] + '…' if len(nombre) > 20 else nombre
        svg_lines += [
            f'  <circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="#8b1a1a" stroke="white" stroke-width="1.5"/>',
            f'  <text x="{x:.1f}" y="{y - 10:.1f}" text-anchor="middle"',
            f'        font-family="Arial, sans-serif" font-size="10" fill="#333">',
            f'    {_escape_xml(nombre_corto)}',
            '  </text>',
        ]

    svg_lines += [
        '</svg>',
    ]

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg_lines))

    print(f'  SVG generado: {output_path}')


def _escape_xml(texto: str) -> str:
    """Escapa caracteres especiales XML."""
    return (texto
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&apos;'))


def main():
    """Función principal: parsea rutas.xml y genera KML y SVG para cada ruta."""
    print('Generador de archivos KML y SVG – Turismo Salamanca')
    print('=' * 50)

    if not os.path.exists(RUTAS_XML):
        print(f'ERROR: No se encuentra el archivo {RUTAS_XML}')
        return

    raiz = parsear_rutas(RUTAS_XML)
    rutas = raiz.findall('ruta')
    print(f'Rutas encontradas: {len(rutas)}')

    for i, ruta in enumerate(rutas, start=1):
        nombre = ruta.findtext('nombre', 'Ruta desconocida')
        print(f'\nProcesando ruta {i}: {nombre}')

        kml_path = os.path.join(OUTPUT_DIR, f'ruta{i}_planimetria.kml')
        svg_path = os.path.join(OUTPUT_DIR, f'ruta{i}_altimetria.svg')

        generar_kml(ruta, kml_path)
        generar_svg(ruta, svg_path)

    print('\n' + '=' * 50)
    print('Generación completada.')


if __name__ == '__main__':
    main()
