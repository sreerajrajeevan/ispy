import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { Nunito_400Regular } from '@expo-google-fonts/nunito';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors, fonts } from './src/theme';
import type { RootStackParamList } from './src/types';
import TodayScreen from './src/screens/TodayScreen';
import FeedScreen from './src/screens/FeedScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CameraScreen from './src/screens/CameraScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import ClueThreadScreen from './src/screens/ClueThreadScreen';
import CreateClueScreen from './src/screens/CreateClueScreen';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, text: colors.ink, border: colors.border, primary: colors.pinkDeep },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextFocused]}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Today" component={TodayScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} /> }} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="✨" focused={focused} /> }} />
      <Tab.Screen
        name="CameraTab"
        component={CameraScreen}
        initialParams={{ clueId: '', clueText: '', isDaily: true }}
        options={({ navigation }) => ({
          tabBarIcon: () => (
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => navigation.navigate('Camera', { clueId: '', clueText: '', isDaily: true })}
            >
              <Text style={styles.cameraButtonText}>📷</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="💌" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label={user ? user.avatarInitial : '🙂'} focused={focused} /> }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>ispy…</Text>
      </View>
    );
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Preview" component={PreviewScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="ClueThread" component={ClueThreadScreen} />
          <Stack.Screen name="CreateClue" component={CreateClueScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  // Friendly rounded type (locked design): Quicksand headings, Nunito body.
  // Registered under the plain family names so every existing style that
  // uses fonts.heading / fonts.body picks them up; falls back to the
  // system font if loading fails on a device.
  const [fontsLoaded] = useFonts({ Quicksand: Quicksand_700Bold, Nunito: Nunito_400Regular });
  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>ispy…</Text>
      </View>
    );
  }
  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', bottom: 18, left: 20, right: 20, height: 68,
    borderRadius: 34, backgroundColor: colors.plum, borderTopWidth: 0,
    elevation: 8, shadowColor: colors.plum, shadowOpacity: 0.3, shadowRadius: 12,
    paddingHorizontal: 8,
  },
  tabIcon: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 22 },
  tabIconFocused: { backgroundColor: colors.plumSoft },
  tabIconText: { fontSize: 20 },
  tabIconTextFocused: { fontSize: 20 },
  cameraButton: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: colors.pink,
    alignItems: 'center', justifyContent: 'center', marginTop: -28,
    borderWidth: 4, borderColor: colors.background, elevation: 6,
  },
  cameraButtonText: { fontSize: 26 },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.heading, fontSize: 32, fontWeight: '800', color: colors.ink },
});
