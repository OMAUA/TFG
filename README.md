# Desarrollo de una aplicación web para la visualización de datos ambientales en espacios naturales

Aplicación web para la visualización y análisis de datos meteorológicos en el Parque Natural de la Laguna de Torrevieja, diseñada para ofrecer información clara, realista y adaptada a los datos disponibles de las estaciones locales.

---

## Descripción general

Este dashboard permite consultar, comparar y analizar datos meteorológicos de diferentes estaciones de Torrevieja, presentando la información de forma visual, intuitiva y adaptada a la realidad climática local. La aplicación está estructurada en tres componentes principales, cada uno con una función y visualización específica.

---

## Componentes principales

### 1. DataDashboard

**¿Qué muestra?**

- **Tarjetas de datos actuales:** Visualización de los valores actuales de temperatura, humedad, presión, viento, lluvia... de todas las estaciones a la vez o de una estación en específico.
- **Tarjetas de lluvia:** Muestra la lluvia registrada en la última hora y la lluvia total anual.
- **Tablas de extremos:** Presenta los valores máximos y mínimos diarios, mensuales y anuales para cada variable.
- **Texto descriptivo:** Explica el contexto de los datos y cambia dinámicamente según si se visualizan todas las estaciones o una concreta.

---

### 2. MapView

**¿Qué muestra?**

- **Mapa interactivo:** Visualiza la ubicación geográfica de todas las estaciones meteorológicas de Torrevieja.
- **Interacción:** Permite seleccionar una estación en el mapa para acceder directamente a sus datos actuales detallados.
- **Texto descriptivo:** Se incluye una descripción sobre la utilidad del mapa para comprender la distribución espacial de las estaciones y facilitar el acceso a la información.

---

### 3. ForecastDashboard

**¿Qué muestra?**

- **Medias y tendencias:** Muestra la media global actual, mensual y anual de las variables clave: temperatura, humedad, presión y lluvia.
- **Comparativas y análisis:** Presenta comparativas realistas y tendencias basadas en los datos disponibles.
- **Tarjeta de previsión cualitativa:** Mensajes dinámicos que interpretan la tendencia de cada variable según el mes actual y la estacionalidad típica de Torrevieja.
- **Texto descriptivo:** Explica el objetivo de la sección y el contexto de los datos mostrados, siguiendo el mismo formato que el resto de componentes.

---

## Características principales

- **Visualización clara y realista:** Presentación de datos adaptada a la realidad local y a la disponibilidad de la información.
- **Textos explicativos y adaptativos:** Cada sección incluye descripciones que facilitan la interpretación de los datos y se adaptan dinámicamente al contexto.
- **Lógica robusta:** Cálculos y visualizaciones preparados para gestionar datos faltantes y evitar errores o interpretaciones incorrectas.
- **Formato normalizado:** Unificación de formatos numéricos y de fecha/hora para facilitar la comparación y comprensión de los datos.
- **Interfaz intuitiva:** Navegación sencilla entre datos, mapa y previsiones.

---

## Estructura del proyecto

- `src/pages/`: Páginas principales de la aplicación.
- `src/components/Layout.tsx`: Estructura general de la aplicación y navegación.
- `src/components/DataDashboard.tsx`: Panel principal de datos de las estaciones.
- `src/components/MapView.tsx`: Mapa interactivo de estaciones.
- `src/components/ForecastDashboard.tsx`: Panel de previsiones y análisis comparativo.
- `public/datos_meteorologicos.json`: Fuente de datos meteorológicos.
- `scripts/`: Scripts para la actualización y generación de datos.

---

## Notas técnicas

- Proyecto desarrollado con React, TypeScript y Vite.
- Estilos gestionados con Tailwind CSS.
- Los datos meteorológicos se almacenan en formato JSON y se actualizan mediante scripts automatizados.

---

## Créditos

Desarrollado por Óscar Medina Amat.
