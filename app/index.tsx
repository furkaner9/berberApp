import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Dosya yoluna dikkat

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase'i dinle: Kullanıcı var mı?
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Kullanıcı zaten giriş yapmış -> Ana Sayfaya at
        router.replace('/(tabs)');
      } else {
        // Kullanıcı yok -> Giriş sayfasına at
        router.replace('/login');
      }
      setLoading(false);
    });

    return unsubscribe; // Dinlemeyi durdur
  }, []);

  // Kontrol yapılırken boş ekranda dönen çark göster
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return null;
}