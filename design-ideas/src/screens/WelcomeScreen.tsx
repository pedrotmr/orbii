import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { OrbitHero } from "@/components/OrbitHero";
import { useOrbit } from "@/state/orbitStore";

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { seedDemo, state } = useOrbit();

  return (
    <div className="screen welcome-screen">
      <motion.div
        className="welcome-screen__stage"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <OrbitHero />
      </motion.div>

      <motion.div
        className="welcome-screen__copy"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="welcome-screen__brand">Orbii</p>
        <h1 className="welcome-screen__title">
          Many habits.
          <br />
          <span>Few in focus.</span>
        </h1>
        <p className="welcome-screen__sub">
          Everything you care about stays in orbit. Each day, only a small set comes close —
          enough to finish, not enough to drown in.
        </p>
      </motion.div>

      <div className="bottom-bar">
        <Button
          fullWidth
          onClick={() => {
            if (state.habits.length === 0) seedDemo();
            navigate("/orbit/setup");
          }}
        >
          Start with a demo Orbit
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => {
            seedDemo();
            navigate("/today");
          }}
        >
          Skip to today
        </Button>
      </div>
    </div>
  );
}
