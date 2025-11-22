import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons'; // İkonlar için

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser; // Mevcut kullanıcıyı al

  // State'ler
  const [name, setName] = useState(user?.displayName || ''); // Varsa eski ismini getir
  const [loading, setLoading] = useState(false);

  // BİLGİ GÜNCELLEME FONKSİYONU
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    if (name.trim() === "") {
      Alert.alert("Hata", "İsim alanı boş bırakılamaz.");
      return;
    }

    setLoading(true);
    try {
      // Firebase'deki "Display Name" (Görünen İsim) alanını güncelle
      await updateProfile(user, {
        displayName: name
      });
      Alert.alert("Başarılı", "Profil bilgileriniz güncellendi! ✅");
    } catch (error) {
      Alert.alert("Hata", "Güncelleme yapılırken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // ÇIKIŞ YAPMA FONKSİYONU
  const handleLogout = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Uygulamadan çıkmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive", 
          onPress: async () => {
            await signOut(auth);
            router.replace('/login' as any);
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {/* Profil Resmi */}
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

        {/* Bilgileri Güncelle Butonu */}
        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Bilgileri Güncelle</Text>
          )}
        </TouchableOpacity>

        {/* Çizgi */}
        <View style={styles.divider} />

        {/* --- YENİ EKLENEN KISIM: BERBER PANELİ --- */}
        <Text style={styles.sectionHeader}>Yönetici Alanı</Text>
        <TouchableOpacity 
          style={styles.barberButton} 
          onPress={() => router.push('/berber-panel' as any)}
        >
          <Ionicons name="cut" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.barberButtonText}>Berber Moduna Geç</Text>
        </TouchableOpacity>
        {/* ----------------------------------------- */}

        <View style={styles.divider} />

        {/* Çıkış Butonu */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#333',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
    // Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', marginBottom: 10 },
  email: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  form: { padding: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: 'bold' },
  input: { 
    backgroundColor: '#f9f9f9', 
    padding: 15, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#eee',
    marginBottom: 15,
    fontSize: 16
  },
  saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  
  sectionHeader: { fontSize: 14, color: '#999', marginBottom: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  // Berber Butonu Stili
  barberButton: { 
    backgroundColor: '#212121', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center' 
  },
  barberButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  logoutButton: { backgroundColor: '#ffebee', padding: 15, borderRadius: 10, alignItems: 'center' },
  logoutButtonText: { color: '#d32f2f', fontSize: 16, fontWeight: 'bold' },
});