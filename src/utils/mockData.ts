// Estructura de los sensores ambientales
export interface SensorStation {

    // ID del sensor
    id: number;

    // Nombre del sensor
    name: string;
    
    // Ubicación del sensor en el mapa
    location: {
        x: number; // Porcentaje desde la izquierda del mapa
        y: number; // Porcentaje desde la parte superior del mapa
    };
    
    // Datos ambientales del sensor
    data: {
        temperature: number;        // En Celsius
        humidity: number;           // En porcentaje
        waterLevel: number;         // En cm
        salinity: number;           // En PSU (Unidad Práctica de Salinidad)
        pH: number;                 // En escala pH
        dissolvedOxygen: number;    // En mg/L
        turbidity: number;          // En NTU (Unidad de Turbidez Nephelométrica)
        algaeConcentration: number; // En µg/L
    };

}

// Estructura de los datos de pronóstico
export interface ForecastData {

    // Parámetro del pronóstico
    parameter: string;

    // Datos actuales
    actualData: Array<{ date: string; value: number }>;

    // Datos pronosticados
    forecastData: Array<{ date: string; value: number }>;

}

// Datos simulados para los sensores ambientales
export const sensorStations: SensorStation[] = [

    {
        id: 1,
        name: "Norte",
        location: {
            x: 25,
            y: 15
        },
        data: {
            temperature: 28.5,
            humidity: 65,
            waterLevel: 120,
            salinity: 35.2,
            pH: 8.1,
            dissolvedOxygen: 6.8,
            turbidity: 5.2,
            algaeConcentration: 12.5
        }
    },

    {
        id: 2,
        name: "Este",
        location: {
            x: 70,
            y: 30
        },
        data: {
            temperature: 29.2,
            humidity: 60,
            waterLevel: 115,
            salinity: 36.5,
            pH: 7.9,
            dissolvedOxygen: 6.2,
            turbidity: 6.8,
            algaeConcentration: 18.3
        }
    },

    {
        id: 3,
        name: "Sur",
        location: {
            x: 45,
            y: 80
        },
        data: {
            temperature: 30.1,
            humidity: 55,
            waterLevel: 90,
            salinity: 38.1,
            pH: 7.7,
            dissolvedOxygen: 5.9,
            turbidity: 8.5,
            algaeConcentration: 24.7
        }
    },

    {
        id: 4,
        name: "Oeste",
        location: {
            x: 15,
            y: 50
        },
        data: {
            temperature: 27.8,
            humidity: 70,
            waterLevel: 125,
            salinity: 34.8,
            pH: 8.3,
            dissolvedOxygen: 7.2,
            turbidity: 4.6,
            algaeConcentration: 9.8
        }
    },

    {
        id: 5,
        name: "Centro",
        location: {
            x: 50,
            y: 50
        },
        data: {
            temperature: 29.5,
            humidity: 62,
            waterLevel: 110,
            salinity: 37.0,
            pH: 8.0,
            dissolvedOxygen: 6.5,
            turbidity: 6.2,
            algaeConcentration: 15.6
        }
    },

    {
        id: 6,
        name: "Noreste",
        location: {
            x: 65,
            y: 20
        },
        data: {
            temperature: 28.8,
            humidity: 63,
            waterLevel: 118,
            salinity: 35.8,
            pH: 8.2,
            dissolvedOxygen: 6.7,
            turbidity: 5.5,
            algaeConcentration: 13.2
        }
    },

    {
        id: 7,
        name: "Sureste",
        location: {
            x: 75,
            y: 65
        },
        data: {
            temperature: 30.5,
            humidity: 53,
            waterLevel: 85,
            salinity: 39.2,
            pH: 7.6,
            dissolvedOxygen: 5.7,
            turbidity: 9.1,
            algaeConcentration: 26.4
        }
    },

    {
        id: 8,
        name: "Suroeste",
        location: {
            x: 30,
            y: 70
        },
        data: {
            temperature: 29.8,
            humidity: 58,
            waterLevel: 95,
            salinity: 37.5,
            pH: 7.8,
            dissolvedOxygen: 6.0,
            turbidity: 7.5,
            algaeConcentration: 20.1
        }
    }

];

// Parámetros ambientales
export const environmentalParameters = [

    { id: 'temperature', name: 'Temperatura', unit: '°C', category: 'Clima' },
    { id: 'humidity', name: 'Humedad', unit: '%', category: 'Clima' },
    { id: 'waterLevel', name: 'Nivel de Agua', unit: 'cm', category: 'Hidrología' },
    { id: 'salinity', name: 'Salinidad', unit: 'PSU', category: 'Agua' },
    { id: 'pH', name: 'pH', unit: '', category: 'Agua' },
    { id: 'dissolvedOxygen', name: 'Oxígeno Disuelto', unit: 'mg/L', category: 'Agua' },
    { id: 'turbidity', name: 'Turbidez', unit: 'NTU', category: 'Agua' },
    { id: 'algaeConcentration', name: 'Concentración de Algas', unit: 'µg/L', category: 'Biología' }

];

// Datos agregados
export const aggregateData = {

    temperature: {
        min: 27.8,
        max: 30.5,
        avg: 29.3,
        trend: 0.2
    },

    humidity: {
        min: 53,
        max: 70,
        avg: 60.8,
        trend: -0.5
    },

    waterLevel: {
        min: 85,
        max: 125,
        avg: 107.3,
        trend: -0.3
    },

    salinity: {
        min: 34.8,
        max: 39.2,
        avg: 36.8,
        trend: 0.1
    },

    pH: {
        min: 7.6,
        max: 8.3,
        avg: 7.95,
        trend: -0.05
    },

    dissolvedOxygen: {
        min: 5.7,
        max: 7.2,
        avg: 6.4,
        trend: -0.1
    },

    turbidity: {
        min: 4.6,
        max: 9.1,
        avg: 6.7,
        trend: 0.3
    },

    algaeConcentration: {
        min: 9.8,
        max: 26.4,
        avg: 17.6,
        trend: 0.4
    }

};

// Datos de series temporales para gráficos
export const timeSeriesData = [

    { month: 'Ene', temperature: 24.5, humidity: 68, waterLevel: 115 },
    { month: 'Feb', temperature: 25.2, humidity: 65, waterLevel: 118 },
    { month: 'Mar', temperature: 26.5, humidity: 63, waterLevel: 120 },
    { month: 'Abr', temperature: 27.8, humidity: 60, waterLevel: 116 },
    { month: 'May', temperature: 28.9, humidity: 58, waterLevel: 112 },
    { month: 'Jun', temperature: 29.3, humidity: 61, waterLevel: 107 },
    { month: 'Jul', temperature: 30.5, humidity: 55, waterLevel: 98 },
    { month: 'Ago', temperature: 31.2, humidity: 52, waterLevel: 90 },
    { month: 'Sep', temperature: 29.8, humidity: 56, waterLevel: 95 },
    { month: 'Oct', temperature: 28.3, humidity: 60, waterLevel: 105 },
    { month: 'Nov', temperature: 26.7, humidity: 63, waterLevel: 110 },
    { month: 'Dic', temperature: 25.4, humidity: 66, waterLevel: 112 }

];

// Datos de pronóstico
export const forecastData: ForecastData[] = [

    {
        parameter: "Temperatura",
        actualData: [
            { date: "Ene", value: 24.5 },
            { date: "Feb", value: 25.2 },
            { date: "Mar", value: 26.5 },
            { date: "Abr", value: 27.8 },
            { date: "May", value: 28.9 },
            { date: "Jun", value: 29.3 }
        ],
        forecastData: [
            { date: "Jul", value: 30.2 },
            { date: "Ago", value: 31.3 },
            { date: "Sep", value: 29.8 },
            { date: "Oct", value: 28.1 },
            { date: "Nov", value: 26.4 },
            { date: "Dic", value: 25.1 }
        ]
    },

    {
        parameter: "Nivel de Agua",
        actualData: [
            { date: "Ene", value: 115 },
            { date: "Feb", value: 118 },
            { date: "Mar", value: 120 },
            { date: "Abr", value: 116 },
            { date: "May", value: 112 },
            { date: "Jun", value: 107 }
        ],
        forecastData: [
            { date: "Jul", value: 98 },
            { date: "Ago", value: 90 },
            { date: "Sep", value: 95 },
            { date: "Oct", value: 105 },
            { date: "Nov", value: 110 },
            { date: "Dic", value: 113 }
        ]
    },

    {
        parameter: "Salinidad",
        actualData: [
            { date: "Ene", value: 35.0 },
            { date: "Feb", value: 35.2 },
            { date: "Mar", value: 35.5 },
            { date: "Abr", value: 36.0 },
            { date: "May", value: 36.4 },
            { date: "Jun", value: 36.8 }
        ],
        forecastData: [
            { date: "Jul", value: 37.2 },
            { date: "Ago", value: 37.8 },
            { date: "Sep", value: 37.5 },
            { date: "Oct", value: 37.0 },
            { date: "Nov", value: 36.5 },
            { date: "Dic", value: 35.8 }
        ]
    },

    {
        parameter: "Concentración de Algas",
        actualData: [
            { date: "Ene", value: 12.5 },
            { date: "Feb", value: 13.2 },
            { date: "Mar", value: 14.8 },
            { date: "Abr", value: 15.9 },
            { date: "May", value: 16.7 },
            { date: "Jun", value: 17.6 }
        ],
        forecastData: [
            { date: "Jul", value: 19.2 },
            { date: "Ago", value: 22.5 },
            { date: "Sep", value: 20.3 },
            { date: "Oct", value: 18.1 },
            { date: "Nov", value: 15.8 },
            { date: "Dic", value: 13.4 }
        ]
    }

];