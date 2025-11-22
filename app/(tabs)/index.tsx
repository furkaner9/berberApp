import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
// Firestore fonksiyonlarını ekledik 👇
import { collection, getDocs } from 'firebase/firestore'; 
import { auth, db } from '../../firebaseConfig'; // db'yi import etmeyi unutma!

// 1. TİP TANIMI
interface Berber {
  id: string;
  name: string;
  location: string;
  rating: number;
  image: string;
}

export default function HomeScreen() {
  const router = useRouter();
  
  // Verileri ve Yüklenme Durumunu tutacak State'ler
  const [berberler, setBerberler] = useState<Berber[]>([]);
  const [loading, setLoading] = useState(true);

  // Sayfa açıldığında çalışacak fonksiyon
  useEffect(() => {
    fetchBerberler();
  }, []);

  // --- FIREBASE'DEN VERİ ÇEKME FONKSİYONU ---
  const fetchBerberler = async () => {
    try {
      // "berberler" koleksiyonuna git ve tüm belgeleri al
      const querySnapshot = await getDocs(collection(db, "berberler"));
      
      const fetchedData: Berber[] = [];
      
      querySnapshot.forEach((doc) => {
        // Gelen veriyi bizim formatımıza çevirip listeye ekle
        // doc.data() -> { name: '...', location: '...' } verir
        // doc.id -> Firestore'un verdiği karmaşık ID'yi verir
        fetchedData.push({
          id: doc.id,
          ...doc.data()
        } as Berber);
      });

      setBerberler(fetchedData); // State'i güncelle
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false); // Yükleme bitti
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login' as any);
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }
  };

  const renderBerberItem = ({ item }: { item: Berber }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: "/berber-detay" as any, 
          params: { 
            id: item.id, 
            name: item.name, 
            image: item.image, 
            location: item.location, 
            rating: item.rating 
          }
        });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.location}>📍 {item.location}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Yükleniyor durumunda dönen çark göster
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={{ marginTop: 10 }}>Berberler Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>StilRandevu ✂️</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* Eğer liste boşsa kullanıcıya bilgi ver */}
      {berberler.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <Text>Henüz kayıtlı berber yok.</Text>
        </View>
      ) : (
        <FlatList
          data={berberler} // Artık State'teki veriyi kullanıyoruz
          renderItem={renderBerberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          // Listeyi aşağı çekince yenileme özelliği (Pull to Refresh)
          refreshing={loading}
          onRefresh={fetchBerberler}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  logoutButton: { backgroundColor: '#ff4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  listContainer: { padding: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, flexDirection: 'row',
    overflow: 'hidden', elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  image: { width: 100, height: 100 },
  infoContainer: { padding: 10, flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  location: { fontSize: 14, color: '#666', marginTop: 4 },
  ratingContainer: {
    marginTop: 8, backgroundColor: '#fff9c4', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5,
  },
  ratingText: { color: '#fbc02d', fontWeight: 'bold', fontSize: 12 },
});