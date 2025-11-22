import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

// TİP TANIMLARI
interface DayType {
  id: number;
  name: string;
  day: string;
  fullDate: string;
  rawDate: Date;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // Dakika cinsinden süre
}

// Şimdilik her berberde aynı hizmetler varmış gibi yapıyoruz
const SERVICES: Service[] = [
  { id: '1', name: 'Saç Kesimi', price: 200, duration: 30 },
  { id: '2', name: 'Sakal Kesimi', price: 100, duration: 15 },
  { id: '3', name: 'Saç Yıkama & Fön', price: 80, duration: 15 },
  { id: '4', name: 'Cilt Bakımı', price: 150, duration: 30 },
];

export default function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const item = {
    id: params.id as string, 
    name: params.name as string,
    image: params.image as string,
    rating: params.rating as string,
    location: params.location as string,
  };

  const [selectedDay, setSelectedDay] = useState<DayType | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]); // Seçilen hizmetlerin ID'leri
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<DayType[]>([]);

  const HOURS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  useEffect(() => {
    setDays(generateNextDays());
  }, []);

  const generateNextDays = (): DayType[] => {
    const daysArray: DayType[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i + 1);
      const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(nextDate);
      const dayNumber = nextDate.getDate().toString();
      const fullDateStr = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(nextDate);

      daysArray.push({
        id: i,
        name: dayName,
        day: dayNumber,
        fullDate: fullDateStr,
        rawDate: nextDate
      });
    }
    return daysArray;
  };

  // HİZMET SEÇME/KALDIRMA MANTIĞI
  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      // Zaten seçiliyse çıkar
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    } else {
      // Seçili değilse ekle
      setSelectedServices(prev => [...prev, serviceId]);
    }
  };

  // TOPLAM TUTARI HESAPLA
  const totalPrice = selectedServices.reduce((total, serviceId) => {
    const service = SERVICES.find(s => s.id === serviceId);
    return total + (service ? service.price : 0);
  }, 0);

  const handleBooking = async () => {
    if (!selectedDay || !selectedTime) {
      Alert.alert("Eksik Bilgi", "Lütfen tarih ve saat seçin.");
      return;
    }
    if (selectedServices.length === 0) {
      Alert.alert("Eksik Bilgi", "Lütfen en az bir hizmet seçin.");
      return;
    }

    const user = auth.currentUser; 
    if (!user) {
      Alert.alert("Hata", "Giriş yapmalısınız.");
      return;
    }

    setLoading(true); 

    try {
      // Seçilen hizmetlerin isimlerini alalım
      const serviceNames = selectedServices.map(id => SERVICES.find(s => s.id === id)?.name).join(", ");

      const randevuVerisi = {
        userId: user.uid,          
        userEmail: user.email,     
        berberId: item.id,         
        berberName: item.name,     
        date: selectedDay.fullDate, 
        time: selectedTime,
        services: serviceNames, // Örn: "Saç Kesimi, Sakal Kesimi"
        totalPrice: totalPrice, // Örn: 300
        status: 'pending',
        createdAt: new Date()      
      };

      await addDoc(collection(db, "randevular"), randevuVerisi);

      Alert.alert(
        "Randevu Oluşturuldu! 🎉", 
        `Tutar: ${totalPrice} TL\nHizmetler: ${serviceNames}`,
        [{ text: "Süper", onPress: () => router.push('/(tabs)') }] 
      );

    } catch (error) {
      console.error("Randevu hatası:", error);
      Alert.alert("Hata", "Sorun oluştu.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: item.image }} style={styles.image} />

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {item.rating}</Text>
            </View>
          </View>
          <Text style={styles.location}>📍 {item.location}</Text>

          {/* --- HİZMET SEÇİMİ --- */}
          <Text style={styles.sectionTitle}>Hizmet Seç</Text>
          <View style={styles.servicesContainer}>
            {SERVICES.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <TouchableOpacity 
                  key={service.id} 
                  style={[styles.serviceCard, isSelected && styles.selectedServiceCard]}
                  onPress={() => toggleService(service.id)}
                >
                  <View>
                    <Text style={[styles.serviceName, isSelected && styles.selectedText]}>{service.name}</Text>
                    <Text style={[styles.serviceDuration, isSelected && styles.selectedText]}>{service.duration} dk</Text>
                  </View>
                  <Text style={[styles.servicePrice, isSelected && styles.selectedText]}>{service.price} ₺</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color="#fff" style={{position: 'absolute', top: 5, right: 5}} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- TARİH & SAAT --- */}
          <Text style={styles.sectionTitle}>Tarih Seç</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
            {days.map((dayItem) => {
              const isSelected = selectedDay?.id === dayItem.id;
              return (
                <TouchableOpacity 
                  key={dayItem.id} 
                  style={[styles.dayCard, isSelected && styles.selectedDayCard]} 
                  onPress={() => setSelectedDay(dayItem)}
                >
                  <Text style={[styles.dayName, isSelected && styles.selectedText]}>{dayItem.name}</Text>
                  <Text style={[styles.dayNumber, isSelected && styles.selectedText]}>{dayItem.day}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>Saat Seç</Text>
          <View style={styles.timesContainer}>
            {HOURS.map((time, index) => {
              const isSelected = selectedTime === time;
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.timeCard, isSelected && styles.selectedTimeCard]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeText, isSelected && styles.selectedText]}>{time}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* --- ALT BUTON --- */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Toplam Tutar</Text>
          <Text style={styles.totalPrice}>{totalPrice} ₺</Text>
        </View>

        <TouchableOpacity 
          style={[styles.bookButton, (totalPrice === 0 || !selectedDay || !selectedTime) && styles.disabledButton]} 
          onPress={handleBooking}
          disabled={loading} 
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Onayla ve Bitir</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 250 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  ratingBadge: { backgroundColor: '#fff9c4', padding: 5, borderRadius: 5 },
  ratingText: { color: '#fbc02d', fontWeight: 'bold' },
  location: { fontSize: 16, color: '#666', marginTop: 5, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10, color: '#333' },
  
  // Hizmet Kartları
  servicesContainer: { gap: 10, marginBottom: 20 },
  serviceCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff'
  },
  selectedServiceCard: { backgroundColor: '#333', borderColor: '#333' },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  serviceDuration: { fontSize: 12, color: '#666', marginTop: 2 },
  servicePrice: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  
  // Tarih & Saat
  daysScroll: { marginBottom: 20 },
  dayCard: { width: 60, height: 70, borderRadius: 12, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  selectedDayCard: { backgroundColor: '#333' },
  dayName: { color: '#999', fontSize: 12 },
  dayNumber: { color: '#333', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  selectedText: { color: '#fff' },
  timesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  timeCard: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  selectedTimeCard: { backgroundColor: '#333', borderColor: '#333' },
  timeText: { color: '#333' },
  
  // Footer
  footer: { 
    padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  priceContainer: { flexDirection: 'column' },
  priceLabel: { fontSize: 12, color: '#666' },
  totalPrice: { fontSize: 24, fontWeight: 'bold', color: '#333' },

  bookButton: { 
    backgroundColor: '#333', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10, alignItems: 'center' 
  },
  disabledButton: { backgroundColor: '#ccc' },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});