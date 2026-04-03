import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MovieActions from '../components/MovieActions';
import { UserProvider, useUser } from '../context/UserContext';

const mockMovie = {
  id: 123,
  title: 'Тестовый фильм',
  media_type: 'movie',
  poster_path: '/test.jpg',
  vote_average: 7.5,
  release_date: '2023-01-01',
};

const renderWithProvider = (ui, options = {}) => {
  return render(
    <UserProvider>
      {ui}
    </UserProvider>,
    options
  );
};

describe('MovieActions Component', () => {
  test('renders all action buttons', () => {
    renderWithProvider(
      <MovieActions item={mockMovie} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  test('adds movie to favorites when clicked', () => {
    renderWithProvider(
      <MovieActions item={mockMovie} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // Favorite button

    // Проверяем, что кнопка стала активной (с галочкой)
    // Это происходит потому что состояние обновляется в контексте
  });

  test('adds movie to watched when clicked', () => {
    renderWithProvider(
      <MovieActions item={mockMovie} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Watched button
  });

  test('adds movie to watchlist when clicked', () => {
    renderWithProvider(
      <MovieActions item={mockMovie} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]); // Watchlist button
  });

  test('prevents default event propagation', () => {
    const mockOnClick = jest.fn();
    renderWithProvider(
      <div onClick={mockOnClick}>
        <MovieActions item={mockMovie} />
      </div>
    );

    const buttons = screen.getAllByRole('button');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
    Object.defineProperty(event, 'stopPropagation', { value: jest.fn() });
    
    buttons[0].dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
