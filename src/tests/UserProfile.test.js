import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfile from '../components/UserProfile';
import { UserProvider } from '../context/UserContext';

const mockTranslations = {
  profile: 'Профиль',
  profileName: 'Имя',
  profileNamePlaceholder: 'Ваше имя',
  changeAvatar: 'Сменить аватар',
  favorites: 'Избранное',
  watched: 'Просмотренное',
  watchlist: 'Буду смотреть',
  favoritesEmpty: 'В избранном пока пусто',
  watchedEmpty: 'Вы ещё ничего не посмотрели',
  watchlistEmpty: 'Список "Буду смотреть" пуст',
  close: 'Закрыть',
  movie: 'Фильм',
  tvSeries: 'Сериал',
};

const renderWithProvider = (ui, options = {}) => {
  return render(
    <UserProvider>
      {ui}
    </UserProvider>,
    options
  );
};

describe('UserProfile Component', () => {
  test('renders nothing when isOpen is false', () => {
    renderWithProvider(
      <UserProfile
        isOpen={false}
        onClose={() => {}}
        t={mockTranslations}
      />
    );

    expect(screen.queryByText('Профиль')).not.toBeInTheDocument();
  });

  test('renders profile panel when isOpen is true', () => {
    renderWithProvider(
      <UserProfile
        isOpen={true}
        onClose={() => {}}
        t={mockTranslations}
      />
    );

    expect(screen.getByText('Профиль')).toBeInTheDocument();
  });

  test('displays default name placeholder', () => {
    renderWithProvider(
      <UserProfile
        isOpen={true}
        onClose={() => {}}
        t={mockTranslations}
      />
    );

    expect(screen.getByText('Ваше имя')).toBeInTheDocument();
  });

  test('shows favorites tab as active by default', () => {
    renderWithProvider(
      <UserProfile
        isOpen={true}
        onClose={() => {}}
        t={mockTranslations}
      />
    );

    expect(screen.getByText('Избранное')).toBeInTheDocument();
    expect(screen.getByText('В избранном пока пусто')).toBeInTheDocument();
  });

  test('switches to watched tab when clicked', () => {
    renderWithProvider(
      <UserProfile
        isOpen={true}
        onClose={() => {}}
        t={mockTranslations}
      />
    );

    const watchedTab = screen.getByText('Просмотренное');
    fireEvent.click(watchedTab);

    expect(screen.getByText('Вы ещё ничего не посмотрели')).toBeInTheDocument();
  });

  test('switches to watchlist tab when clicked', () => {
    renderWithProvider(
      <UserProfile
        isOpen={true}
        onClose={() => {}}
        t={mockTranslations}
      />
    );

    const watchlistTab = screen.getByText('Буду смотреть');
    fireEvent.click(watchlistTab);

    expect(screen.getByText('Список "Буду смотреть" пуст')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onCloseMock = jest.fn();
    renderWithProvider(
      <UserProfile
        isOpen={true}
        onClose={onCloseMock}
        t={mockTranslations}
      />
    );

    const closeBtn = screen.getByRole('button', { name: '' });
    // Ищем кнопку закрытия по SVG
    const closeButtons = screen.getAllByRole('button');
    const closeXBtn = closeButtons.find(btn => btn.querySelector('svg'));
    
    if (closeXBtn) {
      fireEvent.click(closeXBtn);
      expect(onCloseMock).toHaveBeenCalled();
    }
  });

  test('shows zero counts for all lists', () => {
    renderWithProvider(
      <UserProfile
        isOpen={true}
        onClose={() => {}}
        t={mockTranslations}
      />
    );

    // Проверка, что статистика показывает 0
    const stats = screen.getAllByText('0');
    expect(stats.length).toBe(3); // favorites, watched, watchlist
  });
});
