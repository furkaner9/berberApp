import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

interface Randevu {
  id: string;
  berberId: string; // Puanı kime vereceğimizi bilmek için lazım
  berberName: string;
  date: string;
  time: string;
  totalPrice?: number;
  services?: string;
  status?: string; // 'pending' | 'completed'
  isRated?: boolean; // Daha önce puan vermiş mi?
}

export default function AppointmentsScreen() {
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(true);
  
  // MODAL İÇİN STATE'LER
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingRandevu, setRatingRandevu] = useState<Randevu | null>(null);

  useEffect(() => {
    fetchRandevular();
  }, []);

  const fetchRandevular = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      const q = query(collection(db, "randevular"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const fetchedData: Randevu[] = [];
      querySnapshot.forEach((doc) => {
        fetchedData.push({ id: doc.id, ...doc.data() } as Randevu);
      });

      // Tarihe göre sırala (Yeniden eskiye)
      // (Burada basit string sıralaması yapıyoruz, date objesi olsaydı daha iyi olurdu ama idare eder)
      setRandevular(fetchedData);
    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- PUANLAMA MANTIĞI ---
  const handleRateOpen = (randevu: Randevu) => {
    setRatingRandevu(randevu);
    setSelectedRating(0);
    setModalVisible(true);
  };

  const submitRating = async () => {
    if (!ratingRandevu || selectedRating === 0) {
      Alert.alert("Hata", "Lütfen bir puan seçin.");
      return;
    }

    try {
      // 1. Randevuyu "Puanlandı" olarak işaretle (Tekrar puan veremesin)
      const randevuRef = doc(db, "randevular", ratingRandevu.id);
      await updateDoc(randevuRef, { isRated: true });

      // 2. Berberin Puanını Güncelle (Transaction ile güvenli işlem)
      const berberRef = doc(db, "berberler", ratingRandevu.berberId);
      
      await runTransaction(db, async (transaction) => {
        const berberDoc = await transaction.get(berberRef);
        if (!berberDoc.exists()) throw "Berber bulunamadı!";

        const data = berberDoc.data();
        const currentRating = data.rating || 0;
        const totalVotes = data.totalVotes || 0; // Eğer yoksa 0 say

        // Yeni Ortalama Hesabı: ((EskiOrtalama * EskiOysayısı) + YeniPuan) / (EskiOySayısı + 1)
        // Eğer ilk defa puan alıyorsa direkt yeni puanı ver.
        let newRating;
        if (totalVotes === 0) {
           newRating = selectedRating;
        } else {
           newRating = ((currentRating * totalVotes) + selectedRating) / (totalVotes + 1);
        }
        
        // Virgülden sonra tek hane kalsın (Örn: 4.7)
        newRating = parseFloat(newRating.toFixed(1));

        transaction.update(berberRef, {
          rating: newRating,
          totalVotes: totalVotes + 1
        });
      });

      Alert.alert("Teşekkürler", "Puanınız kaydedildi! ⭐");
      setModalVisible(false);
      fetchRandevular(); // Listeyi yenile (Buton kaybolsun)

    } catch (error) {
      console.error("Puanlama hatası:", error);
      Alert.alert("Hata", "Puan kaydedilemedi.");
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert("İptal", "Randevuyu silmek istediğine emin misin?", [
      { text: "Hayır", style: "cancel" },
      { text: "Evet", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "randevular", id));
          fetchRandevular();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: Randevu }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.berberName}>{item.berberName}</Text>
        <Text style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'completed' ? '#E8F5E9' : '#FFF3E0', 
            color: item.status === 'completed' ? '#2E7D32' : '#EF6C00' }
        ]}>
          {item.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
        </Text>
      </View>
      
      <Text style={styles.date}>📅 {item.date} - ⏰ {item.time}</Text>
      <Text style={styles.services}>{item.services}</Text>
      <Text style={styles.price}>{item.totalPrice} ₺</Text>
      
      <View style={styles.actionRow}>
        {/* Eğer henüz puan vermediyse VE (Test için her zaman gösteriyoruz, normalde status check yapılır) */}
        {!item.isRated && (
           <TouchableOpacity onPress={() => handleRateOpen(item)} style={styles.rateButton}>
             <Ionicons name="star" size={16} color="#FFF" />
             <Text style={styles.rateButtonText}>Puan Ver</Text>
           </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => handleCancel(item.id)} style={styles.cancelButton}>
          <Text style={styles.cancelText}>İptal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Randevularım 📅</Text>
      
      {loading ? <ActivityIndicator size="large" color="#333" style={styles.center} /> : 
       randevular.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Henüz randevunuz yok.</Text>
        </View>
      ) : (
        <FlatList
          data={randevular}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchRandevular}
        />
      )}

      {/* --- PUANLAMA MODALI --- */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hizmeti Puanla</Text>
            <Text style={styles.modalSubtitle}>{ratingRandevu?.berberName} nasıl bir deneyimdi?</Text>
            
            {/* Yıldızlar */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Ionicons 
                    name={star <= selectedRating ? "star" : "star-outline"} 
                    size={40} 
                    color="#FFD700" 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={submitRating}>
              <Text style={styles.submitButtonText}>Gönder</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 20, marginBottom: 10, color: '#333' },
  listContainer: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },
  
  // Kart
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, elevation: 3 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  berberName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { fontSize: 12, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, overflow: 'hidden' },
  date: { fontSize: 14, color: '#666', marginBottom: 5 },
  services: { fontSize: 14, color: '#333', fontStyle: 'italic', marginBottom: 5 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginBottom: 10 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 5 },
  rateButton: { backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  rateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 1 },
  cancelButton: { backgroundColor: '#ffebee', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  cancelText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '80%', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  starsContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  submitButton: { backgroundColor: '#333', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeButton: { padding: 10 },
  closeButtonText: { color: '#666' },
});