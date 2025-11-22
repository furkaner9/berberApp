import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Randevu {
  id: string;
  userEmail: string; // Müşterinin maili
  userName?: string; // Eğer kaydettiysen müşterinin adı
  date: string;
  time: string;
  status?: 'pending' | 'completed'; // Randevu durumu
}

export default function BarberPanel() {
  const router = useRouter();
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncomingAppointments();
  }, []);

  const fetchIncomingAppointments = async () => {
    try {
      setLoading(true);
      // DİKKAT: Şimdilik testi '1' numaralı berber (Makas Sanatı) üzerinden yapıyoruz.
      // Normalde buraya giriş yapan berberin kendi ID'si gelmeli.
      const q = query(collection(db, "randevular"), where("berberId", "==", "1"));
      
      const querySnapshot = await getDocs(q);
      const fetchedData: Randevu[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedData.push({ id: doc.id, ...doc.data() } as Randevu);
      });

      setRandevular(fetchedData);
    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setLoading(false);
    }
  };

  // Randevuyu Tamamla (Bitir)
  const handleComplete = async (id: string) => {
    try {
      // Veritabanından silmek yerine durumunu da güncelleyebilirsin ama şimdilik silelim
      await deleteDoc(doc(db, "randevular", id));
      Alert.alert("İşlem Tamam", "Müşteri traşı tamamlandı, randevu listeden silindi.");
      fetchIncomingAppointments(); // Listeyi yenile
    } catch (error) {
      Alert.alert("Hata", "İşlem başarısız.");
    }
  };

  const renderItem = ({ item }: { item: Randevu }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.customerEmail}>👤 {item.userEmail}</Text>
        <Text style={styles.date}>📅 {item.date} - ⏰ {item.time}</Text>
      </View>
      
      <TouchableOpacity onPress={() => handleComplete(item.id)} style={styles.doneButton}>
        <Text style={styles.doneText}>Tamamla ✅</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Berber Paneli 💈</Text>
      </View>
      
      <View style={styles.statsContainer}>
         <Text style={styles.statsText}>Bekleyen Randevu: {randevular.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#333" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={randevular}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchIncomingAppointments}
          refreshing={loading}
          ListEmptyComponent={<Text style={styles.emptyText}>Şu an bekleyen randevu yok.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  statsContainer: {
    backgroundColor: '#333', padding: 15, margin: 15, borderRadius: 10,
    alignItems: 'center'
  },
  statsText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  listContainer: { padding: 15 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 30 },

  card: {
    backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#eee',
    // Gölge
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,
  },
  info: { flex: 1 },
  customerEmail: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  date: { fontSize: 14, color: '#666' },
  
  doneButton: {
    backgroundColor: '#e8f5e9', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8
  },
  doneText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
});