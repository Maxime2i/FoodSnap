import { StyleSheet, View, Text } from 'react-native';


export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>feed</Text>

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
