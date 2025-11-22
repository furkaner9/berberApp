import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

interface Randevu {
  id: string;
  berberName: string;
  date: string;
  time: string;
  createdAt: any;
}

export default function AppointmentsScreen() {
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandevular();
  }, []);

  const fetchRandevular = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      // --- SORGU (QUERY) KISMI ---
      // 1. "randevular" koleksiyonuna bak
      // 2. "userId" alanı, benim ID'me eşit olanları filtrele
      const q = query(collection(db, "randevular"), where("userId", "==", user.uid));
      
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

  // Randevu İptal Etme Fonksiyonu
  const handleDelete = (id: string) => {
    Alert.alert(
      "Randevuyu İptal Et",
      "Bu randevuyu silmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "randevular", id)); // Veritabanından sil
              fetchRandevular(); // Listeyi yenile
            } catch (error) {
              Alert.alert("Hata", "Silinirken bir sorun oluştu.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Randevu }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.berberName}>{item.berberName}</Text>
        <Text style={styles.date}>📅 {item.date} - ⏰ {item.time}</Text>
      </View>
      
      {/* İptal Butonu */}
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>İptal</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Randevularım 📅</Text>
      
      {randevular.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Henüz aktif bir randevunuz yok.</Text>
        </View>
      ) : (
        <FlatList
          data={randevular}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchRandevular} // Aşağı çekince yenile
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 20, marginBottom: 20, color: '#333' },
  listContainer: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },
  
  // Kart Tasarımı
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Gölge
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  info: { flex: 1 },
  berberName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 14, color: '#666', marginTop: 5 },
  
  // Silme Butonu
  deleteButton: {
    backgroundColor: '#ffebee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 12 },
});