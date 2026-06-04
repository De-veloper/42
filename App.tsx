import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { initHealthKit } from './src/utils/healthKit';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LogWorkoutScreen from './src/screens/LogWorkoutScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CompleteScreen from './src/screens/CompleteScreen';
import PathDetailScreen from './src/screens/PathDetailScreen';
import PathProgressScreen from './src/screens/PathProgressScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Main: undefined;
  LogWorkout: { workout?: import('./src/utils/storage').WorkoutEntry; pathWorkoutType?: string } | undefined;
  Settings: undefined;
  Complete: {
    score: { total: number; level: string; levelColor: string };
    totalWorkouts: number;
    totalMinutes: number;
    streak: number;
  };
  PathDetail: { pathId: string; fromCompletion?: boolean };
  PathProgress: { pathId: string };
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#00E5CC',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: '#041428',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,229,204,0.2)',
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color }) => {
          const icon = route.name === 'Home' ? '🏠' : '📋';
          return <Text style={{ fontSize: 22 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => { initHealthKit(); }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="LogWorkout" component={LogWorkoutScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Complete" component={CompleteScreen} />
          <Stack.Screen name="PathDetail" component={PathDetailScreen} />
          <Stack.Screen name="PathProgress" component={PathProgressScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
