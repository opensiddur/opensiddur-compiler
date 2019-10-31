import React from 'react';
import './App.css';

import SearchableSelectableResultsList from './SearchableSelectableResultsList'

function App() {
  const handleSelection = (result) => {
    console.log(`Selected: ${result.title}, ${result.url}`)
  }

  return (
    <div className="App">
      <SearchableSelectableResultsList api="original" selectionCallback={handleSelection} />
    </div>
  );
}

export default App;
