import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResultsList from '../components/ResultsList';
import { UserProvider } from '../context/UserContext';

const renderWithProvider = (ui, options = {}) => {
  return render(
    <UserProvider>
      {ui}
    </UserProvider>,
    options
  );
};

describe('ResultsList Component', () => {
  const mockResults = [
    {
      id: 1,
      title: 'Movie One',
      name: null,
      poster_path: '/poster1.jpg',
      media_type: 'movie',
      release_date: '2024-01-15',
      vote_average: 7.5,
      popularity: 100.5,
    },
    {
      id: 2,
      title: null,
      name: 'TV Show One',
      poster_path: '/poster2.jpg',
      media_type: 'tv',
      first_air_date: '2023-06-20',
      vote_average: 8.2,
      popularity: 150.3,
    },
  ];

  const mockOnSelect = jest.fn();
  const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  test('renders list of results', () => {
    renderWithProvider(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Movie One')).toBeInTheDocument();
    expect(screen.getByText('TV Show One')).toBeInTheDocument();
  });

  test('renders correct poster URLs', () => {
    renderWithProvider(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute(
      'src',
      `${IMAGE_BASE}${mockResults[0].poster_path}`
    );
    expect(images[1]).toHaveAttribute(
      'src',
      `${IMAGE_BASE}${mockResults[1].poster_path}`
    );
  });

  test('displays correct years', () => {
    render(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
  });

  test('calls onSelect when card is clicked (not kinopoisk icon)', () => {
    render(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    const cards = screen.getAllByRole('link');
    fireEvent.click(cards[0]);

    expect(mockOnSelect).toHaveBeenCalledWith(1, 'movie');
  });

  test('does not call onSelect when kinopoisk icon is clicked', () => {
    render(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    // Kinopoisk icon has an SVG inside
    const kinoIcons = screen.getAllByRole('link');
    const kinopoiskIcon = kinoIcons[0].querySelector('.kinopoisk-icon svg');

    if (kinopoiskIcon) {
      fireEvent.click(kinopoiskIcon);
      expect(mockOnSelect).not.toHaveBeenCalled();
    }
  });

  test('renders Kinopoisk search links', () => {
    render(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link.getAttribute('href')).toContain('kinopoisk.ru');
    });
  });

  test('displays ratings', () => {
    render(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('100.5')).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();
    expect(screen.getByText('8.2')).toBeInTheDocument();
  });

  test('shows cache indicator when fromCache is true', () => {
    render(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
        fromCache={true}
      />
    );

    expect(screen.getByText('Загружено из кэша')).toBeInTheDocument();
  });

  test('does not show cache indicator when fromCache is false', () => {
    render(
      <ResultsList
        results={mockResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
        fromCache={false}
      />
    );

    expect(
      screen.queryByText('Загружено из кэша')
    ).not.toBeInTheDocument();
  });

  test('limits results to 10 items', () => {
    const manyResults = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Movie ${i + 1}`,
      poster_path: `/poster${i}.jpg`,
      media_type: 'movie',
      release_date: '2024-01-01',
      vote_average: 7.0,
      popularity: 100,
    }));

    render(
      <ResultsList
        results={manyResults}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    // First 10 should be rendered
    expect(screen.getByText('Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Movie 10')).toBeInTheDocument();
    // 11th should not be rendered
    expect(screen.queryByText('Movie 11')).not.toBeInTheDocument();
  });

  test('handles null date gracefully', () => {
    const resultWithNoDate = [
      {
        id: 1,
        title: 'Movie No Date',
        poster_path: '/poster.jpg',
        media_type: 'movie',
        release_date: null,
        vote_average: 7.0,
        popularity: 100,
      },
    ];

    render(
      <ResultsList
        results={resultWithNoDate}
        imageBase={IMAGE_BASE}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Movie No Date')).toBeInTheDocument();
  });
});
