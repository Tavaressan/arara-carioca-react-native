import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

// react-native-reanimated exige inicialização nativa (worklets), indisponível no ambiente de teste.
jest.mock('react-native-reanimated', () =>
  require('../../hooks/testUtils/reanimatedMock').createReanimatedViewMock()
);

import Bird from '../Bird';

describe('<Bird />', () => {
  test('posiciona o pássaro pelo shared value x (translateX) e y (translateY)', async () => {
    const { toJSON } = await render(
      <Bird x={{ value: 120 } as any} y={{ value: 300 } as any} velocity={{ value: 0 } as any} size={110} />
    );

    const container = toJSON() as unknown as { props: { style: unknown } };
    const style = StyleSheet.flatten(container.props.style as object) as {
      transform: Array<Record<string, unknown>>;
    };

    expect(style.transform).toEqual(
      expect.arrayContaining([{ translateX: 120 }, { translateY: 300 }])
    );
  });
});
