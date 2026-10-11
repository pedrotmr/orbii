import returnLoop from "@orbii/tokens/return-loop.json";
import * as SplashScreen from "expo-splash-screen";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import darkAnimation from "../../../assets/brand/animations/return-loop-splash-dark.json";
import lightAnimation from "../../../assets/brand/animations/return-loop-splash-light.json";
import { useTheme } from "../../theme/use-theme";
import ReturnLoopMark from "../brand-mark/return-loop-mark";

export default function LaunchScreen() {
  const { scheme } = useTheme();
  const [visible, setVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [laidOut, setLaidOut] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const animation = useRef<LottieView>(null);
  const nativeHidden = useRef<Promise<void> | null>(null);
  const hideNative = useCallback(() => {
    if (!nativeHidden.current) {
      nativeHidden.current = SplashScreen.hideAsync().catch(() => undefined);
    }

    return nativeHidden.current;
  }, []);
  const finish = useCallback(() => {
    void hideNative();
    setVisible(false);
  }, [hideNative]);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        if (active) {
          setReduceMotion(enabled);
        }
      },
      () => {
        if (active) {
          setReduceMotion(true);
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    // Native callbacks can be lost; startup must never depend on the player.
    const timeout = setTimeout(finish, 3000);
    return () => clearTimeout(timeout);
  }, [finish, visible]);

  useEffect(() => {
    if (!laidOut) {
      return;
    }

    if (reduceMotion === true) {
      finish();
      return;
    }

    if (loaded && reduceMotion === false) {
      void hideNative().then(() => animation.current?.play());
    }
  }, [finish, hideNative, laidOut, loaded, reduceMotion]);

  if (!visible) {
    return null;
  }

  return (
    <View
      testID="launch-screen"
      onLayout={() => setLaidOut(true)}
      style={[
        styles.overlay,
        {
          backgroundColor:
            scheme === "dark" ? returnLoop.night : returnLoop.brand.fog,
        },
      ]}
    >
      {reduceMotion === false ? (
        <LottieView
          ref={animation}
          testID="launch-animation"
          source={scheme === "dark" ? darkAnimation : lightAnimation}
          autoPlay={false}
          loop={false}
          resizeMode="contain"
          style={styles.animation}
          // Local JSON is supplied during mount. Fabric can omit the loaded event.
          onLayout={() => setLoaded(true)}
          onAnimationLoaded={() => setLoaded(true)}
          onAnimationFinish={(cancelled) => {
            if (!cancelled) {
              finish();
            }
          }}
          onAnimationFailure={finish}
        />
      ) : (
        <ReturnLoopMark size={200} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  animation: { width: 200, height: 200 },
});
