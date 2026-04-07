import React from 'react';
import { UserProvider } from './context/UserContext';
import AppContainer from './containers/AppContainer';
import './App.css';

/**
 * Root application component
 * Wraps app with user provider
 */
function App() {
  return (
    <UserProvider>
      <AppContainer />
    </UserProvider>
  );
}

export default App;
