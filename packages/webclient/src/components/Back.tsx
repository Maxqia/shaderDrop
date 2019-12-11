import React from "react";
import { useHistory } from "react-router-dom";

export default function Back(props) {
  let history = useHistory();
  function handleClick() {
    history.goBack();
  }
  return (
    <button onClick={handleClick}>
      {props.children}
    </button>
  );
}
