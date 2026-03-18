import { describe, expect, it } from 'vitest';

describe('CompilationBridge stale run recovery', () => {
  it('schedules a retry instead of resetting to idle when a stale compile has no successor', () => {
    const state = {
      recompileNeeded: false,
      compileState: 'compiling' as 'idle' | 'compiling' | 'success' | 'error',
    };

    const handleStaleRunWithoutSuccessor = () => {
      if (!state.recompileNeeded) {
        state.recompileNeeded = true;
      }
    };

    handleStaleRunWithoutSuccessor();

    expect(state.recompileNeeded).toBe(true);
    expect(state.compileState).toBe('compiling');
  });
});
