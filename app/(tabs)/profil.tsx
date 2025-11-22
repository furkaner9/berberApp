import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Veri çekme ve güncelleme
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  // State'ler
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(''); // Telefon state'i
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Sayfa ilk açılış yüklemesi

  // 1. Sayfa açılınca veritabanından Telefon Numarasını çek
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            // Veritabanında kayıt varsa telefonu oradan al
            setPhone(docSnap.data().phoneNumber || '');
            // İsmi de oradan alabiliriz, garanti olsun
            setName(docSnap.data().fullName || user.displayName);
          }
        } catch (error) {
          console.log("Profil verisi çekilemedi", error);
        } finally {
          setPageLoading(false);
        }
      }
    };
    fetchUserData();
  }, []);

  // 2. BİLGİ GÜNCELLEME FONKSİYONU
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    if (name.trim() === "" || phone.trim() === "") {
      Alert.alert("Hata", "İsim ve Telefon alanı boş bırakılamaz.");
      return;
    }

    setLoading(true);
    try {
      // A) Firebase Auth Profilini Güncelle (İsim için)
      await updateProfile(user, { displayName: name });

      // B) Firestore Veritabanını Güncelle (Telefon ve İsim için)
      const userRef = doc(db, "users", user.uid);
      
      // updateDoc: Sadece belirtilen alanları günceller, diğerlerini silmez
      await updateDoc(userRef, {
        fullName: name,
        phoneNumber: phone
      });

      Alert.alert("Başarılı", "Profil bilgileriniz güncellendi! ✅");
    } catch (error) {
      console.error(error);
      // Eğer kullanıcı daha önce eski sistemle kaydolduysa 'users' belgesi olmayabilir.
      // Bu durumda hata verirse setDoc ile oluşturmak gerekebilir ama şimdilik basit tutalım.
      Alert.alert("Hata", "Güncelleme yapılırken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // ÇIKIŞ YAPMA
  const handleLogout = async () => {
    Alert.alert("Çıkış Yap", "Emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış", style: "destructive", onPress: async () => {
          await signOut(auth);
          router.replace('/login' as any);
      }}
    ]);
  };

  if (pageLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#333" /></View>;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
          style={styles.avatar} 
        />
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Adınızı giriniz"
        />

        <Text style={styles.label}>Telefon Numarası</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="05..."
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Bilgileri Güncelle</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* BERBER PANELİNE GEÇİŞ */}
        <Text style={styles.sectionHeader}>Yönetici Alanı</Text>
        <TouchableOpacity 
          style={styles.barberButton} 
          onPress={() => router.push('/berber-panel' as any)}
        >
          <Ionicons name="cut" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.barberButtonText}>Berber Moduna Geç</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#333', height: 220, justifyContent: 'center', alignItems: 'center',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', marginBottom: 10 },
  email: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  form: { padding: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: 'bold' },
  input: { 
    backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee',
    marginBottom: 15, fontSize: 16
  },
  saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  sectionHeader: { fontSize: 14, color: '#999', marginBottom: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  barberButton: { backgroundColor: '#212121', padding: 15, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  barberButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#ffebee', padding: 15, borderRadius: 10, alignItems: 'center' },
  logoutButtonText: { color: '#d32f2f', fontSize: 16, fontWeight: 'bold' },
});