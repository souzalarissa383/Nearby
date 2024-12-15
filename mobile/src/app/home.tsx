import React, { useEffect, useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

import { api } from "@/services/api";
import { Categories, CategoriesProps } from "@/components/categories";
import { Places } from "@/components/places";
import { PlaceProps } from "@/components/place";

// Tipo para os mercados
type MarketsProps = PlaceProps & {
  latitude: number;
  longitude: number;
};

// Coordenadas iniciais
const initialRegion = {
  latitude: -23.561187,
  longitude: -46.656451,
};

export default function Home() {
  const [categories, setCategories] = useState<CategoriesProps[]>([]);
  const [category, setCategory] = useState("");
  const [markets, setMarkets] = useState<MarketsProps[]>([]);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  });

  // Função para buscar as categorias
  async function fetchCategories() {
    try {
      const { data }: { data: CategoriesProps[] } = await api.get("/categories");
      setCategories(data);
      setCategory(data[0]?.id || "");
    } catch (error) {
      console.log(error);
      Alert.alert("Categorias", "Não foi possível carregar as categorias.");
    }
  }

  // Função para buscar os mercados
  async function fetchMarkets() {
    try {
      if (!category) return;

      const { data } = await api.get("/markets/category/" + category);
      setMarkets(data);
    } catch (error) {
      console.log(error);
      Alert.alert("Locais", "Não foi possível carregar os locais.");
    }
  }

  // Função para obter a localização atual
  async function getCurrentLocation() {
    try {
      // Simulação: Latitude e longitude fixas para o exemplo
      setCurrentLocation({
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
      });
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível obter a localização atual.");
    }
  }

  // Efeitos para buscar dados ao carregar a página
  useEffect(() => {
    fetchCategories();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [category]);

  // Gera o conteúdo HTML para o mapa
  const generateMapHTML = () => {
    const markersJS = markets
      .map(
        (market) =>
          `L.marker([${market.latitude}, ${market.longitude}]).addTo(map).bindPopup("<b>${market.name}</b><br>${market.address}");`
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          #map { height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var map = L.map('map').setView([${currentLocation.latitude}, ${currentLocation.longitude}], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          // Adiciona marcador de localização atual
          L.marker([${currentLocation.latitude}, ${currentLocation.longitude}])
            .addTo(map)
            .bindPopup("Você está aqui!");

          // Adiciona marcadores para mercados
          ${markersJS}
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      {/* Categorias */}
      <Categories data={categories} onSelect={setCategory} selected={category} />

      {/* Mapa com Leaflet */}
      <WebView
        originWhitelist={["*"]}
        source={{ html: generateMapHTML() }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
      />

      {/* Lista de mercados */}
      <Places data={markets} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#CECECE",
  },
  map: {
    flex: 1,
  },
});
