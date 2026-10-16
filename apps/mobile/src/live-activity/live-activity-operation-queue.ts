export const createLiveActivityOperationQueue = () => {
  let previousOperation = Promise.resolve();

  return <T>(operation: () => Promise<T>) => {
    const result = previousOperation.then(operation, operation);
    previousOperation = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
};
