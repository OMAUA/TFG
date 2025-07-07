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

    // Función para obtener el mensaje de previsión según variable, mes, tendencia y estacionalidad de Torrevieja
    const getForecastMessage = (variableId: string, tendencia: string | null, actual: number | null, mes: number) => {
        // Mes: 0=enero, 11=diciembre
        // Estaciones: Invierno (12,1,2), Primavera (3,4,5), Verano (6,7,8), Otoño (9,10,11)
        if (variableId === 'temperatura') {
            if ([11,0,1].includes(mes)) {
                // Diciembre, enero, febrero
                if (tendencia === 'subida') return 'Aunque es invierno en Torrevieja, se observa una ligera tendencia al alza en las temperaturas, aunque lo habitual es que se mantengan frescas.';
                if (tendencia === 'bajada') return 'Las temperaturas siguen descendiendo, acorde a la época invernal en Torrevieja.';
                return 'Se espera que las temperaturas se mantengan suaves o frescas, típico del invierno en Torrevieja.';
            }
            if ([2,3,4].includes(mes)) {
                // Marzo, abril, mayo
                if (tendencia === 'subida') return 'Con la llegada de la primavera, las temperaturas tienden a subir progresivamente en la zona.';
                if (tendencia === 'bajada') return 'A pesar de estar en primavera, se observa un leve descenso de temperaturas.';
                return 'Las temperaturas suelen ser agradables y en ascenso durante la primavera en Torrevieja.';
            }
            if ([5,6,7].includes(mes)) {
                // Junio, julio, agosto
                if (tendencia === 'subida') return 'Las temperaturas siguen en ascenso, propio del verano en Torrevieja.';
                if (tendencia === 'bajada') return 'Se detecta un leve descenso, aunque el verano suele ser muy cálido en la zona.';
                return 'Se esperan temperaturas elevadas y ambiente seco, característico del verano en Torrevieja.';
            }
            if ([8,9,10].includes(mes)) {
                // Septiembre, octubre, noviembre
                if (tendencia === 'subida') return 'A pesar de estar en otoño, las temperaturas muestran una tendencia al alza.';
                if (tendencia === 'bajada') return 'Las temperaturas tienden a descender, propio del otoño en la zona.';
                return 'En otoño, las temperaturas suelen ir descendiendo progresivamente en Torrevieja.';
            }
        }
        if (variableId === 'lluvia') {
            if ([5,6,7].includes(mes)) {
                // Verano
                if (actual === 0) return 'No se esperan lluvias significativas, ya que el verano en Torrevieja suele ser muy seco.';
                return 'Se han registrado lluvias poco habituales para la época estival.';
            }
            if ([8,9,10].includes(mes)) {
                // Otoño
                if (actual === 0) return 'Aunque el otoño es la época más lluviosa en Torrevieja, por ahora no se han registrado precipitaciones.';
                return 'En otoño pueden producirse episodios de lluvias intensas, habituales en la zona.';
            }
            if ([11,0,1].includes(mes)) {
                // Invierno
                if (actual === 0) return 'El invierno suele ser seco en Torrevieja, y no se han registrado lluvias recientemente.';
                return 'Se han registrado lluvias, algo menos frecuente en invierno en la zona.';
            }
            if ([2,3,4].includes(mes)) {
                // Primavera
                if (actual === 0) return 'La primavera suele ser seca en Torrevieja, sin lluvias destacables.';
                return 'Se han registrado lluvias, poco habituales en primavera en la zona.';
            }
        }
        if (variableId === 'humedad') {
            if ([5,6,7].includes(mes)) {
                // Verano
                if (tendencia === 'bajada') return 'La humedad relativa podría descender aún más debido al calor y la falta de lluvias.';
                if (tendencia === 'subida') return 'Se observa un aumento de la humedad, posiblemente por cambios en la brisa marina.';
                return 'En verano, la humedad suele ser moderada-baja en Torrevieja.';
            }
            if ([11,0,1].includes(mes)) {
                // Invierno
                if (tendencia === 'bajada') return 'La humedad relativa desciende, aunque el invierno suele ser algo más húmedo en la zona.';
                if (tendencia === 'subida') return 'Aumenta la humedad, acorde a la mayor presencia de lluvias o nieblas.';
                return 'En invierno, la humedad suele ser algo más alta en Torrevieja.';
            }
            // Primavera y otoño
            if (tendencia === 'bajada') return 'La humedad muestra una ligera tendencia a la baja.';
            if (tendencia === 'subida') return 'La humedad muestra una tendencia al alza.';
            return 'La humedad relativa se mantiene estable, acorde a la época del año.';
        }
        if (variableId === 'presion') {
            if (tendencia === 'bajada') return 'La presión atmosférica muestra una ligera tendencia a la baja, lo que podría indicar cambios meteorológicos.';
            if (tendencia === 'subida') return 'La presión atmosférica tiende a subir, señal de estabilidad en la atmósfera.';
            return 'No se esperan grandes cambios en la presión atmosférica en los próximos días.';
        }
        return 'No hay previsión disponible para esta variable.';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Previsiones Ambientales</h2>
                    <span className="text-sm text-muted-foreground">
                        Última actualización: {metadata?.fecha_generacion || new Date().toLocaleString('es-ES')}
                    </span>
                </div>
                <div className="text-sm text-muted-foreground">
                    Consulta las previsiones ambientales para las principales variables meteorológicas de Torrevieja y alrededores. Esta sección adapta los datos y los mensajes a la época del año actual, la tendencia reciente y los patrones climáticos típicos de la zona, comparando los valores actuales con las medias y extremos mensuales y anuales hasta la fecha para ofrecer una visión contextualizada y realista.
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
                                        {getForecastMessage(v.id, tendencia, actual, new Date().getMonth())}
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
};

export default ForecastDashboard;