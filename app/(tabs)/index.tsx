import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, TextInput, Alert, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location'; // Konum paketi

// TİP TANIMI
interface Berber {
  id: string;
  name: string;
  location: string;
  rating: number;
  image: string;
  latitude?: number;  // Koordinatları ekledik (Opsiyonel)
  longitude?: number; // Koordinatları ekledik (Opsiyonel)
  distance?: number;  // Hesaplanan mesafe (km cinsinden)
}

export default function HomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  
  const [berberler, setBerberler] = useState<Berber[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false); // Konum aranıyor mu?

  useEffect(() => {
    fetchBerberler();
    if(user) fetchUserFavorites();
  }, []);

  const fetchBerberler = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "berberler"));
      const fetchedData: Berber[] = [];
      
      // Şimdilik berberlere RASTGELE koordinatlar atıyoruz (Test için)
      // Normalde bu veriler veritabanından gelmeli.
      // İstanbul merkezli rastgele koordinatlar:
      querySnapshot.forEach((doc) => {
        fetchedData.push({ 
          id: doc.id, 
          ...doc.data(),
          latitude: 41.0082 + (Math.random() * 0.05 - 0.025), 
          longitude: 28.9784 + (Math.random() * 0.05 - 0.025)
        } as Berber);
      });

      setBerberler(fetchedData); 
    } catch (error) {
      console.error("Veri hatası:", error);
    } finally {
      setLoading(false); 
    }
  };

  const fetchUserFavorites = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setFavorites(userSnap.data().favorites || []);
      }
    } catch (error) {
      console.log("Favoriler çekilemedi", error);
    }
  };

  const toggleFavorite = async (berberId: string) => {
    if (!user) {
      Alert.alert("Giriş Yap", "Favorilere eklemek için giriş yapmalısınız.");
      return;
    }
    const isCurrentlyFavorite = favorites.includes(berberId);
    let newFavorites;

    if (isCurrentlyFavorite) {
      newFavorites = favorites.filter(id => id !== berberId);
    } else {
      newFavorites = [...favorites, berberId];
    }
    setFavorites(newFavorites);

    try {
      const userRef = doc(db, "users", user.uid);
      if (isCurrentlyFavorite) {
        await setDoc(userRef, { favorites: arrayRemove(berberId) }, { merge: true });
      } else {
        await setDoc(userRef, { favorites: arrayUnion(berberId) }, { merge: true });
      }
    } catch (error) {
      console.error("Favori güncellenemedi", error);
      setFavorites(favorites); 
    }
  };

  // --- EN YAKINI BULMA MANTIĞI ---
  const handleFindNearest = async () => {
    setLocationLoading(true);
    
    // 1. İzin İste
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Reddedildi', 'Konum izni vermeden en yakın berberi bulamayız.');
      setLocationLoading(false);
      return;
    }

    // 2. Kullanıcının Konumunu Al
    let userLocation = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = userLocation.coords;

    // 3. Mesafeleri Hesapla (Haversine Formülü)
    const sortedBerberler = berberler.map(berber => {
      // Eğer berberin koordinatı yoksa varsayılan uzak bir yer ver
      if (!berber.latitude || !berber.longitude) return { ...berber, distance: 9999 };

      const distance = getDistanceFromLatLonInKm(
        latitude, longitude, 
        berber.latitude, berber.longitude
      );
      return { ...berber, distance };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Yakından uzağa sırala

    // 4. Listeyi Güncelle
    setBerberler(sortedBerberler);
    Alert.alert("Konum Bulundu", "Berberler en yakından uzağa doğru sıralandı! 📍");
    setLocationLoading(false);
  };

  // Matematiksel Mesafe Formülü (İki koordinat arası km)
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Dünya'nın yarıçapı (km)
    var dLat = deg2rad(lat2-lat1);  
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; 
    return parseFloat(d.toFixed(1)); // Virgülden sonra tek hane (Örn: 1.2 km)
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI/180)
  }

  const filteredBerberler = berberler.filter(berber => {
    const matchesSearch = berber.name.toLowerCase().includes(searchText.toLowerCase());
    if (showFavoritesOnly) {
      return matchesSearch && favorites.includes(berber.id);
    }
    return matchesSearch;
  });

  const renderBerberItem = ({ item }: { item: Berber }) => {
    const isFavorite = favorites.includes(item.id);

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: "/berber-detay" as any, 
            params: { 
              id: item.id, name: item.name, image: item.image, 
              location: item.location, rating: item.rating 
            }
          });
        }}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <TouchableOpacity 
            style={styles.heartButton} 
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={22} 
              color={isFavorite ? "#e53935" : "#333"} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.textRow}>
             <Text style={styles.name}>{item.name}</Text>
             {/* Eğer mesafe hesaplandıysa göster */}
             {item.distance !== undefined && (
               <View style={styles.distanceBadge}>
                 <Ionicons name="walk" size={12} color="#4CAF50" />
                 <Text style={styles.distanceText}>{item.distance} km</Text>
               </View>
             )}
          </View>
          <Text style={styles.location}>
            <Ionicons name="location-sharp" size={14} color="#888" /> {item.location}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, {flex:1}]}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, {user?.displayName?.split(' ')[0] || 'Misafir'} 👋</Text>
          <Text style={styles.headerSubtitle}>Bugün tarzını yenileme zamanı!</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profil' as any)}>
           <Image 
             source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
             style={styles.headerAvatar} 
           />
        </TouchableOpacity>
      </View>

      {/* --- ARAMA ÇUBUĞU --- */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Berber, kuaför ara..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterButtonIcon, showFavoritesOnly && styles.activeFilterIcon]} 
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
           <Ionicons name={showFavoritesOnly ? "heart" : "heart-outline"} size={24} color={showFavoritesOnly ? "#fff" : "#333"} />
        </TouchableOpacity>
      </View>

      {/* --- EN YAKIN BULMA BUTONU (LİSTE ÜSTÜ) --- */}
      {/* İstersen Navbar'a koymak yerine buraya da koyabiliriz, 
          ama Navbar istedin diye aşağıda TabLayout'u güncelleyeceğiz. 
          Şimdilik fonksiyonumuz 'handleFindNearest' hazır. */}

      {/* --- LİSTE --- */}
      <FlatList
        data={filteredBerberler}
        renderItem={renderBerberItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => { setLoading(true); fetchBerberler(); fetchUserFavorites(); }}
        ListEmptyComponent={
          <View style={styles.center}>
             <Text style={{ color: '#999', marginTop: 20 }}>Sonuç bulunamadı.</Text>
          </View>
        }
      />
    </View>
  );
}

// "handleFindNearest" fonksiyonunu dışarıdan çağırmak için Context API kullanmak gerekir 
// ama şimdilik TabLayout içinde butona basınca basit bir olay tetiklemek zor.
// Bu yüzden "En Yakını Bul" butonunu Navbar'ın ortasına koyacağız
// ve tıklandığında "Harita/Konum Sayfası" açacağız ya da bu fonksiyonu çalıştıracağız.

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { alignItems: 'center', justifyContent: 'center' },
  
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff',
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  headerAvatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#f0f0f0' },

  searchWrapper: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 15, borderRadius: 16, height: 50,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 16, color: '#333' },
  filterButtonIcon: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  activeFilterIcon: { backgroundColor: '#e53935' },

  listContainer: { paddingHorizontal: 20, paddingBottom: 80 }, // Alt buton görünmesi için boşluk
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 5,
  },
  imageContainer: { height: 180, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartButton: {
    position: 'absolute', top: 15, right: 15, backgroundColor: '#fff',
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3,
  },
  ratingBadge: {
    position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4
  },
  ratingText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  infoContainer: { padding: 15 },
  textRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  location: { fontSize: 14, color: '#666', marginTop: 2 },
  
  // Mesafe Rozeti
  distanceBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9',
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, gap: 4
  },
  distanceText: { fontSize: 12, color: '#2e7d32', fontWeight: 'bold' }
});