import React from 'react';
import logo from './logo.svg';
import './App.css';

import DiscoveryList from './DiscoveryList'

function App() {
  return (
    <div className="App">
      <DiscoveryList api="original" q="" />
    </div>
  );
}

export default App;
