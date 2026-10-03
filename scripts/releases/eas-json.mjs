export const parseEasJson = (output) => {
  try {
    return JSON.parse(output);
  } catch (error) {
    // EAS fingerprint commands can print environment notices before their JSON.
    const lines = output.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trimStart();
      if (!line.startsWith("{") && !line.startsWith("[")) {
        continue;
      }

      try {
        return JSON.parse(lines.slice(index).join("\n"));
      } catch {
        // A notice can contain braces; only accept a complete JSON result.
      }
    }
    throw error;
  }
};
