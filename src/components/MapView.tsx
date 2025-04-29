import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { sensorStations, environmentalParameters } from "@/utils/mockData";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';

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

const MapView = () => {

    const [selectedParams, setSelectedParams] = useState<string[]>(['temperature', 'humidity']);
    const [activeStationId, setActiveStationId] = useState<number | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<{[key: number]: L.Marker}>({});

    const handleParamToggle = (paramId: string) => {
        if(selectedParams.includes(paramId)) {
            setSelectedParams(selectedParams.filter(id => id !== paramId));
        } else {
            setSelectedParams([...selectedParams, paramId]);
        }
    };

    const handleStationClick = (stationId: number) => {
        setActiveStationId(activeStationId === stationId ? null : stationId);
    };

    const parametersByCategory = environmentalParameters.reduce((acc, param) => {
        if(!acc[param.category]) {
            acc[param.category] = [];
        }
        acc[param.category].push(param);
        return acc;
    }, {} as Record<string, typeof environmentalParameters>);

    // Inicializar el mapa cuando el componente se monta
    useEffect(() => {
        if(mapContainerRef.current && !mapRef.current) {
            // Inicializar el mapa con rotación inicial de 55 grados
            mapRef.current = L.map(mapContainerRef.current, {
                rotate: true,
                bearing: INITIAL_ROTATION,
                touchRotate: false, // Desactivar rotación táctil para evitar cambios accidentales
                rotateControl: false, // Desactivar el control de rotación que aparece junto a los controles de zoom
                attributionControl: false // Eliminar el texto de atribución
            }).setView(MAP_CENTER, DEFAULT_ZOOM);

            // Añadir capa satelital (Esri World Imagery)
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '', // Dejar la atribución vacía
                maxZoom: 19,
            }).addTo(mapRef.current);

            // Creamos un icono personalizado para los marcadores
            const sensorIcon = L.divIcon({
                className: 'sensor-station-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                html: '<div class="sensor-marker-inner"></div>'
            });

            // Añadir marcadores para cada estación
            sensorStations.forEach(station => {
                const coordinates = STATION_COORDINATES[station.id as keyof typeof STATION_COORDINATES];
                if(coordinates) {
                    const marker = L.marker(coordinates, { icon: sensorIcon })
                        .addTo(mapRef.current!)
                        .on('click', () => {
                            handleStationClick(station.id);
                    });
          
                    // Añadimos una etiqueta permanente
                    L.marker(coordinates, {
                        icon: L.divIcon({
                            className: 'sensor-station-label',
                            html: `<div class="station-label">${station.name}</div>`,
                            iconSize: [0, 0], // Tamaño 0 para que se adapte al contenido
                            iconAnchor: [0, -15] // Ajustamos para que esté más abajo (aumentamos la distancia negativa)
                        })
                    }).addTo(mapRef.current!);
                    
                    markersRef.current[station.id] = marker;
                }
            });
        }

        return () => {
            // Limpiar el mapa cuando el componente se desmonta
            if(mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Actualizar popups cuando cambia el activeStationId
    useEffect(() => {
        if(!mapRef.current) return;

        // Cerrar todos los popups
        Object.values(markersRef.current).forEach(marker => {
            marker.closePopup();
        });

        // Abrir el popup para la estación activa
        if(activeStationId !== null && markersRef.current[activeStationId]) {
            const station = sensorStations.find(s => s.id === activeStationId);
            if(station) {
                const popupContent = document.createElement('div');
                popupContent.className = 'sensor-popup-content';
        
                const title = document.createElement('h3');
                title.className = 'text-sm font-medium border-b pb-1 mb-2';
                title.textContent = `Estación ${station.name}`;
                popupContent.appendChild(title);
        
                const dataContainer = document.createElement('div');
                dataContainer.className = 'text-xs space-y-1';
        
                if(selectedParams.length === 0) {
                    const noParams = document.createElement('p');
                    noParams.className = 'text-muted-foreground italic';
                    noParams.textContent = 'Selecciona variables para ver datos';
                    dataContainer.appendChild(noParams);
                } else {
                    selectedParams.forEach(paramId => {
                        const param = environmentalParameters.find(p => p.id === paramId);
                        if(!param) return;
            
                        const paramRow = document.createElement('div');
                        paramRow.className = 'grid grid-cols-2';
            
                        const paramName = document.createElement('span');
                        paramName.className = 'text-muted-foreground';
                        paramName.textContent = `${param.name}:`;
            
                        const paramValue = document.createElement('span');
                        paramValue.className = 'font-medium text-right';
                        paramValue.textContent = `${station.data[paramId as keyof typeof station.data]} ${param.unit}`;
            
                        paramRow.appendChild(paramName);
                        paramRow.appendChild(paramValue);
                        dataContainer.appendChild(paramRow);
                    });
                }
        
                popupContent.appendChild(dataContainer);
        
                markersRef.current[activeStationId].bindPopup(popupContent).openPopup();
            }
        }
    }, [activeStationId, selectedParams]);

    return (
        <div className="grid grid-cols-4 gap-6">
            {/* Barra lateral de selección de parámetros */}
            <Card className="col-span-1">
                <CardContent className="p-4">
                    <h3 className="text-lg font-medium mb-4">Variables Ambientales</h3>
                    <div className="space-y-4">
                        {Object.entries(parametersByCategory).map(([category, params]) => (
                            <div key={category} className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                                <div className="space-y-1.5">
                                    {params.map(param => (
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