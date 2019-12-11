'use strict';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import "./index.scss";

import ShaderDropClient from "./components/Client";

/* Prevent Opening of Dropped Files */
document.addEventListener("dragover", (event) => event.preventDefault());
document.addEventListener("dragenter", (event) => event.preventDefault());
document.addEventListener("drop", (event) => event.preventDefault());

ReactDOM.render(<ShaderDropClient/>, document.getElementById('root'));
