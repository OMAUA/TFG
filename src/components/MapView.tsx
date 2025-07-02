import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { sensorStations, environmentalParameters } from "@/utils/mockData";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import { useEstaciones } from "@/hooks/useEstaciones";
import { Switch } from "@/components/ui/switch";

// Extender la interfaz de opciones de Leaflet para incluir las opciones de rotación
declare module 'leaflet' {

    interface MapOptions {
        rotate?: boolean;
        bearing?: number;
        touchRotate?: boolean;
        rotateControl?: boolean;
        attributionControl?: boolean;
    }
  
    interface Map {
        setBearing(bearing: number): this;
    }

}

// Coordenadas reales de la Laguna de Torrevieja
const MAP_CENTER: L.LatLngTuple = [38.0, -0.7]; // Latitud, Longitud
const DEFAULT_ZOOM = 13;                        // Zoom inicial del mapa
const INITIAL_ROTATION = 55;                    // Rotación inicial en grados

// Mapeo de estaciones a coordenadas geográficas reales
// Estas coordenadas son aproximadas basadas en la ubicación relativa de las estaciones en el mapa original
const STATION_COORDINATES: Record<number, L.LatLngTuple> = {

    1: [38.022, -0.705], // Norte
    2: [38.015, -0.680], // Este
    3: [37.985, -0.695], // Sur
    4: [38.005, -0.715], // Oeste
    5: [38.005, -0.695], // Centro
    6: [38.020, -0.685], // Noreste
    7: [37.990, -0.680], // Sureste
    8: [37.990, -0.710], // Suroeste

};

// Lista fija de variables agrupadas por categoría
const FIXED_VARIABLE_GROUPS = [
  {
    category: 'Clima',
    variables: [
      { id: 'temperatura', name: 'Temperatura', unit: '°C' },
      { id: 'humedad', name: 'Humedad', unit: '%' },
      { id: 'presion', name: 'Presión', unit: 'hPa' },
      { id: 'puntoderocio', name: 'Punto de rocío', unit: '°C' },
    ]
  },
  {
    category: 'Viento',
    variables: [
      { id: 'velocidadviento', name: 'Velocidad del viento', unit: 'km/h' },
      { id: 'direccionviento', name: 'Dirección del viento', unit: '' },
    ]
  },
  {
    category: 'Precipitación',
    variables: [
      { id: 'lluvia', name: 'Lluvia', unit: 'mm' },
      { id: 'intensidadlluvia', name: 'Intensidad de lluvia', unit: 'mm/h' },
    ]
  }
];

interface MapViewProps {
    onViewStationDetails?: (stationId: number) => void;
}

const MapView = ({ onViewStationDetails }: MapViewProps) => {
    const { data, loading, error } = useEstaciones();
    const [selectedParams, setSelectedParams] = useState<string[]>(FIXED_VARIABLE_GROUPS.flatMap(g => g.variables.map(v => v.id)));
    const [activeStationId, setActiveStationId] = useState<string | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<{[key: string]: L.Marker}>({});

    const handleParamToggle = (paramId: string) => {
        if(selectedParams.includes(paramId)) {
            setSelectedParams(selectedParams.filter(id => id !== paramId));
        } else {
            setSelectedParams([...selectedParams, paramId]);
        }
    };

    // Agrupar parámetros por categoría (mockData)
    const parametersByCategory = environmentalParameters.reduce((acc, param) => {
        if(!acc[param.category]) {
            acc[param.category] = [];
        }
        acc[param.category].push(param);
        return acc;
    }, {} as Record<string, typeof environmentalParameters>);

    const handleStationClick = (stationName: string) => {
        setActiveStationId(activeStationId === stationName ? null : stationName);
    };

    // Inicializar el mapa cuando el componente se monta
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current && data) {
            mapRef.current = L.map(mapContainerRef.current, {
                rotate: true,
                bearing: INITIAL_ROTATION,
                touchRotate: false,
                rotateControl: false,
                attributionControl: false
            }).setView(MAP_CENTER, DEFAULT_ZOOM);

            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '',
                maxZoom: 19,
            }).addTo(mapRef.current);

            const sensorIcon = L.divIcon({
                className: 'sensor-station-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                html: '<div class="sensor-marker-inner"></div>'
            });

            data.datos.forEach((station) => {
                const lat = parseFloat(station.latitud);
                const lng = parseFloat(station.longitud);
                if (!isNaN(lat) && !isNaN(lng)) {
                    const marker = L.marker([lat, lng], { icon: sensorIcon })
                        .addTo(mapRef.current!)
                        .on('click', () => {
                            handleStationClick(station.estacion);
                        });

                    // Etiqueta con el nombre de la estación
                    L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'sensor-station-label',
                            html: `<div class="station-label">${station.estacion}</div>`,
                            iconSize: [0, 0],
                            iconAnchor: [0, -15]
                        })
                    }).addTo(mapRef.current!);

                    markersRef.current[station.estacion] = marker;
                }
            });
        }
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [data]);

    // Actualizar popups cuando cambia la estación activa
    useEffect(() => {
        if (!mapRef.current || !data) return;
        Object.values(markersRef.current).forEach(marker => marker.closePopup());
        if (activeStationId && markersRef.current[activeStationId]) {
            const station = data.datos.find(s => s.estacion === activeStationId);
            if (station) {
                const popupContent = document.createElement('div');
                popupContent.className = 'sensor-popup-content';
                popupContent.style.width = '250px';
                // Título en bloque
                const title = document.createElement('h3');
                title.className = 'text-sm font-medium border-b pb-1 mb-2';
                title.textContent = `${station.estacion}`;
                popupContent.appendChild(title);
                // Contenedor de datos
                const dataContainer = document.createElement('div');
                dataContainer.className = 'text-xs space-y-2';
                if(selectedParams.length === 0) {
                    const noParams = document.createElement('p');
                    noParams.className = 'text-muted-foreground italic';
                    noParams.style.margin = '0';
                    noParams.textContent = 'Selecciona variables para ver datos';
                    dataContainer.appendChild(noParams);
                } else {
                    FIXED_VARIABLE_GROUPS.forEach(group => {
                        const groupSelected = group.variables.filter(param => selectedParams.includes(param.id));
                        if (groupSelected.length > 0) {
                            // Título de la categoría
                            const groupTitle = document.createElement('div');
                            groupTitle.className = 'font-semibold text-[0.95em] text-muted-foreground border-b mb-1';
                            groupTitle.textContent = group.category;
                            dataContainer.appendChild(groupTitle);
                            // Variables del grupo
                            groupSelected.forEach(param => {
                                const value = station.actuales && station.actuales[param.id] !== undefined && station.actuales[param.id] !== null
                                    ? station.actuales[param.id]
                                    : '-';
                                const paramRow = document.createElement('div');
                                paramRow.className = 'grid grid-cols-2';
                                const paramName = document.createElement('span');
                                paramName.className = 'text-muted-foreground';
                                paramName.textContent = `${param.name}:`;
                                const paramValue = document.createElement('span');
                                paramValue.className = 'font-medium text-right';
                                paramValue.textContent = `${value} ${param.unit ? param.unit : ''}`.trim();
                                paramRow.appendChild(paramName);
                                paramRow.appendChild(paramValue);
                                dataContainer.appendChild(paramRow);
                            });
                        }
                    });
                }
                popupContent.appendChild(dataContainer);
                // Enlace "Ver Más..."
                const verMasLink = document.createElement('div');
                verMasLink.className = 'text-center mt-2';
                const linkText = document.createElement('span');
                linkText.className = 'text-primary text-xs inline-block cursor-pointer hover:underline';
                linkText.textContent = 'Ver Más...';
                linkText.addEventListener('click', () => {
                    if (onViewStationDetails) {
                        onViewStationDetails(station.estacion);
                    }
                });
                verMasLink.appendChild(linkText);
                popupContent.appendChild(verMasLink);
                markersRef.current[activeStationId].bindPopup(popupContent).openPopup();
            }
        }
    }, [activeStationId, selectedParams, data, onViewStationDetails]);

    const allParamIds = FIXED_VARIABLE_GROUPS.flatMap(g => g.variables.map(v => v.id));
    const allSelected = selectedParams.length === allParamIds.length;
    const handleToggleAll = (checked: boolean) => {
        setSelectedParams(checked ? allParamIds : []);
    };

    if (loading) return <div>Cargando mapa...</div>;
    if (error) return <div>Error al cargar datos: {error}</div>;
    if (!data) return <div>No hay datos de estaciones disponibles.</div>;

    return (
        <div className="grid grid-cols-4 gap-6">
            {/* Barra lateral de selección de parámetros */}
            <Card className="col-span-1">
                <CardContent className="p-4">
                    <h3 className="text-lg font-medium mb-4">Variables Ambientales</h3>
                    <div className="flex items-center mb-4 gap-2">
                        <Switch id="toggle-all" checked={allSelected} onCheckedChange={handleToggleAll} />
                        <Label htmlFor="toggle-all" className="text-sm cursor-pointer">Seleccionar todas</Label>
                    </div>
                    <div className="space-y-4">
                        {FIXED_VARIABLE_GROUPS.map(group => (
                          <div key={group.category} className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">{group.category}</h4>
                            <div className="space-y-1.5">
                              {group.variables.map(param => (
                                <div key={param.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={param.id} 
                                    checked={selectedParams.includes(param.id)}
                                    onCheckedChange={() => handleParamToggle(param.id)}
                                  />
                                  <Label htmlFor={param.id} className="text-sm cursor-pointer">
                                    {param.name} {param.unit ? `(${param.unit})` : ''}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            {/* Visualización del mapa */}
            <div className="col-span-3 relative">
                <div className="w-full h-[600px] relative rounded-lg overflow-hidden border">
                    {/* Contenedor del mapa Leaflet */}
                    <div ref={mapContainerRef} className="w-full h-full"></div>
                    {/* Leyenda del mapa */}
                    <div className="absolute bottom-3 right-3 bg-white/90 p-2 rounded text-xs z-[1000]">
                        <div className="font-medium mb-1">Leyenda</div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-white border-2 border-eco-blue"></div>
                            <span>Estación de Monitorización</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapView;