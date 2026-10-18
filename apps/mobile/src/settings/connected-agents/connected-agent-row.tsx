import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

export interface ConnectedAgentSummary<TId extends string = string> {
  _id: TId;
  clientId: string;
  clientName: string;
  scopes: string[];
  connectedAt: number;
  lastSeenAt: number;
  revocationPending: boolean;
}

interface ConnectedAgentRowProps<TId extends string> {
  agent: ConnectedAgentSummary<TId>;
  busy: boolean;
  onRevoke: (connectionId: TId) => void;
}

export default function ConnectedAgentRow<TId extends string>({
  agent,
  busy,
  onRevoke,
}: ConnectedAgentRowProps<TId>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const scopeLabels = agent.scopes.map((scope) => {
    if (scope === "orbii:read") {
      return "Read access";
    }

    if (scope === "orbii:write") {
      return "Write access";
    }

    return scope;
  });

  return (
    <View style={styles.card}>
      <View style={styles.identity}>
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name="hardware-chip-outline"
          size={22}
          color={colors.primary}
        />
        <View style={styles.copy}>
          <Text style={styles.name}>{agent.clientName}</Text>
          <Text selectable style={styles.clientId}>
            {agent.clientId}
          </Text>
        </View>
      </View>
      <View style={styles.scopes}>
        {scopeLabels.map((scope) => (
          <Text key={scope} style={styles.scope}>
            {scope}
          </Text>
        ))}
      </View>
      {agent.revocationPending ? (
        <Text style={styles.pending}>
          Orbii has blocked this agent. Clerk revocation is pending; retry to
          finish.
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          agent.revocationPending
            ? `Retry revocation for ${agent.clientName}`
            : `Revoke access for ${agent.clientName}`
        }
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() =>
          Alert.alert(
            agent.revocationPending
              ? `Retry revoking ${agent.clientName}?`
              : `Revoke ${agent.clientName}?`,
            agent.revocationPending
              ? "Orbii has blocked this agent. Retrying will ask Clerk to revoke its access token and refresh token."
              : "This agent will lose access to your Orbit and daily ritual.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: agent.revocationPending
                  ? "Retry revocation"
                  : "Revoke access",
                style: "destructive",
                onPress: () => onRevoke(agent._id),
              },
            ],
          )
        }
        style={({ pressed }) => [styles.revoke, pressed && styles.pressed]}
      >
        <Text style={styles.revokeLabel}>
          {busy
            ? "Revoking…"
            : agent.revocationPending
              ? "Retry revocation"
              : "Revoke access"}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      gap: space[4],
      padding: space[5],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    identity: { flexDirection: "row", alignItems: "center", gap: space[3] },
    copy: { flex: 1, gap: space[1] },
    name: { color: colors.ink, fontSize: 16, fontWeight: "600" },
    clientId: { color: colors.muted, fontSize: 12, lineHeight: 18 },
    scopes: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
    scope: {
      color: colors.primaryDeep,
      backgroundColor: colors.bgMid,
      borderRadius: radius.full,
      paddingHorizontal: space[3],
      paddingVertical: space[2],
      fontSize: 13,
      fontWeight: "500",
    },
    revoke: {
      alignSelf: "flex-start",
      paddingVertical: space[2],
    },
    pending: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    revokeLabel: { color: colors.danger, fontSize: 15, fontWeight: "600" },
    pressed: { opacity: 0.65 },
  });
