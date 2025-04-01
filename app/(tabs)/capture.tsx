import { StyleSheet, View, Text } from 'react-native';


export default function CaptureScreen() { 
  return (
    <View style={styles.container}>
    <Text style={styles.title}>capture</Text>

   </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {  
    color: 'white',
  },
});
