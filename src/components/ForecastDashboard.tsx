import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

const VARIABLES = [
    { id: "temperatura", name: "Temperatura", unit: "°C", color: "#E74C3C", forecastDelta: 0.05 },
    { id: "humedad", name: "Humedad", unit: "%", color: "#3498DB", forecastDelta: -0.03 },
    { id: "presion", name: "Presión", unit: "hPa", color: "#7D3C98", forecastDelta: 0.005 },
    { id: "lluvia", name: "Lluvia", unit: "mm", color: "#2ECC71", forecastDelta: 0.10 },
];

// Definición de tipos para los datos
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

const ForecastDashboard = () => {
    const [metadata, setMetadata] = useState<{ fuente: string; fecha_generacion: string; numero_estaciones: number } | null>(null);
    const [data, setData] = useState<EstacionData[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeVariable, setActiveVariable] = useState(VARIABLES[0].id);

    useEffect(() => {
        setLoading(true);
        fetch("/datos_meteorologicos.json")
            .then(res => {
                if (!res.ok) throw new Error("No se pudo cargar el archivo de datos");
                return res.json();
            })
            .then(json => {
                setMetadata(json.metadata);
                setData(json.datos);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando datos...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!data) return <div className="p-8 text-center">No hay datos disponibles.</div>;

    // Cálculo de valores actuales y previstos
    const getActualValue = (variableId: string) => {
        if (variableId === "lluvia") {
            // Suma global de lluvia anual
            let sum = 0;
            data.forEach((est) => {
                const val = est.anuales && est.anuales.lluvia ? parseFloat(est.anuales.lluvia.replace(",", ".")) : 0;
                sum += isNaN(val) ? 0 : val;
            });
            return sum;
        } else {
            const values: number[] = [];
            data.forEach((est) => {
                const val = est.actuales && est.actuales[variableId] ? parseFloat(est.actuales[variableId].replace(",", ".")) : null;
                if (val !== null && !isNaN(val)) values.push(val);
            });
            if (values.length === 0) return 0;
            return values.reduce((a, b) => a + b, 0) / values.length;
        }
    };

    // Formateo de valores según variable
    const formatValue = (variableId: string, value: number) => {
        switch (variableId) {
            case "temperatura":
            case "lluvia":
                return value.toFixed(1);
            case "presion":
                return value.toFixed(2);
            case "humedad":
                return Math.round(value).toString();
            default:
                return value.toString();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Comparativa y tendencia de variables ambientales</h2>
                    <span className="text-sm text-muted-foreground">
                        Última actualización: {metadata?.fecha_generacion || new Date().toLocaleString('es-ES')}
                    </span>
                </div>
                <div className="text-sm text-muted-foreground">
                    Esta sección compara el valor actual con los valores extremos y medias del mes y del año, y muestra la tendencia reciente según los datos disponibles en el JSON.
                </div>
            </div>
            <Tabs value={activeVariable} onValueChange={setActiveVariable} className="space-y-4">
                <TabsList className="grid grid-cols-4">
                    {VARIABLES.map(v => (
                        <TabsTrigger key={v.id} value={v.id}>{v.name}</TabsTrigger>
                    ))}
                </TabsList>
                {VARIABLES.map(v => {
                    // Valor actual (media global)
                    let actual: number | null = null;
                    if (v.id === 'lluvia') {
                        // Media de los valores actuales de 'lluvia' en 'actuales'
                        const values: number[] = [];
                        data.forEach(est => {
                            const val = est.actuales && est.actuales.lluvia ? parseFloat(est.actuales.lluvia.replace(",", ".")) : null;
                            if (val !== null && !isNaN(val)) values.push(val);
                        });
                        actual = values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
                    } else {
                        actual = getActualValue(v.id);
                    }
                    // Medias mensual y anual (si existen)
                    const getMedia = (tipo: 'mensuales' | 'anuales') => {
                        if (v.id === 'temperatura' || v.id === 'humedad' || v.id === 'presion') {
                            const values: number[] = [];
                            const maxKey = v.id + 'maxima';
                            const minKey = v.id + 'minima';
                            data.forEach(est => {
                                const max = est[tipo] && est[tipo][maxKey] ? parseFloat(est[tipo][maxKey].replace(",", ".")) : null;
                                const min = est[tipo] && est[tipo][minKey] ? parseFloat(est[tipo][minKey].replace(",", ".")) : null;
                                if (max !== null && !isNaN(max) && min !== null && !isNaN(min)) {
                                    values.push((max + min) / 2);
                                }
                            });
                            if (values.length === 0) return null;
                            return values.reduce((a, b) => a + b, 0) / values.length;
                        } else if (v.id === 'lluvia') {
                            const values: number[] = [];
                            data.forEach(est => {
                                const val = est[tipo] && est[tipo].lluvia ? parseFloat(est[tipo].lluvia.replace(",", ".")) : null;
                                if (val !== null && !isNaN(val)) values.push(val);
                            });
                            if (values.length === 0) return null;
                            return values.reduce((a, b) => a + b, 0) / values.length;
                        }
                        return null;
                    };
                    const mediaMensual = getMedia('mensuales');
                    const mediaAnual = getMedia('anuales');
                    // Extremos mensual y anual (si existen)
                    const getExtremo = (tipo: 'mensuales' | 'anuales', minmax: 'minima' | 'maxima') => {
                        if (v.id === 'temperatura' || v.id === 'humedad' || v.id === 'presion') {
                            const values: number[] = [];
                            const key = v.id + minmax;
                            data.forEach(est => {
                                const val = est[tipo] && est[tipo][key] ? parseFloat(est[tipo][key].replace(",", ".")) : null;
                                if (val !== null && !isNaN(val)) values.push(val);
                            });
                            if (values.length === 0) return null;
                            return minmax === 'minima' ? Math.min(...values) : Math.max(...values);
                        } else if (v.id === 'lluvia') {
                            const values: number[] = [];
                            data.forEach(est => {
                                const val = est[tipo] && est[tipo].lluvia ? parseFloat(est[tipo].lluvia.replace(",", ".")) : null;
                                if (val !== null && !isNaN(val)) values.push(val);
                            });
                            if (values.length === 0) return null;
                            return minmax === 'minima' ? Math.min(...values) : Math.max(...values);
                        }
                        return null;
                    };
                    const minMensual = getExtremo('mensuales', 'minima');
                    const maxMensual = getExtremo('mensuales', 'maxima');
                    const minAnual = getExtremo('anuales', 'minima');
                    const maxAnual = getExtremo('anuales', 'maxima');
                    // Tendencia reciente (si hay datos diarios)
                    let tendencia = null;
                    if (v.id !== 'lluvia') {
                        // Para lluvia anual no tiene sentido tendencia diaria
                        const valoresDiarios: number[] = [];
                        data.forEach(est => {
                            const key = v.id + 'maxima';
                            if (est.diarios && est.diarios[key]) {
                                const val = parseFloat(est.diarios[key].replace(",", "."));
                                if (!isNaN(val)) valoresDiarios.push(val);
                            }
                        });
                        if (valoresDiarios.length > 0 && mediaMensual !== null) {
                            const mediaDiaria = valoresDiarios.reduce((a, b) => a + b, 0) / valoresDiarios.length;
                            tendencia = mediaDiaria > mediaMensual ? 'subida' : mediaDiaria < mediaMensual ? 'bajada' : 'estable';
                        }
                    }
                    // Gráfico de barras: actual, media mensual, media anual
                    const chartData = [
                        { name: "Media actual", value: Number(formatValue(v.id, actual)) },
                        mediaMensual !== null ? { name: "Media mensual", value: Number(formatValue(v.id, mediaMensual)) } : null,
                        mediaAnual !== null ? { name: "Media anual", value: Number(formatValue(v.id, mediaAnual)) } : null,
                    ].filter(Boolean);
                    // Análisis textual
                    let analisis = "";
                    if (v.id === 'lluvia') {
                        if ((mediaMensual === 0 || mediaMensual === null) && (mediaAnual === 0 || mediaAnual === null)) {
                            analisis = "Actualmente no se ha registrado lluvia y no hay datos suficientes para comparar con medias mensuales o anuales.";
                        } else if (actual === 0 && ((mediaMensual !== null && mediaMensual >= 0) || (mediaAnual !== null && mediaAnual > 0))) {
                            const partes: string[] = [];
                            if (mediaMensual !== null) {
                                partes.push(`la media mensual es de ${formatValue(v.id, mediaMensual)} ${v.unit}`);
                            }
                            if (mediaAnual !== null) {
                                partes.push(`la media anual es de ${formatValue(v.id, mediaAnual)} ${v.unit}`);
                            }
                            analisis = `Actualmente no se ha registrado lluvia, mientras que ${partes.join(' y ')}.`;
                        } else if (mediaMensual !== null && mediaMensual > 0 && mediaAnual !== null && mediaAnual > 0) {
                            const diffMensual = ((actual - mediaMensual) / mediaMensual) * 100;
                            const diffAnual = ((actual - mediaAnual) / mediaAnual) * 100;
                            analisis = `El valor actual está ${diffMensual >= 0 ? 'por encima' : 'por debajo'} de la media mensual (${Math.abs(diffMensual).toFixed(1)}%) y ${diffAnual >= 0 ? 'por encima' : 'por debajo'} de la media anual (${Math.abs(diffAnual).toFixed(1)}%).`;
                        } else if (mediaMensual !== null && mediaMensual > 0) {
                            const diffMensual = ((actual - mediaMensual) / mediaMensual) * 100;
                            analisis = `El valor actual está ${diffMensual >= 0 ? 'por encima' : 'por debajo'} de la media mensual (${Math.abs(diffMensual).toFixed(1)}%).`;
                        } else if (mediaAnual !== null && mediaAnual > 0) {
                            const diffAnual = ((actual - mediaAnual) / mediaAnual) * 100;
                            analisis = `El valor actual está ${diffAnual >= 0 ? 'por encima' : 'por debajo'} de la media anual (${Math.abs(diffAnual).toFixed(1)}%).`;
                        } else {
                            analisis = "No hay suficientes datos para comparar con medias mensuales o anuales.";
                        }
                    } else {
                        if ((mediaMensual === 0 || mediaMensual === null) && (mediaAnual === 0 || mediaAnual === null)) {
                            analisis = "No hay suficientes datos para comparar con medias mensuales o anuales.";
                        } else if (mediaMensual !== null && mediaMensual > 0 && mediaAnual !== null && mediaAnual > 0) {
                            const diffMensual = ((actual - mediaMensual) / mediaMensual) * 100;
                            const diffAnual = ((actual - mediaAnual) / mediaAnual) * 100;
                            analisis = `El valor actual está ${diffMensual >= 0 ? 'por encima' : 'por debajo'} de la media mensual (${Math.abs(diffMensual).toFixed(1)}%) y ${diffAnual >= 0 ? 'por encima' : 'por debajo'} de la media anual (${Math.abs(diffAnual).toFixed(1)}%).`;
                        } else if (mediaMensual !== null && mediaMensual > 0) {
                            const diffMensual = ((actual - mediaMensual) / mediaMensual) * 100;
                            analisis = `El valor actual está ${diffMensual >= 0 ? 'por encima' : 'por debajo'} de la media mensual (${Math.abs(diffMensual).toFixed(1)}%).`;
                        } else if (mediaAnual !== null && mediaAnual > 0) {
                            const diffAnual = ((actual - mediaAnual) / mediaAnual) * 100;
                            analisis = `El valor actual está ${diffAnual >= 0 ? 'por encima' : 'por debajo'} de la media anual (${Math.abs(diffAnual).toFixed(1)}%).`;
                        } else {
                            analisis = "No hay suficientes datos para comparar con medias mensuales o anuales.";
                        }
                    }
                    return (
                        <TabsContent key={v.id} value={v.id} className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Media actual</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">
                                            {formatValue(v.id, actual)} {v.unit}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Media mensual</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">
                                            {mediaMensual !== null ? `${formatValue(v.id, mediaMensual)} ${v.unit}` : "–"}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Media anual</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">
                                            {mediaAnual !== null ? `${formatValue(v.id, mediaAnual)} ${v.unit}` : "–"}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Extremos mensuales</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm">
                                            Mínimo: {minMensual !== null ? `${formatValue(v.id, minMensual)} ${v.unit}` : "–"}<br/>
                                            Máximo: {maxMensual !== null ? `${formatValue(v.id, maxMensual)} ${v.unit}` : "–"}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Extremos anuales</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm">
                                            Mínimo: {minAnual !== null ? `${formatValue(v.id, minAnual)} ${v.unit}` : "–"}<br/>
                                            Máximo: {maxAnual !== null ? `${formatValue(v.id, maxAnual)} ${v.unit}` : "–"}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Comparativa gráfica</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis tickFormatter={val => Math.round(val).toString()} />
                                                <Tooltip formatter={val => `${formatValue(v.id, val as number)} ${v.unit}`} />
                                                <Legend />
                                                <Bar dataKey="value" name={v.name} fill={v.color} radius={[8,8,0,0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Análisis comparativo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{analisis}</p>
                                    {tendencia && (
                                        <div className="text-xs text-muted-foreground mt-2">Tendencia reciente: <b>{tendencia}</b></div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Previsiones</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">
                                        {(() => {
                                            switch (v.id) {
                                                case 'temperatura':
                                                    return 'Se espera que la temperatura tienda a subir en los próximos días si persisten las condiciones actuales, especialmente en periodos de mayor insolación.';
                                                case 'humedad':
                                                    return 'La humedad relativa podría descender ligeramente si continúan las jornadas soleadas y sin precipitaciones.';
                                                case 'presion':
                                                    return 'La presión atmosférica se mantendrá estable salvo la llegada de frentes o cambios meteorológicos significativos.';
                                                case 'lluvia':
                                                    return 'No se prevén lluvias significativas a corto plazo salvo cambios en la situación meteorológica. La acumulación anual podría incrementarse si se producen episodios de precipitación.';
                                                default:
                                                    return 'No hay previsión disponible para esta variable.';
                                            }
                                        })()}
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Metodología</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">
                        Esta comparativa se basa únicamente en los datos actuales, mensuales y anuales disponibles. No se realiza ninguna simulación ni predicción futura, solo comparativas y tendencias reales.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForecastDashboard;