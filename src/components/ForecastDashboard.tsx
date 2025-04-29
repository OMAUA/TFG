import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { forecastData } from "@/utils/mockData";

const ForecastDashboard = () => {

    const [activeParameter, setActiveParameter] = useState("Temperatura");
  
    // Encontrar los datos de previsión seleccionados
    const selectedForecast = forecastData.find(data => data.parameter === activeParameter);
  
    // Combinar datos reales y de previsión para el gráfico
    const combinedData = selectedForecast
        ? [
            ...selectedForecast.actualData.map(item => ({
                ...item,
                tipo: "actual",
                [`${activeParameter} (Actual)`]: item.value,
            })),
            ...selectedForecast.forecastData.map(item => ({
                ...item,
                tipo: "forecast",
                [`${activeParameter} (Previsto)`]: item.value,
            })),
        ]
        : [];
    
    // Mapeo de colores para diferentes parámetros
    const colorMap: Record<string, { actual: string; forecast: string }> = {

        "Temperatura": { actual: "#E74C3C", forecast: "#F5B7B1" },
        "Nivel de Agua": { actual: "#2ECC71", forecast: "#A9DFBF" },
        "Salinidad": { actual: "#3498DB", forecast: "#7FB3D5" },
        "Concentración de Algas": { actual: "#F1C40F", forecast: "#F9E79F" }
        
    };
  
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Previsiones Ambientales</h2>
                <span className="text-sm text-muted-foreground">
                    Última actualización: {new Date().toLocaleString('es-ES')}
                </span>
            </div>
            {/* Pestañas de selección de parámetros */}
            <Tabs 
                value={activeParameter} 
                onValueChange={setActiveParameter}
                className="space-y-4"
            >
                <TabsList className="grid grid-cols-4">
                    {forecastData.map(data => (
                        <TabsTrigger key={data.parameter} value={data.parameter}>
                            {data.parameter}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {/* Contenido de previsión para parámetros individuales */}
                {forecastData.map(data => (
                    <TabsContent key={data.parameter} value={data.parameter} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Datos Actuales</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <div className="text-2xl font-semibold">
                                            {data.actualData[data.actualData.length - 1].value.toFixed(1)}
                                            {data.parameter === "Temperatura" ? " °C" : 
                                                data.parameter === "Nivel de Agua" ? " cm" : 
                                                data.parameter === "Salinidad" ? " PSU" : " µg/L"}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {data.actualData[data.actualData.length - 1].date}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Previsión Próximo Mes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <div className="text-2xl font-semibold">
                                            {data.forecastData[0].value.toFixed(1)}
                                            {data.parameter === "Temperatura" ? " °C" : 
                                                data.parameter === "Nivel de Agua" ? " cm" : 
                                                data.parameter === "Salinidad" ? " PSU" : " µg/L"}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {data.forecastData[0].date}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Gráfico de previsión */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Evolución y Previsión de {data.parameter}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={combinedData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey={`${data.parameter} (Actual)`}
                                                name="Datos Reales"
                                                stroke={colorMap[data.parameter]?.actual || "#E74C3C"}
                                                strokeWidth={2}
                                                dot={{ r: 5 }}
                                                isAnimationActive={true}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={`${data.parameter} (Previsto)`}
                                                name="Previsión"
                                                stroke={colorMap[data.parameter]?.forecast || "#F5B7B1"}
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={{ r: 5 }}
                                                isAnimationActive={true}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Análisis de previsión */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Análisis de Previsión</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm">
                                        {data.parameter === "Temperatura" ? 
                                            "Se prevé un aumento de temperatura durante los meses de verano, con un pico en agosto que podría alcanzar los 31.3°C. A partir de septiembre, se espera un descenso gradual hacia valores más moderados." :
                                            data.parameter === "Nivel de Agua" ? 
                                                "El nivel de agua muestra una clara tendencia decreciente durante los meses de verano debido a la evaporación y menor precipitación. Se espera recuperación gradual a partir de octubre con la llegada de lluvias otoñales." :
                                                data.parameter === "Salinidad" ? 
                                                    "La salinidad tiende a aumentar durante los meses cálidos debido a la mayor evaporación. Los valores más altos se esperan en agosto (37.8 PSU) y comenzarán a normalizarse con las primeras lluvias de otoño." :
                                                    "La concentración de algas muestra un patrón estacional, con valores máximos esperados en agosto. Esto coincide con las temperaturas más altas y niveles de agua más bajos, factores que favorecen la proliferación de algas."}
                                    </p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-muted rounded-lg p-3">
                                            <h3 className="text-sm font-medium mb-1">Tendencia</h3>
                                            <p className="text-sm">
                                                {data.parameter === "Temperatura" ? 
                                                    "Aumento en verano, descenso en otoño" :
                                                    data.parameter === "Nivel de Agua" ? 
                                                        "Descenso progresivo con recuperación otoñal" :
                                                        data.parameter === "Salinidad" ? 
                                                            "Incremento gradual hasta agosto, luego descenso" :
                                                            "Pico en agosto, descenso progresivo hacia invierno"}
                                            </p>
                                        </div>
                                        <div className="bg-muted rounded-lg p-3">
                                            <h3 className="text-sm font-medium mb-1">Factores de Influencia</h3>
                                            <p className="text-sm">
                                                {data.parameter === "Temperatura" ? 
                                                    "Radiación solar, vientos costeros" :
                                                    data.parameter === "Nivel de Agua" ? 
                                                        "Evaporación, precipitaciones, vertidos" :
                                                        data.parameter === "Salinidad" ? 
                                                            "Evaporación, intercambio con el mar" :
                                                            "Temperatura, nutrientes, nivel de agua"}
                                            </p>
                                        </div>
                                        <div className="bg-muted rounded-lg p-3">
                                            <h3 className="text-sm font-medium mb-1">Impacto Potencial</h3>
                                            <p className="text-sm">
                                                {data.parameter === "Temperatura" ? 
                                                    "Estrés en ecosistemas acuáticos, mayor evaporación" :
                                                    data.parameter === "Nivel de Agua" ? 
                                                        "Exposición de orillas, concentración de contaminantes" :
                                                        data.parameter === "Salinidad" ? 
                                                            "Cambios en hábitats de especies endémicas" :
                                                            "Reducción de oxígeno, impacto visual, cambio en turbidez"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
            {/* Información adicional sobre previsiones */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Metodología de Previsión</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">
                        Las previsiones mostradas se basan en un modelo estadístico que combina datos históricos de los últimos 5 años con variables climatológicas actuales. El modelo tiene un margen de error aproximado del ±8% y se actualiza semanalmente con los nuevos datos recopilados por las estaciones de monitorización.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForecastDashboard;