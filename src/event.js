'use strict';


export class FutureEvent {
  constructor() {
    this.callback = [];
    this.resolved = false;
    
    this.register = this.register.bind(this);
    this.fire = this.fire.bind(this);
    this.promise = this.promise.bind(this);
  }
  
  register(callback) {
    this.callback.push(callback);
  }
  
  fire(optData) {
    for (let callback of this.callback) {
      if (typeof callback === "function") {
        callback(optData);
      }
    }
    this.callback = [];
    this.resolved = true;
  }
  
  promise(timeout, timeoutMsg) {
    return new Promise((resolve, reject) => {
      if (timeout != undefined) {
        setTimeout(() => reject(timeoutMsg), timeout);
      }
      
      this.register(resolve);
    });
  }
}

export class FutureValue {
  constructor() {
    this.value = null;
    this.callback = [];
  }
  
  setValue(value) {
    this.value = value;
    for (let callback of this.callback) {
      if (typeof callback === "function") {
        callback(this.value);
      }
    }
    this.callback = [];
  }
  
  // calls callback with value once it's available
  register(callback) {
    this.callback.push(callback);
  }
  
  get(timeout, timeoutMsg) {
    return new Promise((resolve, reject) => {
      if (timeout != undefined) {
        setTimeout(() => reject(timeoutMsg), timeout);
      }
      
      if (this.value != null) {
        resolve(this.value);
        return;
      }
      
      this.register(resolve);
    });
  }
}
