import React from 'react';
import { UserProvider } from './context/UserContext';
import AppContainer from './containers/AppContainer';
import './App.css';


function App() {
  return (
    <UserProvider>
      <AppContainer />
    </UserProvider>
  );
}

export default App;
