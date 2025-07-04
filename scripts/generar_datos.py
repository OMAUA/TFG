import requests
import xml.etree.ElementTree as ET
import json
from datetime import datetime, timedelta
import pytz  # Para manejar zonas horarias

# Definir la zona horaria de Europa/Madrid
zona_horaria = pytz.timezone("Europe/Madrid")

# Obtener la fecha y hora actual en la zona horaria de Europa/Madrid
fecha_actual_madrid = datetime.now(zona_horaria)
fecha_actual_str = fecha_actual_madrid.strftime("%d/%m/%Y %H:%M")

# Función para comprobar si la fecha/hora del XML es válida (dentro de los últimos 10 minutos)
def es_dato_actualizado(fecha_str, hora_str):
    try:
        # Convertir la fecha y hora del XML a un objeto datetime
        fecha_hora_str = f"{fecha_str} {hora_str}"
        fecha_hora_xml = datetime.strptime(fecha_hora_str, "%d/%m/%Y %H:%M")

        # Ajustar la zona horaria
        fecha_hora_xml = zona_horaria.localize(fecha_hora_xml)

        # Verificar si el dato está dentro de los últimos 10 minutos
        return (fecha_actual_madrid - fecha_hora_xml) <= timedelta(minutes=10)
    except ValueError:
        print(f"⚠️ Error al convertir fecha/hora: {fecha_str} {hora_str}")
        return False

def extraer_bloque_completo(root, bloque, campos_esperados, namespace):
    bloque_elem = root.find(f"ns:{bloque}", namespace)
    datos = {campo: None for campo in campos_esperados}
    if bloque_elem is not None:
        for child in bloque_elem:
            tag = child.tag.split('}', 1)[-1]  # Quitar el namespace
            if tag in datos:
                datos[tag] = child.text
            else:
                datos[tag] = child.text  # Añadir campos extra si aparecen
    return datos

# Lista de estaciones con sus datos manuales (nombre, latitud y longitud)
estaciones = [
    {"nombre": "Acequion - Torrevieja", "latitud": "37.979987", "longitud": "-0.688619", "url": "http://www.datos.eltiempoentorrevieja.es/Acequion/acequion"},
    {"nombre": "Patricio Perez - Torrevieja", "latitud": "37.977346", "longitud": "-0.684409", "url": "http://www.datos.eltiempoentorrevieja.es/PatricioPerez/patricioperez"},
    {"nombre": "Centro - Torrevieja", "latitud": "37.9758601", "longitud": "-0.6824636", "url": "http://www.datos.eltiempoentorrevieja.es/Centro/centro.txt"},
    {"nombre": "Aguas Nuevas - Torrevieja", "latitud": "37.998341", "longitud": "-0.664749", "url": "http://www.datos.eltiempoentorrevieja.es/AguasNuevas/aguasnuevas"},
    {"nombre": "La Mata - Parque", "latitud": "38.0240018", "longitud": "-0.6587566", "url": "http://www.datos.eltiempoentorrevieja.es/LaMata_Parque/parquenatural.xml"},
    {"nombre": "Salinas - Torrevieja", "latitud": "37.978448", "longitud": "-0.702041", "url": "http://www.datos.eltiempoentorrevieja.es/Salinas/salinas1"},
    {"nombre": "Los Montesinos - Montesinos", "latitud": "38.021563", "longitud": "0.741981", "url": "http://www.datos.eltiempoentorrevieja.es/LosMontesinos/montesinos.xml"},
    {"nombre": "Los Balcones - Lago Jardin", "latitud": "37.972816", "longitud": "-0.728702", "url": "http://www.datos.eltiempoentorrevieja.es/LosBalcones/balconesjardin"},
    {"nombre": "Romualdo Ballester - Torrevieja", "latitud": "37.955111", "longitud": "-0.717841", "url": "http://www.datos.eltiempoentorrevieja.es/RomualdoBallester/ColegioRomualdo.xml"},
    {"nombre": "IES Torrevigía - Torrevieja", "latitud": "37.998659", "longitud": "-0.695838", "url": "http://www.datos.eltiempoentorrevieja.es/IESTorrevigia/iestorrevigia"},
    {"nombre": "San Miguel de Salinas", "latitud": "37.9872061", "longitud": "-0.7673557", "url": "http://www.datos.eltiempoentorrevieja.es/SanMiguel/sanmiguel"},
    {"nombre": "Marina Salinas - Torrevieja", "latitud": "37.969785", "longitud": "-0.680555", "url": "http://www.datos.eltiempoentorrevieja.es/MarinaSalinas/marinasalinas.xml"},
    {"nombre": "Salinas Isla - Torrevieja", "latitud": "37.991396", "longitud": "-0.720184", "url": "http://www.datos.eltiempoentorrevieja.es/Salinas_Isla/salinas2"},
    {"nombre": "Colegio Salvador Ruso - Torrevieja", "latitud": "37.985066", "longitud": "-0.672346", "url": "http://www.datos.eltiempoentorrevieja.es/SalvadorRuso/salvadorruso"},
    {"nombre": "San Luis - Torrevieja", "latitud": "38.024264", "longitud": "-0.697408", "url": "http://www.datos.eltiempoentorrevieja.es/SanLuis/sanluis.xml"},
    {"nombre": "Europeos - La Mata", "latitud": "38.017269", "longitud": "-0.653988", "url": "http://www.datos.eltiempoentorrevieja.es/LaMata_Europeos/europeoslamata"},
    {"nombre": "El Raso - Rojales", "latitud": "38.054724", "longitud": "-0.696401", "url": "http://www.datos.eltiempoentorrevieja.es/Rojales/rojales"},
    {"nombre": "Playa de los Locos - Torrevieja", "latitud": "37.9848708", "longitud": "-0.6587313", "url": "http://www.datos.eltiempoentorrevieja.es/LosLocos/loslocos"},
    {"nombre": "Plaza Waldo Calero - Torrevieja", "latitud": "37.9760295", "longitud": "-0.6807944", "url": "http://datos.eltiempoentorrevieja.es/WaldoCalero/WaldoCalero.xml"},
    {"nombre": "Restaurante Nautilus - Torrevieja", "latitud": "37.9468063", "longitud": "-0.7049459", "url": "http://datos.eltiempoentorrevieja.es/Nautilus/Nautilus.xml"},
]
# Espacio de nombres en el XML (si es necesario)
NAMESPACE = {"ns": "https://www.w3schools.com"}

# Lista para almacenar los datos procesados
datos_estaciones = []

# Definir las listas de campos
campos_actuales = [
    "temperatura", "humedad", "presion", "velocidadviento", "rachaviento",
    "direccionviento", "direccionviento_grados", "lluvia", "intensidadlluvia",
    "lluviaultimahora", "puntoderocio"
]
campos_diarios = [
    "temperaturamaxima", "temperaturamaximahora", "temperaturaminima", "temperaturaminimahora",
    "humedadmaxima", "humedadmaximahora", "humedadminima", "humedadminimahora",
    "presionmaxima", "presionminima", "rachaviento", "rachavientohora", "lluvia",
    "intensidadlluvia", "intensidadlluviahora", "puntoderociomaximo", "puntoderociominimo"
]
campos_mensuales = [
    "temperaturamaxima", "temperaturamaximadia", "temperaturaminima", "temperaturaminimadia",
    "humedadmaxima", "humedadmaximadia", "humedadminima", "humedadminimadia",
    "presionmaxima", "presionminima", "rachaviento", "rachavientodia", "lluvia",
    "intensidadlluvia", "intensidadlluviadia", "puntoderociomaximo", "puntoderociominimo"
]
campos_anuales = [
    "temperaturamaxima", "temperaturamaximadia", "temperaturaminima", "temperaturaminimadia",
    "humedadmaxima", "humedadmaximadia", "humedadminima", "humedadminimadia",
    "presionmaxima", "presionminima", "rachaviento", "rachavientodia", "lluvia",
    "intensidadlluvia", "intensidadlluviadia", "puntoderociomaximo", "puntoderociominimo"
]
campos_astronomia = [
    "salidasol", "puestasol", "salidaluna", "puestaluna", "faselunar", "porcentajeluna",
    "duraciondia", "edadlunar", "dia_noche", "lloviendo", "radiacionsolarmax"
]

for estacion in estaciones:
    try:
        response = requests.get(estacion["url"], timeout=10)
        response.raise_for_status()

        root = ET.fromstring(response.content)

        fecha = root.find("ns:fecha", NAMESPACE)
        hora = root.find("ns:hora", NAMESPACE)
        # Extraer todos los bloques
        actuales = extraer_bloque_completo(root, "actuales", campos_actuales, NAMESPACE)
        diarios = extraer_bloque_completo(root, "diarios", campos_diarios, NAMESPACE)
        mensuales = extraer_bloque_completo(root, "mensuales", campos_mensuales, NAMESPACE)
        anuales = extraer_bloque_completo(root, "anuales", campos_anuales, NAMESPACE)
        astronomia = extraer_bloque_completo(root, "astronomia", campos_astronomia, NAMESPACE)
        
        # Corrección de campos ...hora -> ...dia para mensuales y anuales
        def corregir_hora_a_dia(bloque):
            conversion = {
                "temperaturamaximahora": "temperaturamaximadia",
                "temperaturaminimahora": "temperaturaminimadia",
                "humedadmaximahora": "humedadmaximadia",
                "humedadminimahora": "humedadminimadia",
                "rachavientohora": "rachavientodia",
                "intensidadlluviahora": "intensidadlluviadia"
            }
            for k_hora, k_dia in conversion.items():
                if bloque.get(k_hora) not in [None, ""]:
                    bloque[k_dia] = bloque[k_hora]
                if k_hora in bloque:
                    del bloque[k_hora]
        
        corregir_hora_a_dia(mensuales)
        corregir_hora_a_dia(anuales)
        
        if fecha is not None and hora is not None:
            if es_dato_actualizado(fecha.text, hora.text):
                datos_estaciones.append({
                    "estacion": estacion["nombre"],
                    "latitud": estacion["latitud"],
                    "longitud": estacion["longitud"],
                    "fecha": fecha.text,
                    "hora": hora.text,
                    "actuales": actuales,
                    "diarios": diarios,
                    "mensuales": mensuales,
                    "anuales": anuales,
                    "astronomia": astronomia
                })
            else:
                print(f"⚠️ Dato desactualizado en {estacion['nombre']}, se omite esta estación.")
        else:
            print(f"⚠️ Datos incompletos en {estacion['nombre']}, se omite esta estación.")

    except requests.RequestException as e:
        print(f"❌ Error al descargar datos de {estacion['nombre']}: {e}")
    except ET.ParseError as e:
        print(f"❌ Error al procesar XML de {estacion['nombre']}: {e}")

# Construir la estructura del JSON con cabecera
datos_finales = {
    "metadata": {
        "fuente": "Proyecto Mastral",
        "fecha_generacion": fecha_actual_str,  # Ahora en hora local de Madrid
        "numero_estaciones": len(datos_estaciones)
    },
    "datos": datos_estaciones
}

# Guardar en un archivo JSON
data_json_path = "scripts/datos_meteorologicos.json"
with open(data_json_path, "w", encoding="utf-8") as f:
    json.dump(datos_finales, f, indent=4, ensure_ascii=False)

print(f"✅ Datos meteorológicos guardados en '{data_json_path}' con fecha: {fecha_actual_str}")