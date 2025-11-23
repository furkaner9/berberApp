import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NearbyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Konum izni bekleniyor...');

  useEffect(() => {
    findLocation();
  }, []);

  const findLocation = async () => {
    setLoading(true);
    setLocationStatus('Uydulara bağlanılıyor...');
    
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationStatus('Konum izni reddedildi ❌');
      setLoading(false);
      return;
    }

    setLocationStatus('Konumunuz bulunuyor...');
    let location = await Location.getCurrentPositionAsync({});
    
    // Konumu bulduk! Şimdi simülasyon yapalım ve kullanıcıyı bilgilendirelim
    setLocationStatus('En yakın berberler sıralanıyor...');
    
    setTimeout(() => {
      // İşlem bitince Ana Sayfaya geri dönüyoruz ama parametreyle
      // (Gerçek hayatta burada harita açılır)
      setLoading(false);
      router.replace('/(tabs)'); 
      alert("Konumunuz bulundu! Liste mesafeye göre sıralandı. (Simülasyon)");
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Ionicons name="navigate" size={50} color="#fff" />
      </View>
      <Text style={styles.title}>En Yakın Berber</Text>
      <Text style={styles.status}>{locationStatus}</Text>
      
      {loading && <ActivityIndicator size="large" color="#333" style={{marginTop: 20}} />}

      <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
        <Text style={styles.closeText}>Vazgeç</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  circle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#333',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  status: { fontSize: 16, color: '#666' },
  closeButton: { marginTop: 50, padding: 15 },
  closeText: { color: '#999', fontSize: 16 }
});