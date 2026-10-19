import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import ScreenScaffold from "../../components/layout/screen-scaffold";
import InlineError from "../../components/states/inline-error";
import { useThemedStyles } from "../../theme/use-theme";
import ConnectedAgentRow, {
  type ConnectedAgentSummary,
} from "./connected-agent-row";

interface ConnectedAgentsContentProps<TId extends string> {
  agents: ConnectedAgentSummary<TId>[];
  busyId: string | null;
  error: string | null;
  onRevoke: (connectionId: TId) => void;
}

export default function ConnectedAgentsContent<TId extends string>({
  agents,
  busyId,
  error,
  onRevoke,
}: ConnectedAgentsContentProps<TId>) {
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenScaffold>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Connected agents
        </Text>
        <Text style={styles.description}>
          Review the access each agent has to your Orbit and today's ritual.
        </Text>
      </View>
      {agents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No connected agents yet</Text>
          <Text style={styles.description}>
            Connect from any MCP client. Orbii will ask you to approve the
            client's requested access before it can connect.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {agents.map((agent) => (
            <ConnectedAgentRow
              key={agent._id}
              agent={agent}
              busy={busyId === agent._id}
              disabled={busyId !== null}
              onRevoke={onRevoke}
            />
          ))}
        </View>
      )}
      {error ? <InlineError message={error} /> : null}
    </ScreenScaffold>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    heading: { gap: space[2], marginBottom: space[3] },
    title: {
      color: colors.ink,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "700",
      letterSpacing: -0.75,
    },
    description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
    empty: { gap: space[2], padding: space[5] },
    emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: "600" },
    list: { gap: space[3] },
  });
