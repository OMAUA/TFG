import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { sensorStations, environmentalParameters, aggregateData, timeSeriesData } from "@/utils/mockData";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface DataDashboardProps {
    selectedStationId: string | null;
    onStationChange?: (stationId: string) => void;
}

const DataDashboard = ({ selectedStationId, onStationChange }: DataDashboardProps) => {
    const [currentStationId, setCurrentStationId] = useState<string>("todas");

    // Actualizar el estado cuando cambia el selectedStationId
    useEffect(() => {
        if (selectedStationId) {
            setCurrentStationId(selectedStationId);
        }
    }, [selectedStationId]);

    // Manejar cambios en la selección de la estación
    const handleStationChange = (stationId: string) => {
        // Actualizar el estado local
        setCurrentStationId(stationId);
        
        // Actualizar el estado del componente padre
        if (onStationChange) {
            onStationChange(stationId);
        }
    };

    const getTrendIcon = (trend: number) => {
        if(trend > 0.1) return <ArrowUp className="text-eco-red h-4 w-4"/>;
        if(trend < -0.1) return <ArrowDown className="text-eco-green h-4 w-4"/>;
        return <Minus className="text-muted-foreground h-4 w-4"/>;
    };
  
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Datos Ambientales</h2>
                <div className="flex gap-4 items-center">
                    <Select value={currentStationId} onValueChange={handleStationChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Estación"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="todas">Todas las estaciones</SelectItem>
                                {sensorStations.map(station => (
                                    <SelectItem key={station.id} value={station.id.toString()}>
                                        Estación {station.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        Última actualización: {new Date().toLocaleString('es-ES')}
                    </span>
                </div>
            </div>
            {/* Tarjetas de parámetros */}
            <div className="grid grid-cols-4 gap-4">
                {environmentalParameters.slice(0, 4).map(param => {
                    const paramData = aggregateData[param.id as keyof typeof aggregateData];
                    return (
                        <Card key={param.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <span>{param.name}</span>
                                    <div className="flex items-center text-sm font-normal">
                                        {getTrendIcon(paramData.trend)}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold">
                                    {paramData.avg.toFixed(1)} {param.unit}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Min: {paramData.min} {param.unit} | Max: {paramData.max} {param.unit}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            <div className="grid grid-cols-4 gap-4">
                {environmentalParameters.slice(4).map(param => {
                    const paramData = aggregateData[param.id as keyof typeof aggregateData];
                    return (
                        <Card key={param.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <span>{param.name}</span>
                                    <div className="flex items-center text-sm font-normal">
                                        {getTrendIcon(paramData.trend)}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold">
                                    {paramData.avg.toFixed(1)} {param.unit}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Min: {paramData.min} {param.unit} | Max: {paramData.max} {param.unit}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            {/* Gráficos */}
            <div className="grid grid-cols-2 gap-6">
                {/* Series temporales de temperatura y humedad */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Evolución de Temperatura y Humedad</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={timeSeriesData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="temperature"
                                        name="Temperatura (°C)"
                                        stroke="#E74C3C"
                                        fill="#F5B7B1"
                                    />
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="humidity"
                                        name="Humedad (%)"
                                        stroke="#3498DB"
                                        fill="#7FB3D5"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                {/* Gráfico de barras del nivel de agua */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Nivel de Agua por Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={timeSeriesData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="waterLevel"
                                        name="Nivel de Agua (cm)"
                                        fill="#2ECC71"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Comparativa entre estaciones */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Comparativa entre Estaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={sensorStations.map(station => ({
                                    name: station.name,
                                    temperatura: station.data.temperature,
                                    salinidad: station.data.salinity,
                                    turbidez: station.data.turbidity,
                                }))}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="temperatura" name="Temperatura (°C)" fill="#E74C3C" />
                                <Bar dataKey="salinidad" name="Salinidad (PSU)" fill="#3498DB" />
                                <Bar dataKey="turbidez" name="Turbidez (NTU)" fill="#F1C40F" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DataDashboard;