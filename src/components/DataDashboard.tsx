import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { PieChart, Pie, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Select as UiSelect, SelectTrigger as UiSelectTrigger, SelectValue as UiSelectValue, SelectContent as UiSelectContent, SelectItem as UiSelectItem } from "@/components/ui/select";

interface DataDashboardProps {
    selectedStationId: string | null;
    onStationChange?: (stationId: string) => void;
}

// Variables ambientales principales a mostrar (mismo orden y nombres que en el mapa)
const environmentalParameters = [
    { id: "temperatura", name: "Temperatura", unit: "°C" },
    { id: "humedad", name: "Humedad", unit: "%" },
    { id: "presion", name: "Presión", unit: "hPa" },
    { id: "puntoderocio", name: "Punto de rocío", unit: "°C" },
    { id: "velocidadviento", name: "Velocidad del viento", unit: "km/h" },
    { id: "direccionviento", name: "Dirección del viento", unit: "" },
    { id: "lluvia", name: "Lluvia", unit: "mm" },
    { id: "intensidadlluvia", name: "Intensidad de lluvia", unit: "mm/h" },
];

// Tipo para los datos de estación
interface EstacionData {
    estacion: string;
    latitud: string;
    longitud: string;
    fecha: string;
    hora: string;
    actuales: Record<string, string>;
    diarios?: Record<string, string>;
    mensuales?: Record<string, string>;
    anuales?: Record<string, string>;
    astronomia?: Record<string, string | null>;
}

interface DatosJSON {
    metadata: {
        fuente: string;
        fecha_generacion: string;
        numero_estaciones: number;
    };
    datos: EstacionData[];
}

const DataDashboard = ({ selectedStationId, onStationChange }: DataDashboardProps) => {
    const [currentStationId, setCurrentStationId] = useState<string>("todas");
    const [data, setData] = useState<DatosJSON | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Variables para el gráfico unificado de extremos
    const extremosVariables = [
        { id: 'temperatura', label: 'Temperatura', unit: '°C', color1: '#E74C3C', color2: '#8E44AD' },
        { id: 'humedad', label: 'Humedad', unit: '%', color1: '#3498DB', color2: '#1F618D' },
        { id: 'presion', label: 'Presión', unit: 'hPa', color1: '#7D3C98', color2: '#1ABC9C' },
        { id: 'rachaViento', label: 'Velocidad máxima del viento', unit: 'km/h', color1: '#F1C40F', color2: '#B7950B' },
        { id: 'lluvia', label: 'Lluvia', unit: 'mm', color1: '#2874A6', color2: '#85C1E9' },
    ];
    const [extremosVar, setExtremosVar] = useState('temperatura');
    const extremosVarObj = extremosVariables.find(v => v.id === extremosVar) || extremosVariables[0];

    // Variables para evolución mensual
    const evolucionMensualVariables = [
        { id: 'temperaturamaxima', label: 'Temperatura máxima', unit: '°C', color: '#E74C3C', labelDia: 'temperaturamaximadia' },
        { id: 'lluvia', label: 'Lluvia acumulada', unit: 'mm', color: '#2ECC71', labelDia: null },
    ];
    const [evolucionMensualVar, setEvolucionMensualVar] = useState('temperaturamaxima');
    const evolucionMensualVarObj = evolucionMensualVariables.find(v => v.id === evolucionMensualVar) || evolucionMensualVariables[0];

    // Variables para extremos anuales
    const extremosAnualesVariables = [
        { id: 'temperatura', label: 'Temperatura', unit: '°C', color: '#E74C3C', max: 'temperaturamaxima', min: 'temperaturaminima', maxDia: 'temperaturamaximadia', minDia: 'temperaturaminimadia' },
        { id: 'humedad', label: 'Humedad', unit: '%', color: '#3498DB', max: 'humedadmaxima', min: 'humedadminima', maxDia: 'humedadmaximadia', minDia: 'humedadminimadia' },
        { id: 'presion', label: 'Presión', unit: 'hPa', color: '#7D3C98', max: 'presionmaxima', min: 'presionminima', maxDia: 'presionmaximadia', minDia: 'presionminimadia' },
        { id: 'rachaviento', label: 'Racha máxima de viento', unit: 'km/h', color: '#F1C40F', max: 'rachaviento', min: null, maxDia: 'rachavientodia', minDia: null },
    ];
    const [extremosAnualesVar, setExtremosAnualesVar] = useState('temperatura');
    const extremosAnualesVarObj = extremosAnualesVariables.find(v => v.id === extremosAnualesVar) || extremosAnualesVariables[0];

    // Variables para comparativa entre estaciones
    const comparativaVariables = [
        { id: 'temperatura', label: 'Temperatura', unit: '°C', color: '#E74C3C' },
        { id: 'humedad', label: 'Humedad', unit: '%', color: '#3498DB' },
        { id: 'presion', label: 'Presión', unit: 'hPa', color: '#F1C40F' },
        { id: 'viento', label: 'Velocidad del viento', unit: 'km/h', color: '#8E44AD' },
    ];
    const [comparativaVar, setComparativaVar] = useState('temperatura');
    const comparativaVarObj = comparativaVariables.find(v => v.id === comparativaVar) || comparativaVariables[0];

    // Cargar datos reales
    useEffect(() => {
        setLoading(true);
        fetch("/datos_meteorologicos.json")
            .then(res => {
                if (!res.ok) throw new Error("No se pudo cargar el archivo de datos");
                return res.json();
            })
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Actualizar el estado cuando cambia el selectedStationId
    useEffect(() => {
        if (selectedStationId) {
            setCurrentStationId(selectedStationId);
        }
    }, [selectedStationId]);

    // Manejar cambios en la selección de la estación
    const handleStationChange = (stationId: string) => {
        setCurrentStationId(stationId);
        if (onStationChange) {
            onStationChange(stationId);
        }
    };

    // Calcular agregados para cada parámetro
    function getAggregates(paramId: string) {
        if (!data) return { avg: 0, min: 0, max: 0, trend: 0 };
        const values: number[] = [];
        const prevValues: number[] = [];
        let estaciones: EstacionData[] = data.datos;
        if (currentStationId !== "todas") {
            estaciones = estaciones.filter((e: EstacionData, idx: number) => idx.toString() === currentStationId || e.estacion === currentStationId);
        }
        for (const est of estaciones) {
            const val = parseFloat(est.actuales[paramId]?.replace(",", "."));
            if (!isNaN(val)) values.push(val);
            // Para tendencia: simulamos valor anterior restando 1 (ejemplo simple)
            const prev = val - (Math.random() * 0.5); // Simulación, ya que no hay histórico real
            if (!isNaN(prev)) prevValues.push(prev);
        }
        if (values.length === 0) return { avg: 0, min: 0, max: 0, trend: 0 };
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        // Tendencia: diferencia entre media actual y "anterior"
        const prevAvg = prevValues.length ? prevValues.reduce((a, b) => a + b, 0) / prevValues.length : avg;
        const trend = avg - prevAvg;
        return { avg, min, max, trend };
    }

    // Para 'direccionviento': valor más frecuente
    function getMostFrequentDirection() {
        if (!data) return '-';
        let estaciones: EstacionData[] = data.datos;
        if (currentStationId !== "todas") {
            estaciones = estaciones.filter((e: EstacionData, idx: number) => idx.toString() === currentStationId || e.estacion === currentStationId);
        }
        const directions = estaciones.map(est => est.actuales.direccionviento).filter(Boolean);
        if (directions.length === 0) return '-';
        const freq: Record<string, number> = {};
        directions.forEach(dir => { freq[dir] = (freq[dir] || 0) + 1; });
        return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    }

    // Series temporales simuladas (usando valores actuales de cada estación)
    function getTimeSeries() {
        if (!data) return [];
        return data.datos.map(est => ({
            name: est.estacion,
            temperatura: parseFloat(est.actuales.temperatura?.replace(",", ".")),
            humedad: parseFloat(est.actuales.humedad?.replace(",", ".")),
            presion: parseFloat(est.actuales.presion?.replace(",", ".")),
            agua: parseFloat(est.actuales.lluvia?.replace(",", ".")),
        }));
    }

    // Para la comparativa entre estaciones
    function getStationComparison() {
        if (!data) return [];
        return data.datos.map((est, idx) => ({
            name: est.estacion,
            temperatura: parseFloat(est.actuales.temperatura?.replace(",", ".")),
            humedad: parseFloat(est.actuales.humedad?.replace(",", ".")),
            presion: parseFloat(est.actuales.presion?.replace(",", ".")),
            viento: parseFloat(est.actuales.velocidadviento?.replace(",", ".")),
            salinidad: parseFloat(est.actuales.salinity?.replace(",", ".")), // Si existe
            turbidez: parseFloat(est.actuales.turbidity?.replace(",", ".")), // Si existe
        }));
    }

    const getTrendIcon = (trend: number) => {
        if(trend > 0.1) return <ArrowUp className="text-eco-green h-4 w-4"/>;
        if(trend < -0.1) return <ArrowDown className="text-eco-red h-4 w-4"/>;
        return <Minus className="text-muted-foreground h-4 w-4"/>;
    };

    // Extraer datos de extremos mensuales/anuales para todas las estaciones
    function getExtremosMensualesAnuales(variable: string) {
        if (!data) return [];
        return data.datos.map(est => ({
            name: est.estacion,
            maxMensual: est.mensuales && est.mensuales[`${variable}maxima`] ? parseFloat(est.mensuales[`${variable}maxima`].replace(",", ".")) : null,
            maxMensualDia: est.mensuales && est.mensuales[`${variable}maximadia`] ? est.mensuales[`${variable}maximadia`] : null,
            minMensual: est.mensuales && est.mensuales[`${variable}minima`] ? parseFloat(est.mensuales[`${variable}minima`].replace(",", ".")) : null,
            minMensualDia: est.mensuales && est.mensuales[`${variable}minimadia`] ? est.mensuales[`${variable}minimadia`] : null,
            maxAnual: est.anuales && est.anuales[`${variable}maxima`] ? parseFloat(est.anuales[`${variable}maxima`].replace(",", ".")) : null,
            maxAnualDia: est.anuales && est.anuales[`${variable}maximadia`] ? est.anuales[`${variable}maximadia`] : null,
            minAnual: est.anuales && est.anuales[`${variable}minima`] ? parseFloat(est.anuales[`${variable}minima`].replace(",", ".")) : null,
            minAnualDia: est.anuales && est.anuales[`${variable}minimadia`] ? est.anuales[`${variable}minimadia`] : null,
        }));
    }

    // Extraer evolución temporal simulada (usando extremos diarios si no hay histórico real)
    function getEvolucionTemporal(variable: string) {
        if (!data) return [];
        // Si hay histórico real, aquí se usaría
        // Simulamos con los extremos diarios de cada estación
        let estaciones: EstacionData[] = data.datos;
        if (currentStationId !== "todas") {
            estaciones = estaciones.filter((e: EstacionData, idx: number) => idx.toString() === currentStationId || e.estacion === currentStationId);
        }
        // Tomamos los extremos diarios de la primera estación seleccionada
        const est = estaciones[0];
        if (!est || !est.diarios) return [];
        // Ejemplo: para temperatura, usar max/min diarios
        return [
            { label: 'Mínima diaria', value: est.diarios[`${variable}minima`] ? parseFloat(est.diarios[`${variable}minima`].replace(",", ".")) : null, hora: est.diarios[`${variable}minimahora`] },
            { label: 'Máxima diaria', value: est.diarios[`${variable}maxima`] ? parseFloat(est.diarios[`${variable}maxima`].replace(",", ".")) : null, hora: est.diarios[`${variable}maximahora`] },
        ];
    }

    // --- NUEVAS FUNCIONES AUXILIARES PARA GRÁFICOS AVANZADOS ---
    // Rosa de vientos simulada (dirección más frecuente)
    function getWindRoseData() {
        if (!data || isGlobal) return [];
        let estaciones: EstacionData[] = data.datos;
        estaciones = estaciones.filter((e: EstacionData, idx: number) => idx.toString() === currentStationId || e.estacion === currentStationId);
        const est = estaciones[0];
        if (!est || !est.actuales.direccionviento) return [];
        // Simulación: solo la dirección actual o más frecuente
        const dir = est.actuales.direccionviento;
        return [
            { direction: dir, value: 1 },
            // El resto a 0 para simular
            { direction: 'N', value: dir === 'N' ? 1 : 0 },
            { direction: 'NE', value: dir === 'NE' ? 1 : 0 },
            { direction: 'E', value: dir === 'E' ? 1 : 0 },
            { direction: 'SE', value: dir === 'SE' ? 1 : 0 },
            { direction: 'S', value: dir === 'S' ? 1 : 0 },
            { direction: 'SO', value: dir === 'SO' ? 1 : 0 },
            { direction: 'O', value: dir === 'O' ? 1 : 0 },
            { direction: 'NO', value: dir === 'NO' ? 1 : 0 },
        ];
    }
    // Evolución de presión diaria (estación concreta, usando extremos diarios)
    function getEvolucionPresionDiaria() {
        if (!data || isGlobal) return [];
        let estaciones: EstacionData[] = data.datos;
        estaciones = estaciones.filter((e: EstacionData, idx: number) => idx.toString() === currentStationId || e.estacion === currentStationId);
        const est = estaciones[0];
        if (!est || !est.diarios) return [];
        return [
            { label: 'Mínima diaria', value: est.diarios.presionminima ? parseFloat(est.diarios.presionminima.replace(",", ".")) : null, hora: est.diarios.presionminimahora },
            { label: 'Máxima diaria', value: est.diarios.presionmaxima ? parseFloat(est.diarios.presionmaxima.replace(",", ".")) : null, hora: est.diarios.presionmaximahora },
        ];
    }
    // --- FIN NUEVAS FUNCIONES ---

    if (loading) return <div className="p-8 text-center">Cargando datos...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!data) return <div className="p-8 text-center">No hay datos disponibles.</div>;

    const isGlobal = currentStationId === "todas";
    const selectedStation = !isGlobal ? data.datos[parseInt(currentStationId)] : null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Datos Ambientales</h2>
                <div className="flex gap-4 items-center">
                    <Select value={currentStationId} onValueChange={handleStationChange}>
                        <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder="Estación"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="todas">Todas las estaciones</SelectItem>
                                {data.datos.map((station: EstacionData, idx: number) => (
                                    <SelectItem key={station.estacion} value={idx.toString()}>
                                        {station.estacion}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        Última actualización: {data.metadata?.fecha_generacion || new Date().toLocaleString('es-ES')}
                    </span>
                </div>
            </div>

            {/* --- CARDS RESUMEN --- */}
            <div className="grid grid-cols-4 gap-4">
                {environmentalParameters.map(param => {
                    if(param.id === 'direccionviento') {
                        // Card especial para dirección del viento
                        return (
                            <Card key={param.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex justify-between items-center">
                                        <span>{param.name}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">
                                        {getMostFrequentDirection()} {param.unit}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        &nbsp;
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    } else {
                        const paramData = getAggregates(param.id);
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
                    }
                })}
            </div>

            {/* --- GRÁFICO DE EXTREMOS MENSUALES/ANUALES (GLOBAL, UNIFICADO) --- */}
            {isGlobal && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Comparativa de extremos mensuales/anuales</CardTitle>
                            <UiSelect value={extremosVar} onValueChange={setExtremosVar}>
                                <UiSelectTrigger className="w-[220px] ml-4">
                                    <UiSelectValue placeholder="Variable" />
                                </UiSelectTrigger>
                                <UiSelectContent>
                                    {extremosVariables.map(v => (
                                        <UiSelectItem key={v.id} value={v.id}>{v.label}</UiSelectItem>
                                    ))}
                                </UiSelectContent>
                            </UiSelect>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={getExtremosMensualesAnuales(extremosVar)}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name, props) => [`${value} ${extremosVarObj.unit}`, name]} />
                                    <Legend />
                                    <Bar dataKey="maxMensual" name="Máx. mensual" fill={extremosVarObj.color1} />
                                    <Bar dataKey="maxAnual" name="Máx. anual" fill={extremosVarObj.color2} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            * Pasa el ratón por las barras para ver la fecha del extremo
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- GRÁFICOS DE EVOLUCIÓN MENSUAL EN ESTACIÓN CONCRETA (UNIFICADO) --- */}
            {!isGlobal && selectedStation && selectedStation.mensuales && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Evolución mensual de extremos</CardTitle>
                            <UiSelect value={evolucionMensualVar} onValueChange={setEvolucionMensualVar}>
                                <UiSelectTrigger className="w-[220px] ml-4">
                                    <UiSelectValue placeholder="Variable" />
                                </UiSelectTrigger>
                                <UiSelectContent>
                                    {evolucionMensualVariables.map(v => (
                                        <UiSelectItem key={v.id} value={v.id}>{v.label}</UiSelectItem>
                                    ))}
                                </UiSelectContent>
                            </UiSelect>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        {
                                            label: evolucionMensualVarObj.labelDia && selectedStation.mensuales[evolucionMensualVarObj.labelDia] ? selectedStation.mensuales[evolucionMensualVarObj.labelDia] : 'Este mes',
                                            value: selectedStation.mensuales[evolucionMensualVarObj.id] ? parseFloat(selectedStation.mensuales[evolucionMensualVarObj.id].replace(",", ".")) : null
                                        }
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name, props) => [`${value} ${evolucionMensualVarObj.unit}`, name]} />
                                    <Legend />
                                    <Bar dataKey="value" name={evolucionMensualVarObj.label} fill={evolucionMensualVarObj.color} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- GRÁFICO DE EXTREMOS ANUALES EN ESTACIÓN CONCRETA (UNIFICADO) --- */}
            {!isGlobal && selectedStation && selectedStation.anuales && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Extremos anuales</CardTitle>
                            <UiSelect value={extremosAnualesVar} onValueChange={setExtremosAnualesVar}>
                                <UiSelectTrigger className="w-[220px] ml-4">
                                    <UiSelectValue placeholder="Variable" />
                                </UiSelectTrigger>
                                <UiSelectContent>
                                    {extremosAnualesVariables.map(v => (
                                        <UiSelectItem key={v.id} value={v.id}>{v.label}</UiSelectItem>
                                    ))}
                                </UiSelectContent>
                            </UiSelect>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        extremosAnualesVarObj.max && {
                                            tipo: 'Máxima',
                                            label: extremosAnualesVarObj.maxDia && selectedStation.anuales[extremosAnualesVarObj.maxDia] ? selectedStation.anuales[extremosAnualesVarObj.maxDia] : '-',
                                            value: selectedStation.anuales[extremosAnualesVarObj.max] ? parseFloat(selectedStation.anuales[extremosAnualesVarObj.max].replace(",", ".")) : null
                                        },
                                        extremosAnualesVarObj.min && {
                                            tipo: 'Mínima',
                                            label: extremosAnualesVarObj.minDia && selectedStation.anuales[extremosAnualesVarObj.minDia] ? selectedStation.anuales[extremosAnualesVarObj.minDia] : '-',
                                            value: selectedStation.anuales[extremosAnualesVarObj.min] ? parseFloat(selectedStation.anuales[extremosAnualesVarObj.min].replace(",", ".")) : null
                                        }
                                    ].filter(Boolean)}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tipo" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name, props) => [`${value} ${extremosAnualesVarObj.unit}`, name]} labelFormatter={(label, payload) => {
                                        if (!payload || !payload[0]) return label;
                                        return `${label} (${payload[0].payload.label || '-'})`;
                                    }} />
                                    <Legend />
                                    <Bar dataKey="value" name={extremosAnualesVarObj.label} fill={extremosAnualesVarObj.color} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- COMPARATIVA ENTRE ESTACIONES (GLOBAL, UNIFICADO) --- */}
            {isGlobal && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Comparativa entre Estaciones</CardTitle>
                            <UiSelect value={comparativaVar} onValueChange={setComparativaVar}>
                                <UiSelectTrigger className="w-[220px] ml-4">
                                    <UiSelectValue placeholder="Variable" />
                                </UiSelectTrigger>
                                <UiSelectContent>
                                    {comparativaVariables.map(v => (
                                        <UiSelectItem key={v.id} value={v.id}>{v.label}</UiSelectItem>
                                    ))}
                                </UiSelectContent>
                            </UiSelect>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={getStationComparison()}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name, props) => [`${value} ${comparativaVarObj.unit}`, name]} />
                                    <Legend />
                                    <Bar dataKey={comparativaVar} name={comparativaVarObj.label} fill={comparativaVarObj.color} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
            {/* --- GRÁFICO DE EVOLUCIÓN ANUAL EN ESTACIÓN CONCRETA --- */}
            {!isGlobal && selectedStation && selectedStation.anuales && (
                <div className="grid grid-cols-2 gap-6 mt-6">
                    {/* Temperatura máxima y mínima anual */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Extremos anuales de temperatura</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { label: selectedStation.anuales.temperaturamaximadia || '-', value: selectedStation.anuales.temperaturamaxima ? parseFloat(selectedStation.anuales.temperaturamaxima.replace(",", ".")) : null, tipo: 'Máxima' },
                                            { label: selectedStation.anuales.temperaturaminimadia || '-', value: selectedStation.anuales.temperaturaminima ? parseFloat(selectedStation.anuales.temperaturaminima.replace(",", ".")) : null, tipo: 'Mínima' }
                                        ]}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="tipo" />
                                        <YAxis />
                                        <Tooltip formatter={(value, name, props) => [`${value}°C`, name]} labelFormatter={(label, payload) => {
                                            if (!payload || !payload[0]) return label;
                                            return `${label} (${payload[0].payload.label || '-'})`;
                                        }} />
                                        <Legend />
                                        <Bar dataKey="value" name="Temperatura" fill="#E74C3C" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Racha máxima anual de viento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Racha máxima anual de viento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-3xl font-bold">
                                    {selectedStation.anuales.rachaviento ? parseFloat(selectedStation.anuales.rachaviento.replace(",", ".")).toFixed(1) : '-'} km/h
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Día: {selectedStation.anuales.rachavientodia || '-'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* --- CARDS DE PRECIPITACIÓN Y ASTRONOMÍA EN ESTACIÓN CONCRETA --- */}
            {!isGlobal && selectedStation && (
                <div className="grid grid-cols-2 gap-6 mt-6">
                    {/* Lluvia total anual y día de máxima precipitación */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Lluvia total anual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-3xl font-bold">
                                    {selectedStation.anuales && selectedStation.anuales.lluvia ? parseFloat(selectedStation.anuales.lluvia.replace(",", ".")).toFixed(1) : '-'} mm
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Día de máxima intensidad: {selectedStation.anuales && selectedStation.anuales.intensidadlluviadia ? selectedStation.anuales.intensidadlluviadia : '-'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Astronomía */}
                    {selectedStation.astronomia && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Astronomía</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="font-medium">Salida sol:</span> {selectedStation.astronomia.salidasol || '-'}</div>
                                    <div><span className="font-medium">Puesta sol:</span> {selectedStation.astronomia.puestasol || '-'}</div>
                                    <div><span className="font-medium">Salida luna:</span> {selectedStation.astronomia.salidaluna || '-'}</div>
                                    <div><span className="font-medium">Puesta luna:</span> {selectedStation.astronomia.puestaluna || '-'}</div>
                                    <div><span className="font-medium">Fase lunar:</span> {selectedStation.astronomia.faselunar || '-'}</div>
                                    <div><span className="font-medium">Porcentaje luna:</span> {selectedStation.astronomia.porcentajeluna || '-'}</div>
                                    <div><span className="font-medium">Duración día:</span> {selectedStation.astronomia.duraciondia || '-'}</div>
                                    <div><span className="font-medium">Edad lunar:</span> {selectedStation.astronomia.edadlunar || '-'}</div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
            {/* --- ROSA DE VIENTOS SIMULADA (ESTACIÓN CONCRETA) --- */}
            {!isGlobal && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Rosa de vientos (simulada)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={getWindRoseData()} outerRadius={80}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="direction" />
                                    <PolarRadiusAxis angle={30} domain={[0, 1]} />
                                    <Radar name="Frecuencia" dataKey="value" stroke="#2980B9" fill="#2980B9" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">* Basado en la dirección actual o más frecuente</div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DataDashboard;