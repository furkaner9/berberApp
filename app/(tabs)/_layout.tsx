import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // İkon kütüphanesi

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Üstteki varsayılan başlığı gizle
        tabBarActiveTintColor: '#333', // Aktif sekme rengi (Siyah)
        tabBarInactiveTintColor: '#999', // Pasif sekme rengi (Gri)
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        }
      }}
    >
      {/* ANA SAYFA SEKMESİ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* RANDEVULARIM SEKMESİ */}
      <Tabs.Screen
        name="randevularim"
        options={{
          title: 'Randevularım',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      {/* PROFİL SEKMESİ (Bunu en sona ekle) */}
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profilim',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}