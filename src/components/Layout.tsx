import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import MapView from "@/components/MapView";
import DataDashboard from "@/components/DataDashboard";
import ForecastDashboard from "@/components/ForecastDashboard";

const Layout = () => {

    const [activeTab, setActiveTab] = useState("map");
    const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

    // Función para cambiar a la pestaña de datos y seleccionar una estación
    const navigateToDataWithStation = (stationId: number) => {
        setSelectedStationId(stationId.toString());
        setActiveTab("data");
    };
    
    // Función para actualizar el ID de la estación seleccionada
    const handleStationChange = (stationId: string) => {
        setSelectedStationId(stationId);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">Visualización de la Laguna de Torrevieja</h1>
                    </div>
                    <div>
                        <span className="text-muted-foreground text-sm">TFG - Óscar Medina Amat</span>
                    </div>
                </div>
            </header>
            {/* Main */}
            <main className="flex-1 container mx-auto p-4">
                <Tabs 
                    defaultValue="map" 
                    value={activeTab}
                    onValueChange={setActiveTab} 
                    className="w-full space-y-6"
                >
                    <div className="bg-muted/50 p-1 rounded-lg">
                        <TabsList className="w-full grid grid-cols-3">
                            {[
                                { value: "map", label: "📍 Mapa" },
                                { value: "data", label: "📊 Datos" },
                                { value: "forecast", label: "📈 Previsiones" }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className={cn(
                                        "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary",
                                        "py-2.5 text-sm font-medium transition-all"
                                    )}
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                    <TabsContent value="map" className="bg-white border rounded-lg shadow-sm p-4">
                        <MapView onViewStationDetails={navigateToDataWithStation} />
                    </TabsContent>
                    <TabsContent value="data" className="bg-white border rounded-lg shadow-sm p-4">
                        <DataDashboard 
                            selectedStationId={selectedStationId} 
                            onStationChange={handleStationChange}
                        />
                    </TabsContent>
                    <TabsContent value="forecast" className="bg-white border rounded-lg shadow-sm p-4">
                        <ForecastDashboard />
                    </TabsContent>
                </Tabs>
            </main>
            {/* Footer */}
            <footer className="bg-white border-t py-4">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>Desarrollo de una aplicación web para la visualización de datos ambientales en espacios naturales</p>
                    <p>© 2025 - Ingeniería Multimedia - Universidad de Alicante</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;