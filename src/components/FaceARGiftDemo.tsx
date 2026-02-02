import React, { useState, useRef } from 'react';
import { FaceARGiftPanel, FaceARGift as FaceARGiftType } from './FaceARGiftPanel';
import FaceARGift from './FaceARGift';
import { Button } from './ui/button';
import { Camera, CameraOff, Palette } from 'lucide-react';

export const FaceARGiftDemo: React.FC = () => {
  const [currentGift, setCurrentGift] = useState<FaceARGiftType | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [userCoins, setUserCoins] = useState(1000);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSendFaceARGift = (gift: FaceARGiftType) => {
    if (userCoins >= gift.price) {
      setUserCoins(prev => prev - gift.price);
      setCurrentGift(gift);
      
      // Auto-remove gift after 30 seconds
      setTimeout(() => {
        setCurrentGift(null);
      }, 30000);
    }
  };

  const handleClearFaceARGift = () => {
    setCurrentGift(null);
  };

  const toggleCamera = async () => {
    if (!isCameraActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: false 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions.');
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setCurrentGift(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Face AR Gift Demo</h1>
          <p className="text-gray-400">Experience face-tracking AR gifts in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Stream Section */}
          <div className="space-y-4">
            <div className="bg-black rounded-lg overflow-hidden relative aspect-video">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Face AR Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ zIndex: 10 }}
              />
              
              {/* Face AR Gift Component */}
              {currentGift && isCameraActive && (
                <FaceARGift
                  videoElement={videoRef.current}
                  canvasElement={canvasRef.current}
                  giftType={currentGift.type}
                  color={currentGift.color}
                  isActive={true}
                  onFaceDetected={(hasFace) => {
                    console.log('Face detected:', hasFace);
                  }}
                />
              )}
              
              {/* Camera Controls */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Button
                  onClick={toggleCamera}
                  variant={isCameraActive ? "destructive" : "default"}
                  size="sm"
                  className="bg-black/50 hover:bg-black/70 border border-white/20"
                >
                  {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </Button>
                
                {currentGift && (
                  <div className="bg-black/50 px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">{currentGift.name}</span>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              {!isCameraActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Enable Camera</h3>
                    <p className="text-gray-400 mb-4">Click the camera button to start face tracking</p>
                    <Button onClick={toggleCamera}>
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Current Gift Status */}
            {currentGift && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: currentGift.color + '20', color: currentGift.color }}
                    >
                      {currentGift.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{currentGift.name}</div>
                      <div className="text-sm text-gray-400">Active Face AR Gift</div>
                    </div>
                  </div>
                  <Button
                    onClick={handleClearFaceARGift}
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Gift Selection Panel */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Face AR Gifts</h2>
                <div className="flex items-center gap-2 text-yellow-400">
                  <span className="font-bold">{userCoins}</span>
                  <span className="text-sm">coins</span>
                </div>
              </div>
              
              <FaceARGiftPanel
                onSelectGift={handleSendFaceARGift}
                userCoins={userCoins}
                isStreamer={false}
                currentGift={currentGift}
                onClearGift={handleClearFaceARGift}
              />
            </div>
            
            {/* Demo Instructions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">How to Use Face AR Gifts</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">1.</span>
                  <span>Enable your camera to start face tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">2.</span>
                  <span>Select a Face AR gift from the panel</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">3.</span>
                  <span>The gift will appear as a real-time overlay on your face</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">4.</span>
                  <span>Gifts automatically disappear after 30 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceARGiftDemo;