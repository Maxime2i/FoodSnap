import React from 'react';
import { StyleSheet, View, Text, Button, TouchableOpacity, Image, Animated, TextInput, ScrollView, Alert, Modal, Switch, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useState, useRef } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';


interface NutritionValues {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  sucres?: number;
  fibres?: number;
  satures?: number;
}


export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [scanned, setScanned] = useState(false);
 

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        router.push({ pathname: '/analyze', params: { photoUri: photo.uri } });
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo :', error);
    }
  };


  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    router.push({ pathname: '/barcode', params: { code: data } });
  };

  useEffect(() => {
    setScanned(false);
  }, []);

  if (!permission?.granted) {
    return (
      <View style={getStyles().container}>
        <Text style={getStyles().message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  
  return (
    <>
      <View style={getStyles().container}>
        <CameraView 
          ref={cameraRef}
          style={getStyles().camera} 
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
          }}
        >
            <View style={getStyles().framingGuide}>
            <View style={[getStyles().framingCorner, { borderTopWidth: 4, borderLeftWidth: 4 }]} />
            <View style={[getStyles().framingCorner, { right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
            <View style={[getStyles().framingCorner, { bottom: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
            <View style={[getStyles().framingCorner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
          </View>
          <TouchableOpacity 
            style={getStyles().closeButton} 
            onPress={() => router.back()}
          >
            <Feather name="x" size={32} color="white" />
          </TouchableOpacity>
          <View style={getStyles().buttonContainer}>
            <View style={getStyles().analyzeButtonWrapper}>
              <TouchableOpacity style={getStyles().analyzeButton} onPress={takePicture}>
                <Text style={getStyles().analyzeButtonText}>Analyser ce plat</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: 'white', textAlign: 'center', marginTop: 16, fontSize: 16, fontWeight: '500', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }}>
              ou scanner un code-barres
            </Text>
            <TouchableOpacity style={getStyles().flipButton} onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}>
              <Feather name="refresh-ccw" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </>
  );
}

const getStyles = () => StyleSheet.create({
container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: Colors.light.text,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  framingGuide: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    bottom: '30%',
  },
  framingCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 2,
    padding: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButtonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 50,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  flipButton: {
    position: 'absolute',
    right: 12,
    bottom: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

