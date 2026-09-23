import React from 'react';
import { render } from '@testing-library/react-native';

import Score from '../Score';

describe('<Score />', () => {
  test('exibe o valor numérico do score', async () => {
    const { getByText } = await render(<Score score={10} />);

    getByText('10');
  });

  test('exibe o título correspondente à faixa de score', async () => {
    const { getByText } = await render(<Score score={20} />);

    getByText('Boêmio da Lapa');
  });
});
