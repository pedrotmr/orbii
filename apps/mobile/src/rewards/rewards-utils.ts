export const formatPoints = (value: number) => {
  return value === 1 ? "1 point" : `${value.toLocaleString()} points`;
};
