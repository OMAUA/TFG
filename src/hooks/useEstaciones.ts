import { useEffect, useState } from "react";

export interface Estacion {
  estacion: string;
  latitud: string;
  longitud: string;
  fecha: string;
  hora: string;
  actuales: Record<string, string | null>;
  diarios?: Record<string, string | null>;
  mensuales?: Record<string, string | null>;
  anuales?: Record<string, string | null>;
  astronomia?: Record<string, string | null>;
}

export interface DatosEstaciones {
  metadata: {
    fuente: string;
    fecha_generacion: string;
    numero_estaciones: number;
  };
  datos: Estacion[];
}

export function useEstaciones() {
  const [data, setData] = useState<DatosEstaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/datos_meteorologicos.json")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el archivo de datos");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
} 