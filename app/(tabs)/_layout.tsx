import { Tabs } from "expo-router";
import React, { useState } from "react";
import { Dimensions, View, Text, TouchableOpacity } from "react-native";
import { TabView, SceneMap, TabBar, Route } from "react-native-tab-view";
import { useColorScheme } from "@/hooks/useColorScheme";
import HomeScreen from ".";
import ProfilScreen from "./profil";
import CaptureScreen from "./capture";
import ReviewScreen from "./review";
import FeedScreen from "./feed";
import Feather from '@expo/vector-icons/Feather';


const HomeRoute = () => <HomeScreen />;

const ProfileRoute = () => <ProfilScreen />;

const ReviewRoute = () => <ReviewScreen />;

const FeedRoute = () => <FeedScreen />;

const CaptureRoute = () => <CaptureScreen />;

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "home", title: "Home", icon: "home" },
    { key: "feed", title: "Feed", icon: "list" },
    { key: "capture", title: "Capture", icon: "camera" },
    { key: "review", title: "Review", icon: "star" },
    { key: "profil", title: "Profil", icon: "user" },
  ]);

  const renderScene = SceneMap({
    home: HomeRoute,
    profil: ProfileRoute,
    feed: FeedRoute,
    capture: CaptureRoute,
    review: ReviewRoute,
  });

  const renderTabBar = (props: any) => (
    console.log(index),
    index === 2 ? null : (
    <TabBar
      {...props}
      icon={({ route }: { route: { icon: any } }) => {
        if (route.key === 'capture') {
          return <View style={{ height: 24 }} />;
        }
        return <Feather name={route.icon} size={24} color={props.navigationState.index === props.navigationState.routes.findIndex(r => r.key === route.key) ? "#31AFF0" : "gray"} />;
      }}
      style={{ 
        backgroundColor: "white", 
        maxHeight: 50,
        elevation: 0,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
      }}
      activeColor="#31AFF0"
      indicatorStyle={{ backgroundColor: 'transparent' }}
      inactiveColor="gray"
      pressColor="transparent"
      onTabPress={({ route, preventDefault }) => {
        if (route.key === 'capture') {
          preventDefault();
        }
      }}
    />
    )
  );

  return (
    <View style={{ flex: 1 }}>
      <TabView
        commonOptions={{
          icon: ({ route, focused, color }) => (
            <Feather name={route.icon} color={color} size={24} />
          ),
          label: ({ route, labelText, focused, color }) => (
            <></>
          )
        }}
        
       
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get("window").width }}
        style={{ marginBottom: 0 }}
        tabBarPosition="bottom"
      />
      {index !== 2 && (
        <View style={{
          position: 'absolute',
          bottom: 5,
          alignItems: 'center',
          width: 72,
          alignSelf: 'center',
          zIndex: 1000
        }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: "#31AFF0", 
              width: 72, 
              height: 72, 
              borderRadius: 36, 
              alignItems: "center", 
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5
            }} 
            activeOpacity={1}
            onPress={() => 
              setIndex(2)
            }
          >
            <Feather name="camera" color="white" size={32} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
