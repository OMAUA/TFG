import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { PieChart, Pie, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Select as UiSelect, SelectTrigger as UiSelectTrigger, SelectValue as UiSelectValue, SelectContent as UiSelectContent, SelectItem as UiSelectItem } from "@/components/ui/select";
import { LegendProps } from 'recharts';

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
        { id: 'temperatura', label: 'Temperatura', unit: '°C', color1: '#E74C3C', color2: '#8E44AD', color3: '#F7B731' },
        { id: 'humedad', label: 'Humedad', unit: '%', color1: '#3498DB', color2: '#1F618D', color3: '#A3CBF5' },
        { id: 'presion', label: 'Presión', unit: 'hPa', color1: '#7D3C98', color2: '#1ABC9C', color3: '#F5CD79' },
        { id: 'puntoderocio', label: 'Punto de rocío', unit: '°C', color1: '#8E44AD', color2: '#E17055', color3: '#00B894' },
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
        { id: 'puntoderocio', label: 'Punto de rocío', unit: '°C', color: '#8E44AD' },
        { id: 'velocidadviento', label: 'Velocidad del viento', unit: 'km/h', color: '#1ABC9C' },
        { id: 'lluvia', label: 'Lluvia', unit: 'mm', color: '#2874A6' },
        { id: 'intensidadlluvia', label: 'Intensidad de lluvia', unit: 'mm/h', color: '#2ECC71' },
    ];
    const [comparativaVar, setComparativaVar] = useState('temperatura');
    const comparativaVarObj = comparativaVariables.find(v => v.id === comparativaVar) || comparativaVariables[0];

    // Usar dos estados distintos para los selects de mínimos y máximos
    const [extremosVarMin, setExtremosVarMin] = useState('temperatura');
    const [extremosVarMax, setExtremosVarMax] = useState('temperatura');
    const extremosVarMinObj = extremosVariables.find(v => v.id === extremosVarMin) || extremosVariables[0];
    const extremosVarMaxObj = extremosVariables.find(v => v.id === extremosVarMax) || extremosVariables[0];

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
            puntoderocio: parseFloat(est.actuales.puntoderocio?.replace(",", ".")),
            velocidadviento: parseFloat(est.actuales.velocidadviento?.replace(",", ".")),
            lluvia: parseFloat(est.actuales.lluvia?.replace(",", ".")),
            intensidadlluvia: parseFloat(est.actuales.intensidadlluvia?.replace(",", ".")),
        }));
    }

    const getTrendIcon = (trend: number) => {
        if(trend > 0.1) return <ArrowUp className="text-eco-green h-4 w-4"/>;
        if(trend < -0.1) return <ArrowDown className="text-eco-red h-4 w-4"/>;
        return <Minus className="text-muted-foreground h-4 w-4"/>;
    };

    // Extraer datos de extremos mensuales/anuales para todas las estaciones
    function getExtremosMaximosMensualesAnuales(variable: string) {
        if (!data) return [];
        const map = {
            temperatura: { max: 'temperaturamaxima' },
            humedad: { max: 'humedadmaxima' },
            presion: { max: 'presionmaxima' },
            puntoderocio: { max: 'puntoderociomaximo' },
            velocidadviento: { max: 'rachaviento' },
            lluvia: { max: 'lluvia' },
            intensidadlluvia: { max: 'intensidadlluvia' },
        };
        const campos = map[variable] || { max: variable + 'maxima' };
        return data.datos.map(est => ({
            name: est.estacion,
            maxMensual: est.mensuales && campos.max && est.mensuales[campos.max] ? parseFloat(est.mensuales[campos.max].replace(",", ".")) : null,
            maxAnual: est.anuales && campos.max && est.anuales[campos.max] ? parseFloat(est.anuales[campos.max].replace(",", ".")) : null,
        }));
    }

    function getExtremosMinimosMensualesAnuales(variable: string) {
        if (!data) return [];
        const map = {
            temperatura: { min: 'temperaturaminima' },
            humedad: { min: 'humedadminima' },
            presion: { min: 'presionminima' },
            puntoderocio: { min: 'puntoderociominimo' },
        };
        const campos = map[variable] || { min: variable + 'minima' };
        return data.datos.map(est => ({
            name: est.estacion,
            minMensual: est.mensuales && campos.min && est.mensuales[campos.min] ? parseFloat(est.mensuales[campos.min].replace(",", ".")) : null,
            minAnual: est.anuales && campos.min && est.anuales[campos.min] ? parseFloat(est.anuales[campos.min].replace(",", ".")) : null,
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

    // 2. Funciones para obtener máximos y mínimos diarios/mensuales/anuales
    function getExtremosMaximosDiariosMensualesAnuales(variable) {
        if (!data) return [];
        const map = {
            temperatura: { max: 'temperaturamaxima' },
            humedad: { max: 'humedadmaxima' },
            presion: { max: 'presionmaxima' },
            puntoderocio: { max: 'puntoderociomaximo' },
        };
        const campos = map[variable] || { max: variable + 'maxima' };
        return data.datos.map(est => ({
            name: est.estacion,
            maxDiario: est.diarios && campos.max && est.diarios[campos.max] ? parseFloat(est.diarios[campos.max].replace(",", ".")) : null,
            maxMensual: est.mensuales && campos.max && est.mensuales[campos.max] ? parseFloat(est.mensuales[campos.max].replace(",", ".")) : null,
            maxAnual: est.anuales && campos.max && est.anuales[campos.max] ? parseFloat(est.anuales[campos.max].replace(",", ".")) : null,
        }));
    }
    function getExtremosMinimosDiariosMensualesAnuales(variable) {
        if (!data) return [];
        const map = {
            temperatura: { min: 'temperaturaminima' },
            humedad: { min: 'humedadminima' },
            presion: { min: 'presionminima' },
            puntoderocio: { min: 'puntoderociominimo' },
        };
        const campos = map[variable] || { min: variable + 'minima' };
        return data.datos.map(est => ({
            name: est.estacion,
            minDiario: est.diarios && campos.min && est.diarios[campos.min] ? parseFloat(est.diarios[campos.min].replace(",", ".")) : null,
            minMensual: est.mensuales && campos.min && est.mensuales[campos.min] ? parseFloat(est.mensuales[campos.min].replace(",", ".")) : null,
            minAnual: est.anuales && campos.min && est.anuales[campos.min] ? parseFloat(est.anuales[campos.min].replace(",", ".")) : null,
        }));
    }

    // Función para obtener racha máxima anual de viento por estación
    function getRachaMaximaAnual() {
        if (!data) return [];
        return data.datos.map(est => ({
            name: est.estacion,
            racha: est.anuales && est.anuales.rachaviento ? parseFloat(est.anuales.rachaviento.replace(",", ".")) : null,
        }));
    }
    // Función para obtener acumulado de lluvia anual por estación
    function getLluviaAcumuladaAnual() {
        if (!data) return [];
        return data.datos.map(est => ({
            name: est.estacion,
            lluvia: est.anuales && est.anuales.lluvia ? parseFloat(est.anuales.lluvia.replace(",", ".")) : null,
        }));
    }

    // 1. Datos para gráfico circular de dirección del viento
    const ALL_DIRECTIONS = [
        'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    function getWindDirectionPieData() {
        if (!data) return [];
        const freq = {};
        data.datos.forEach(est => {
            let dir = est.actuales.direccionviento || 'Sin dato';
            dir = dir.trim(); // Eliminar espacios en blanco
            freq[dir] = (freq[dir] || 0) + 1;
        });
        // Asegurar que todas las direcciones posibles están presentes
        ALL_DIRECTIONS.forEach(dir => {
            if (!(dir in freq)) freq[dir] = 0;
        });
        // También mostrar "Sin dato" si hay alguna estación sin dirección
        if (Object.keys(freq).some(d => d === 'Sin dato')) {
            // ya está incluido
        }
        // Filtrar solo las direcciones con valor > 0
        return Object.entries(freq)
            .filter(([_, value]) => Number(value) > 0)
            .map(([direction, value]) => ({ direction, value: Number(value) }));
    }

    // Añadir funciones auxiliares para formatear hora y día
    function formatHora(hora: string | undefined): string {
        if (!hora) return '-';
        // Si es tipo HH:MM:SS o HH:MM, devolver HH:MM
        const match = hora.match(/(\d{1,2}):(\d{2})/);
        if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
        // Si es tipo DD/MM/AAAA HH:MM o DD-MM-AAAA HH:MM o similar
        const match2 = hora.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})[ T]?(\d{1,2}):(\d{2})/);
        if (match2) return `${match2[4].padStart(2, '0')}:${match2[5]}`;
        return hora;
    }

    function formatDia(dia: string | undefined): string {
        if (!dia) return '-';
        // Si es tipo DD mes
        if (/^\d{1,2} [a-zA-Záéíóúñ]+$/.test(dia)) return dia;
        // Si es tipo DD/MM/AA HH:MM:SS o DD/MM/AAAA HH:MM:SS
        const match = dia.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
        if (match) {
            const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
            const mesNum = parseInt(match[2], 10);
            return `${match[1]} ${meses[mesNum-1]}`;
        }
        // Si es tipo DD mes
        const match2 = dia.match(/(\d{1,2}) ([a-zA-Záéíóúñ]+)/);
        if (match2) return dia;
        return dia;
    }

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
                        // Si es una estación concreta, mostrar min/max diarios solo para los parámetros permitidos
                        const showMinMax = !isGlobal && ['temperatura', 'humedad', 'presion', 'puntoderocio'].includes(param.id);
                        let min = null, max = null;
                        if (showMinMax && selectedStation && selectedStation.diarios) {
                            switch(param.id) {
                                case 'temperatura':
                                    min = selectedStation.diarios.temperaturaminima;
                                    max = selectedStation.diarios.temperaturamaxima;
                                    break;
                                case 'humedad':
                                    min = selectedStation.diarios.humedadminima;
                                    max = selectedStation.diarios.humedadmaxima;
                                    break;
                                case 'presion':
                                    min = selectedStation.diarios.presionminima;
                                    max = selectedStation.diarios.presionmaxima;
                                    break;
                                case 'puntoderocio':
                                    min = selectedStation.diarios.puntoderociominimo;
                                    max = selectedStation.diarios.puntoderociomaximo;
                                    break;
                                default:
                                    break;
                            }
                        }
                        return (
                            <Card key={param.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex justify-between items-center">
                                        <span>{param.name}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">
                                        {param.id === 'presion'
                                            ? paramData.avg.toFixed(2)
                                            : param.id === 'humedad'
                                                ? Math.round(paramData.avg)
                                                : paramData.avg.toFixed(1)
                                        } {param.unit}
                                    </div>
                                    {isGlobal ? (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Min: {param.id === 'presion' ? paramData.min.toFixed(2) : param.id === 'humedad' ? Math.round(paramData.min) : paramData.min.toFixed(1)} {param.unit} | Max: {param.id === 'presion' ? paramData.max.toFixed(2) : param.id === 'humedad' ? Math.round(paramData.max) : paramData.max.toFixed(1)} {param.unit}
                                        </div>
                                    ) : (
                                        showMinMax && min !== null && max !== null ? (
                                    <div className="text-xs text-muted-foreground mt-1">
                                                Min: {param.id === 'presion' ? parseFloat(min).toFixed(2) : param.id === 'humedad' ? Math.round(parseFloat(min)) : parseFloat(min).toFixed(1)} {param.unit} | Max: {param.id === 'presion' ? parseFloat(max).toFixed(2) : param.id === 'humedad' ? Math.round(parseFloat(max)) : parseFloat(max).toFixed(1)} {param.unit}
                                    </div>
                                        ) : null
                                    )}
                                </CardContent>
                            </Card>
                        );
                    }
                })}
            </div>

            {/* --- GRÁFICO DE EXTREMOS MENSUALES/ANUALES (GLOBAL, UNIFICADO) --- */}
            {isGlobal && (
                <div className="grid grid-cols-2 gap-6">
                    {/* Comparativa entre estaciones y Distribución de direcciones del viento */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                                <CardTitle className="text-base">Comparativa entre estaciones (valores actuales)</CardTitle>
                                <UiSelect value={comparativaVar} onValueChange={setComparativaVar}>
                                    <UiSelectTrigger className="w-[180px] ml-4">
                                        <UiSelectValue placeholder="Variable"/>
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
                                <ResponsiveContainer width="100%" height="130%">
                                <BarChart
                                        data={getStationComparison()}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={false} axisLine={false} />
                                    <YAxis />
                                        <Tooltip formatter={(value, name, props) => [`${value} ${comparativaVarObj.unit}`, name]} />
                                    <Legend />
                                        <Bar dataKey={comparativaVar} name={comparativaVarObj.label} fill={comparativaVarObj.color} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                            <CardTitle className="text-base">Distribución de direcciones del viento</CardTitle>
                    </CardHeader>
                    <CardContent>
                            <div className="h-[350px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={getWindDirectionPieData()}
                                            dataKey="value"
                                            nameKey="direction"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={120}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {getWindDirectionPieData().map((entry, idx) => (
                                                <Cell key={`cell-${idx}`} fill={['#2980B9', '#E67E22', '#27AE60', '#8E44AD', '#F1C40F', '#E74C3C', '#1ABC9C', '#34495E', '#95A5A6', '#D35400', '#00B894', '#6C3483', '#F7B731', '#A3CBF5', '#F5CD79', '#E17055', '#00B894'][idx % 17]} />
                                            ))}
                                        </Pie>
                                    <Legend />
                                    </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                </div>
            )}

            {isGlobal && (
                <div className="grid grid-cols-2 gap-6 mt-8">
                    {/* Comparativa de mínimos y máximos diarios/mensuales/anuales */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                                <CardTitle className="text-base">Comparativa de mínimos diarios/mensuales/anuales</CardTitle>
                                <UiSelect value={extremosVarMin} onValueChange={setExtremosVarMin}>
                                    <UiSelectTrigger className="w-[180px] ml-4">
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
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="115%">
                                <BarChart
                                        data={getExtremosMinimosDiariosMensualesAnuales(extremosVarMin)}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={false} axisLine={false} />
                                    <YAxis />
                                        <Tooltip formatter={(value, name, props) => [`${value} ${extremosVarMinObj.unit}`, name]} />
                                    <Legend />
                                        <Bar dataKey="minDiario" name="Mín. diario" fill={extremosVarMinObj.color3} />
                                        <Bar dataKey="minMensual" name="Mín. mensual" fill={extremosVarMinObj.color1} />
                                        <Bar dataKey="minAnual" name="Mín. anual" fill={extremosVarMinObj.color2} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                                <CardTitle className="text-base">Comparativa de máximos diarios/mensuales/anuales</CardTitle>
                                <UiSelect value={extremosVarMax} onValueChange={setExtremosVarMax}>
                                    <UiSelectTrigger className="w-[180px] ml-4">
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
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="115%">
                                <BarChart
                                        data={getExtremosMaximosDiariosMensualesAnuales(extremosVarMax)}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={false} axisLine={false} />
                                    <YAxis />
                                        <Tooltip formatter={(value, name, props) => [`${value} ${extremosVarMaxObj.unit}`, name]} />
                                    <Legend />
                                        <Bar dataKey="maxDiario" name="Máx. diario" fill={extremosVarMaxObj.color3} />
                                        <Bar dataKey="maxMensual" name="Máx. mensual" fill={extremosVarMaxObj.color1} />
                                        <Bar dataKey="maxAnual" name="Máx. anual" fill={extremosVarMaxObj.color2} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                </div>
            )}

            {isGlobal && (
                <div className="grid grid-cols-2 gap-6 mt-8">
                    {/* Comparativa de rachas de viento máximas anuales y acumulado de lluvia anual */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Comparativa de rachas de viento máximas anuales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="118%">
                                    <BarChart
                                        data={getRachaMaximaAnual()}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={false} axisLine={false} />
                                        <YAxis />
                                        <Tooltip formatter={(value, name, props) => [`${value} km/h`, name]} />
                                        <Legend />
                                        <Bar dataKey="racha" name="Racha máxima anual" fill="#F1C40F" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Comparativa de lluvia acumulada anual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="118%">
                                    <BarChart
                                        data={getLluviaAcumuladaAnual()}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={false} axisLine={false} />
                                        <YAxis />
                                        <Tooltip formatter={(value, name, props) => [`${value} mm`, name]} />
                                        <Legend />
                                        <Bar dataKey="lluvia" name="Lluvia acumulada anual" fill="#2874A6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* --- CARDS DE PRECIPITACIÓN Y ASTRONOMÍA EN ESTACIÓN CONCRETA --- */}
            {!isGlobal && selectedStation && (
                <>
                {/* Fila de 2 tarjetas: Lluvia última hora y Lluvia total anual */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                    {/* Lluvia última hora */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Lluvia última hora</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-3xl font-bold">
                                    {selectedStation.actuales?.lluviaultimahora ? parseFloat(selectedStation.actuales.lluviaultimahora.replace(',', '.')).toFixed(1) : '-'} mm
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Lluvia total anual */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Lluvia total anual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-3xl font-bold">
                                    {selectedStation.anuales && selectedStation.anuales.lluvia ? parseFloat(selectedStation.anuales.lluvia.replace(',', '.')).toFixed(1) : '-'} mm
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Día de máxima intensidad: {selectedStation.anuales && selectedStation.anuales.intensidadlluviadia ? formatDia(selectedStation.anuales.intensidadlluviadia) : '-'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Tablas de extremos diarios, mensuales y anuales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {/* Diarios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Extremos diarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="min-w-full text-xs border-separate border-spacing-y-1">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left font-medium">Parámetro</th>
                            <th className="text-left font-medium">Mín.</th>
                            <th className="text-left font-medium">Hora mín.</th>
                            <th className="text-left font-medium">Máx.</th>
                            <th className="text-left font-medium">Hora máx.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Temperatura (°C)</td>
                            <td>{selectedStation.diarios?.temperaturaminima ? parseFloat(selectedStation.diarios.temperaturaminima.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatHora(selectedStation.diarios?.temperaturaminimahora)}</td>
                            <td>{selectedStation.diarios?.temperaturamaxima ? parseFloat(selectedStation.diarios.temperaturamaxima.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatHora(selectedStation.diarios?.temperaturamaximahora)}</td>
                          </tr>
                          <tr>
                            <td>Humedad (%)</td>
                            <td>{selectedStation.diarios?.humedadminima ? Math.round(parseFloat(selectedStation.diarios.humedadminima.replace(',', '.'))) : '-'}</td>
                            <td>{formatHora(selectedStation.diarios?.humedadminimahora)}</td>
                            <td>{selectedStation.diarios?.humedadmaxima ? Math.round(parseFloat(selectedStation.diarios.humedadmaxima.replace(',', '.'))) : '-'}</td>
                            <td>{formatHora(selectedStation.diarios?.humedadmaximahora)}</td>
                          </tr>
                          <tr>
                            <td>Racha viento (km/h)</td>
                            <td>-</td>
                            <td>-</td>
                            <td>{selectedStation.diarios?.rachaviento ? parseFloat(selectedStation.diarios.rachaviento.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatHora(selectedStation.diarios?.rachavientohora)}</td>
                          </tr>
                          <tr>
                            <td>Intensidad lluvia (mm/h)</td>
                            <td>-</td>
                            <td>-</td>
                            <td>{selectedStation.diarios?.intensidadlluvia ? parseFloat(selectedStation.diarios.intensidadlluvia.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatHora(selectedStation.diarios?.intensidadlluviahora)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                  {/* Mensuales */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Extremos mensuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="min-w-full text-xs border-separate border-spacing-y-1">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left font-medium">Parámetro</th>
                            <th className="text-left font-medium">Mín.</th>
                            <th className="text-left font-medium">Día mín.</th>
                            <th className="text-left font-medium">Máx.</th>
                            <th className="text-left font-medium">Día máx.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Temperatura (°C)</td>
                            <td>{selectedStation.mensuales?.temperaturaminima ? parseFloat(selectedStation.mensuales.temperaturaminima.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatDia(selectedStation.mensuales?.temperaturaminimadia)}</td>
                            <td>{selectedStation.mensuales?.temperaturamaxima ? parseFloat(selectedStation.mensuales.temperaturamaxima.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatDia(selectedStation.mensuales?.temperaturamaximadia)}</td>
                          </tr>
                          <tr>
                            <td>Humedad (%)</td>
                            <td>{selectedStation.mensuales?.humedadminima ? Math.round(parseFloat(selectedStation.mensuales.humedadminima.replace(',', '.'))) : '-'}</td>
                            <td>{formatDia(selectedStation.mensuales?.humedadminimadia)}</td>
                            <td>{selectedStation.mensuales?.humedadmaxima ? Math.round(parseFloat(selectedStation.mensuales.humedadmaxima.replace(',', '.'))) : '-'}</td>
                            <td>{formatDia(selectedStation.mensuales?.humedadmaximadia)}</td>
                          </tr>
                          <tr>
                            <td>Racha viento (km/h)</td>
                            <td>-</td>
                            <td>-</td>
                            <td>{selectedStation.mensuales?.rachaviento ? parseFloat(selectedStation.mensuales.rachaviento.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatDia(selectedStation.mensuales?.rachavientodia)}</td>
                          </tr>
                          <tr>
                            <td>Intensidad lluvia (mm/h)</td>
                            <td>-</td>
                            <td>-</td>
                            <td>{selectedStation.mensuales?.intensidadlluvia ? parseFloat(selectedStation.mensuales.intensidadlluvia.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatDia(selectedStation.mensuales?.intensidadlluviadia)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                  {/* Anuales */}
                <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Extremos anuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="min-w-full text-xs border-separate border-spacing-y-1">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left font-medium">Parámetro</th>
                            <th className="text-left font-medium">Mín.</th>
                            <th className="text-left font-medium">Día mín.</th>
                            <th className="text-left font-medium">Máx.</th>
                            <th className="text-left font-medium">Día máx.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Temperatura (°C)</td>
                            <td>{selectedStation.anuales?.temperaturaminima ? parseFloat(selectedStation.anuales.temperaturaminima.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatDia(selectedStation.anuales?.temperaturaminimadia)}</td>
                            <td>{selectedStation.anuales?.temperaturamaxima ? parseFloat(selectedStation.anuales.temperaturamaxima.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatDia(selectedStation.anuales?.temperaturamaximadia)}</td>
                          </tr>
                          <tr>
                            <td>Humedad (%)</td>
                            <td>{selectedStation.anuales?.humedadminima ? Math.round(parseFloat(selectedStation.anuales.humedadminima.replace(',', '.'))) : '-'}</td>
                            <td>{formatDia(selectedStation.anuales?.humedadminimadia)}</td>
                            <td>{selectedStation.anuales?.humedadmaxima ? Math.round(parseFloat(selectedStation.anuales.humedadmaxima.replace(',', '.'))) : '-'}</td>
                            <td>{formatDia(selectedStation.anuales?.humedadmaximadia)}</td>
                          </tr>
                          <tr>
                            <td>Racha viento (km/h)</td>
                            <td>-</td>
                            <td>-</td>
                            <td>{selectedStation.anuales?.rachaviento ? parseFloat(selectedStation.anuales.rachaviento.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatDia(selectedStation.anuales?.rachavientodia)}</td>
                          </tr>
                          <tr>
                            <td>Intensidad lluvia (mm/h)</td>
                            <td>-</td>
                            <td>-</td>
                            <td>{selectedStation.anuales?.intensidadlluvia ? parseFloat(selectedStation.anuales.intensidadlluvia.replace(',', '.')).toFixed(1) : '-'}</td>
                            <td>{formatDia(selectedStation.anuales?.intensidadlluviadia)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                </Card>
                </div>
                </>
            )}
        </div>
    );
};

export default DataDashboard;