import { useToastStore } from '../../src/store/toastStore';

describe('toastStore', () => {
  it('shows and hides', () => {
    useToastStore.getState().show('Hello');
    expect(useToastStore.getState().toast).toMatchObject({
      message: 'Hello',
      tone: 'info',
    });
    useToastStore.getState().hide();
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('gives a repeated message a new id so the host re-triggers', () => {
    useToastStore.getState().show('Same');
    const first = useToastStore.getState().toast?.id;
    useToastStore.getState().show('Same');
    expect(useToastStore.getState().toast?.id).not.toBe(first);
  });
});
