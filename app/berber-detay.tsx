import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig';

// TİP TANIMI
interface DayType {
  id: number;
  name: string; // Örn: Pzt
  day: string;  // Örn: 24
  fullDate: string; // Örn: 24 Ekim 2025
  rawDate: Date; // Sıralama için ham tarih verisi
}

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
  const [loading, setLoading] = useState(false);
  
  // Dinamik Tarihleri Tutacak State
  const [days, setDays] = useState<DayType[]>([]);

  // Saatler (Sabit kalabilir veya berbere göre değişebilir)
  const HOURS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  // Sayfa açılınca tarihleri hesapla
  useEffect(() => {
    const nextDays = generateNextDays();
    setDays(nextDays);
  }, []);

  // --- AKILLI TARİH OLUŞTURUCU ---
  const generateNextDays = (): DayType[] => {
    const daysArray: DayType[] = [];
    const today = new Date();

    // Önümüzdeki 7 günü hesapla
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i + 1); // Bugüne i+1 ekle (Yarından başla)

      // Türkçe gün ismi (Pzt, Sal...)
      const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(nextDate);
      // Gün numarası (24, 25...)
      const dayNumber = nextDate.getDate().toString();
      // Tam Tarih (Ay ismiyle beraber)
      const fullDateStr = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(nextDate);

      daysArray.push({
        id: i,
        name: dayName, // Pzt
        day: dayNumber, // 24
        fullDate: fullDateStr, // 24 Ekim 2025
        rawDate: nextDate
      });
    }
    return daysArray;
  };

  const handleBooking = async () => {
    if (!selectedDay || !selectedTime) {
      Alert.alert("Eksik Bilgi", "Lütfen önce bir tarih ve saat seçin.");
      return;
    }

    const user = auth.currentUser; 
    if (!user) {
      Alert.alert("Hata", "Randevu almak için giriş yapmalısınız.");
      return;
    }

    setLoading(true); 

    try {
      const randevuVerisi = {
        userId: user.uid,          
        userEmail: user.email,     
        berberId: item.id,         
        berberName: item.name,     
        // ARTIK TAM TARİHİ KAYDEDİYORUZ 👇
        date: selectedDay.fullDate, 
        dayName: selectedDay.name, // Hangi gün olduğu (Pzt vb.)
        time: selectedTime,        
        createdAt: new Date()      
      };

      await addDoc(collection(db, "randevular"), randevuVerisi);

      Alert.alert(
        "Başarılı! 🎉", 
        `Randevunuz ${selectedDay.fullDate} saat ${selectedTime} için oluşturuldu.`,
        [{ text: "Tamam", onPress: () => router.push('/(tabs)') }] 
      );

    } catch (error) {
      console.error("Randevu hatası:", error);
      Alert.alert("Hata", "Randevu oluşturulurken bir sorun çıktı.");
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

          {/* --- TARİH SEÇİMİ (Dinamik Liste) --- */}
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

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.bookButton, (!selectedDay || !selectedTime) && styles.disabledButton]} 
          onPress={handleBooking}
          disabled={loading} 
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Randevuyu Onayla</Text>
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
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  bookButton: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  bookButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});