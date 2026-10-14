import { renderHook } from '@testing-library/react-native';
import { useRequestMissingPermissions } from '../../src/app/useRequestMissingPermissions';
import { usePermissionStore } from '../../src/store/permissionStore';

const requestMissing = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  requestMissing.mockClear();
  usePermissionStore.setState({ onboardingDone: true, requestMissing });
});

describe('useRequestMissingPermissions', () => {
  it('asks once the stores have loaded', async () => {
    const { rerender } = await renderHook(
      (props: { hydrated: boolean }) =>
        useRequestMissingPermissions(props.hydrated),
      { initialProps: { hydrated: false } },
    );
    expect(requestMissing).not.toHaveBeenCalled();

    await rerender({ hydrated: true });
    expect(requestMissing).toHaveBeenCalledTimes(1);
  });

  it('leaves the first launch to onboarding', async () => {
    usePermissionStore.setState({ onboardingDone: false });
    await renderHook(() => useRequestMissingPermissions(true));
    expect(requestMissing).not.toHaveBeenCalled();
  });
});
