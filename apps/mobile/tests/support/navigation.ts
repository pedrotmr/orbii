import { jest } from "@jest/globals";

interface RemovalEvent {
  repeat: () => void;
}

let prevented = false;
let onRemoval: ((event: RemovalEvent) => void) | undefined;
export const navigatedBack = jest.fn();
export const disablePrevention = jest.fn(() => {
  prevented = false;
});
export const requestRemoval = () => {
  if (prevented) {
    onRemoval?.({ repeat: navigatedBack });
    return;
  }

  navigatedBack();
};
export const router = {
  push: jest.fn(),
  canGoBack: jest.fn(() => true),
  back: jest.fn(requestRemoval),
  replace: jest.fn(),
};

// Drive removal events at the router boundary; native gestures need device tests.
export const usePreventRemove = (
  prevent: boolean,
  callback: (event: RemovalEvent) => void,
) => {
  prevented = prevent;
  onRemoval = callback;
  return disablePrevention;
};

export const resetNavigation = () => {
  prevented = false;
  onRemoval = undefined;
  router.canGoBack.mockReturnValue(true);
};
