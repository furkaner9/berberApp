import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#333',
        tabBarInactiveTintColor: '#999',
        tabBarShowLabel: false, // Yazıları gizle, sadece ikon olsun
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: '#fff',
          borderRadius: 20,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />

      {/* ORTA BUTON (En Yakını Bul) */}
      <Tabs.Screen
        name="nearby"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              top: -20, // Yukarı taşır
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#333',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 5
            }}>
              <Ionicons name="navigate" size={28} color="#fff" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="randevularim"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
          ),
        }}
      />
      
      {/* Gizli Berber Paneli (Menüde görünmesin ama erişilebilsin) */}
       <Tabs.Screen
        name="berber-panel" // Bu dosya varsa ekle yoksa hata verebilir, varsa ekle
        options={{
          href: null, // Menüde gizle
        }}
      />
    </Tabs>
  );
}