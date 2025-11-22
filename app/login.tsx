import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Hata', 'Lütfen bilgileri giriniz.');
      return;
    }

    setLoading(true);

    try {
      // FIREBASE GİRİŞ İŞLEMİ
      await signInWithEmailAndPassword(auth, email, password);
      
      // Başarılıysa Ana Sayfaya git
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Giriş Başarısız', 'E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StilRandevu ✂️</Text>
      <Text style={styles.subtitle}>Tekrar hoşgeldiniz!</Text>

      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="E-posta Adresi" 
          style={styles.input} 
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput 
          placeholder="Şifre" 
          style={styles.input} 
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/register' as any)}>
        <Text style={styles.linkText}>Hesabın yok mu? Kayıt Ol</Text>
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