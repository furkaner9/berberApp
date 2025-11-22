import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Veritabanı kaydı için
import { auth, db } from '../firebaseConfig';

export default function RegisterScreen() {
  const router = useRouter();
  
  // Form State'leri
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // 1. Boş alan kontrolü
    if (name === '' || phone === '' || email === '' || password === '') {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurunuz.');
      return;
    }

    setLoading(true);

    try {
      // 2. FIREBASE AUTH: Kullanıcıyı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. FIREBASE AUTH: Görünen İsmi (Display Name) güncelle
      await updateProfile(user, {
        displayName: name
      });

      // 4. FIRESTORE: Kullanıcı detaylarını veritabanına kaydet
      // "users" koleksiyonunda, kullanıcının kendi ID'si ile bir belge açıyoruz.
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: name,
        phoneNumber: phone,
        email: email,
        createdAt: new Date(),
        role: 'customer' // İleride berber/müşteri ayrımı için lazım olabilir
      });
      
      Alert.alert('Tebrikler!', 'Hesabınız başarıyla oluşturuldu.');
      router.replace('/(tabs)'); 
      
    } catch (error: any) {
      Alert.alert('Kayıt Başarısız', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Aramıza Katıl ✂️</Text>
      <Text style={styles.subtitle}>Randevu almak için hesap oluşturun.</Text>

      <View style={styles.inputContainer}>
        {/* Ad Soyad */}
        <TextInput 
          placeholder="Ad Soyad" 
          style={styles.input} 
          value={name}
          onChangeText={setName}
        />

        {/* Telefon */}
        <TextInput 
          placeholder="Telefon Numarası (05...)" 
          style={styles.input} 
          keyboardType="phone-pad" // Sadece rakam klavyesi aç
          value={phone}
          onChangeText={setPhone}
        />

        {/* E-posta */}
        <TextInput 
          placeholder="E-posta Adresi" 
          style={styles.input} 
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* Şifre */}
        <TextInput 
          placeholder="Şifre (En az 6 karakter)" 
          style={styles.input} 
          secureTextEntry 
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Kayıt Ol</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
        <Text style={styles.linkText}>Zaten hesabın var mı? Giriş Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 50 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  inputContainer: { width: '100%', marginBottom: 20 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#333', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkButton: { marginTop: 20, marginBottom: 50 },
  linkText: { color: '#333', fontWeight: '600' },
});