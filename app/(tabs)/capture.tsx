import { StyleSheet, View, Text, Button, TouchableOpacity, Image, Animated } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useState, useRef } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function CaptureScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(spinValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [isAnalyzing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      
      if (!photo?.uri) return;

      // Redimensionner l'image pour l'envoi à GPT
      const manipulatedImage = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      setPhoto(manipulatedImage.uri);
      setIsAnalyzing(true);

      // TODO: Envoyer à GPT pour analyse
      // Simulons pour l'instant un délai d'analyse
      setTimeout(() => {
        setIsAnalyzing(false);
        // TODO: Navigation vers l'écran de résultats
      }, 8000);
    } catch (error) {
      console.error("Erreur lors de la capture:", error);
    }
  };

  const resetCapture = () => {
    setPhoto(null);
    setIsAnalyzing(false);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.camera} />
        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Feather name="loader" size={40} color="white" />
            </Animated.View>
            <Text style={styles.analyzingText}>Analyse en cours...</Text>
          </View>
        ) : null}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={resetCapture}
        >
          <Feather name="x" size={32} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Feather name="x" size={32} color="white" />
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}>
            <Feather name="refresh-ccw" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  title: {  
    color: 'white',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
  },
  flipButton: {
    position: 'absolute',
    right: 30,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 2,
    padding: 10,
  },
  analyzingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
});
