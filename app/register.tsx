import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Firebase'in kayıt fonksiyonu
import { auth } from '../firebaseConfig'; // Bizim ayar dosyamız

export default function RegisterScreen() {
  const router = useRouter();
  
  // Kullanıcının yazdığı verileri tutmak için State'ler
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Yükleniyor animasyonu için

  const handleRegister = async () => {
    // 1. Basit kontrol: Alanlar dolu mu?
    if (email === '' || password === '') {
      Alert.alert('Hata', 'Lütfen e-posta ve şifre giriniz.');
      return;
    }

    setLoading(true); // Yükleniyor çarkını döndür

    try {
      // 2. FIREBASE İŞLEMİ: Kullanıcıyı oluştur
      await createUserWithEmailAndPassword(auth, email, password);
      
      Alert.alert('Tebrikler!', 'Hesabınız başarıyla oluşturuldu.');
      
      // 3. Başarılıysa Ana Sayfaya (Tabs) yönlendir ve geri gelmesini engelle (replace)
      router.replace('/(tabs)'); 
      
    } catch (error: any) {
      // Hata varsa kullanıcıya göster (Örn: Şifre çok kısa, mail hatalı vb.)
      Alert.alert('Kayıt Başarısız', error.message);
    } finally {
      setLoading(false); // Çarkı durdur
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aramıza Katıl ✂️</Text>
      <Text style={styles.subtitle}>Randevu almak için hesap oluşturun.</Text>

      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="E-posta Adresi" 
          style={styles.input} 
          autoCapitalize="none" // Otomatik baş harf büyütmeyi kapat (Mail için önemli)
          value={email}
          onChangeText={setEmail}
        />
        <TextInput 
          placeholder="Şifre (En az 6 karakter)" 
          style={styles.input} 
          secureTextEntry // Şifreyi gizle (***)
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  inputContainer: { width: '100%', marginBottom: 20 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#333', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkButton: { marginTop: 20 },
  linkText: { color: '#333', fontWeight: '600' },
});