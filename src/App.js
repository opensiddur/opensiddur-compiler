import React from 'react'
import {BrowserRouter as Router, Link, Redirect, Route, Switch} from "react-router-dom"
import Chooser from "./Chooser"
import Viewer from "./Viewer"
import './App.css';
import logo from "./img/open-siddur-logo.png"

function App() {

  return (
    <Router>
      <nav className="Header">
        <ul>
          <li>
            <Link to="/">
              <img alt="Open Siddur Logo" src={logo}/>
            </Link>
          </li>
          <li>
            <Link to="/">Choose</Link>
          </li>
        </ul>
      </nav>

      <div className="App">
        <Switch>
          <Route exact path="/">
            <Chooser/>
          </Route>
          <Route path="/viewer/:document">
            <Viewer/>
          </Route>
          <Route>
            <Redirect to="/"/>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
