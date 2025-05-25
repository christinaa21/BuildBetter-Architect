import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from "expo-router";
import theme from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconNames = ComponentProps<typeof Ionicons>['name'];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarStyle: [
            styles.tabBar,
            {
              height: Platform.OS === 'android' ? 64 + insets.bottom : 64,
            }
          ],
          tabBarActiveTintColor: theme.colors.customGreen[300],
          tabBarInactiveTintColor: theme.colors.customGray[200],
          tabBarLabelStyle: [theme.typography.caption],
          tabBarShowLabel: true,
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: IconNames;

            switch (route.name) {
              case 'chat':
                iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                break;
              case 'jadwal':
                iconName = focused ? 'calendar' : 'calendar-outline';
                break;
              case 'history':
                iconName = focused ? 'time' : 'time-outline';
                break;
              case 'profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'chatbubble-ellipses';
            }

            return (
              <Ionicons name={iconName} size={size} color={color} />
            );
          },
        })}
      >
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarLabel: "Chat",
          }}
        />
        <Tabs.Screen
          name="jadwal"
          options={{
            title: "Jadwal",
            tabBarLabel: "Jadwal",
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarLabel: "History",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.customWhite[50],
    borderTopWidth: 1,
    borderTopColor: theme.colors.customGray[200],
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    paddingTop: 4,
  },
});