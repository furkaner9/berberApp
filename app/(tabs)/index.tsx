import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons'; // Büyüteç ikonu için

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
  
  const [berberler, setBerberler] = useState<Berber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(''); // Arama metni için State

  useEffect(() => {
    fetchBerberler();
  }, []);

  const fetchBerberler = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "berberler"));
      const fetchedData: Berber[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedData.push({
          id: doc.id,
          ...doc.data()
        } as Berber);
      });

      setBerberler(fetchedData); 
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false); 
    }
  };

  // --- FİLTRELEME MANTIĞI ---
  const filteredBerberler = berberler.filter(berber => {
    // Hem berber ismini hem aranan metni küçük harfe çevirip karşılaştır
    return berber.name.toLowerCase().includes(searchText.toLowerCase());
  });

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
      </View>

      {/* --- ARAMA ÇUBUĞU --- */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          placeholder="Berber veya kuaför ara..."
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText} // Her harfte state'i güncelle
          placeholderTextColor="#999"
        />
      </View>
      {/* -------------------- */}

      {filteredBerberler.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <Text style={{ color: '#666' }}>
            {searchText ? `"${searchText}" aramasına uygun sonuç yok.` : 'Henüz kayıtlı berber yok.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBerberler} // DİKKAT: Artık filtrelenmiş listeyi veriyoruz
          renderItem={renderBerberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
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
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  
  // Arama Çubuğu Stilleri
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 16, color: '#333' },

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