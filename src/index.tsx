'use strict';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import "./index.scss";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import ShaderDropClient from './components/Client';
import ShaderDropDrag from "./components/Drag";

function Stuff() {
  return (
    <ul>
      <li>
        {/*
         // @ts-ignore */}
        <Link to="/scanner">Scanner</Link>
      </li>
      <li>
        {/*
         // @ts-ignore */}
        <Link to="/drop">Dropper</Link>
      </li>
    </ul>
  );
}

class ShaderDropSwitch extends React.Component<{},{}> {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <Router>
        <Switch>
          <Route path="/scanner">
            <ShaderDropDrag/>
          </Route>
          <Route path="/drop">
            <ShaderDropClient/>
          </Route>
          <Route path="/">
            <Stuff/>
          </Route>
        </Switch>
      </Router>
    );
  }
}
/* Prevent Opening of Dropped Files */
document.addEventListener("dragover", (event) => event.preventDefault());
document.addEventListener("dragenter", (event) => event.preventDefault());
document.addEventListener("drop", (event) => event.preventDefault());

ReactDOM.render(<ShaderDropSwitch/>, document.getElementById('root'));
