import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TimeEntriesScreen from '../screens/TimeEntriesScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ExportScreen from '../screens/ExportScreen';

// Icons
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline'; // Fallback

          // Sicherheitsprüfung für route.name
          if (route?.name) {
            if (route.name === 'Zeiterfassung') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Statistiken') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else if (route.name === 'Projekte') {
              iconName = focused ? 'folder' : 'folder-outline';
            } else if (route.name === 'Profil') {
              iconName = focused ? 'person' : 'person-outline';
            } else if (route.name === 'Export') {
              iconName = focused ? 'download' : 'download-outline';
            }
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Zeiterfassung" 
        component={TimeEntriesScreen}
        options={{ title: 'Zeiterfassung' }}
      />
      <Tab.Screen 
        name="Statistiken" 
        component={StatisticsScreen}
        options={{ title: 'Statistiken' }}
      />
      <Tab.Screen 
        name="Projekte" 
        component={ProjectsScreen}
        options={{ title: 'Projekte' }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
      <Tab.Screen 
        name="Export" 
        component={ExportScreen}
        options={{ title: 'Export' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main App Stack
        <Stack.Screen name="MainApp" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
