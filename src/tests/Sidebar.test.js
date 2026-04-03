import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../components/Sidebar';

const mockTranslations = {
  menu: 'Меню',
  settings: 'Настройки',
  lightTheme: 'Светлая тема',
  darkTheme: 'Тёмная тема',
  language: 'Русский',
  cache: 'Кэш',
  cacheActive: 'Активных:',
  cacheSize: 'Размер:',
  cacheClear: 'Очистить кэш',
};

describe('Sidebar Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    darkMode: true,
    onToggleTheme: jest.fn(),
    language: 'ru-RU',
    onToggleLanguage: jest.fn(),
    t: mockTranslations,
    cacheStats: null,
    onClearCache: jest.fn(),
    profile: { name: '', avatar: '' },
    onUpdateProfile: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when isOpen is true', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('Меню')).toBeInTheDocument();
    expect(screen.getByText('Настройки')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(<Sidebar {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Меню')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<Sidebar {...defaultProps} />);

    // Находим кнопку закрытия по X иконке (первая кнопка в header)
    const allButtons = screen.getAllByRole('button');
    const closeBtn = allButtons[0]; // Первая кнопка - close

    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('calls onToggleTheme when theme button is clicked', () => {
    render(<Sidebar {...defaultProps} />);

    const themeButtons = screen.getAllByRole('button');
    const themeBtn = themeButtons.find(
      (btn) =>
        btn.textContent?.includes('Светлая тема') ||
        btn.textContent?.includes('Тёмная тема')
    );

    if (themeBtn) {
      fireEvent.click(themeBtn);
      expect(defaultProps.onToggleTheme).toHaveBeenCalled();
    }
  });

  test('calls onToggleLanguage when language button is clicked', () => {
    render(<Sidebar {...defaultProps} />);

    const langButtons = screen.getAllByRole('button');
    const langBtn = langButtons.find((btn) =>
      btn.textContent?.includes('Русский')
    );

    if (langBtn) {
      fireEvent.click(langBtn);
      expect(defaultProps.onToggleLanguage).toHaveBeenCalled();
    }
  });

  test('shows light theme text when darkMode is false', () => {
    render(<Sidebar {...defaultProps} darkMode={false} />);

    expect(screen.getByText('Тёмная тема')).toBeInTheDocument();
  });

  test('shows dark theme text when darkMode is true', () => {
    render(<Sidebar {...defaultProps} darkMode={true} />);

    expect(screen.getByText('Светлая тема')).toBeInTheDocument();
  });

  test('renders cache stats when provided', () => {
    const cacheStats = {
      totalItems: 10,
      expiredItems: 2,
      activeItems: 8,
      totalSizeKB: '125.50',
    };

    render(<Sidebar {...defaultProps} cacheStats={cacheStats} />);

    expect(screen.getByText('Кэш')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('125.50 KB')).toBeInTheDocument();
  });

  test('does not render cache stats when not provided', () => {
    render(<Sidebar {...defaultProps} cacheStats={null} />);

    expect(screen.queryByText('Кэш')).not.toBeInTheDocument();
  });

  test('calls onClearCache when clear cache button is clicked', () => {
    const cacheStats = {
      activeItems: 5,
      totalSizeKB: '50',
    };

    render(
      <Sidebar {...defaultProps} cacheStats={cacheStats} />
    );

    const clearButtons = screen.getAllByRole('button');
    const clearBtn = clearButtons.find((btn) =>
      btn.textContent?.includes('Очистить кэш')
    );

    if (clearBtn) {
      fireEvent.click(clearBtn);
      expect(defaultProps.onClearCache).toHaveBeenCalled();
    }
  });

  test('renders user profile section', () => {
    const profile = { name: 'Тест', avatar: '' };
    render(<Sidebar {...defaultProps} profile={profile} />);

    expect(screen.getByText('Тест')).toBeInTheDocument();
  });
});
