import React from 'react';
import logo from './logo.svg';
import './App.css';
import  Example from './dragcomponent/Example';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'


function App() {
  return (
    <DndProvider backend={HTML5Backend}>
    <Example />
  </DndProvider>
  );
}

export default App;
