'use strict';

export class FutureEvent<T> {
  callback: { (optData? : T): any }[] = [];
  resolved: boolean = false;
  constructor() {
    this.register = this.register.bind(this);
    this.fire = this.fire.bind(this);
    this.promise = this.promise.bind(this);
  }

  register(callback : { (optData? : T): any }): void {
    this.callback.push(callback);
  }
  
  // returns whether or not we found the callback
  unregister(callback : { (optData? : T): any }): boolean {
    return false; // TODO
  }

  fire(optData?: T): void {
    for (let callback of this.callback) {
      if (typeof callback === "function") {
        callback(optData);
      }
    }
    this.callback = [];
    this.resolved = true;
  }

  promise(timeout?: number, timeoutMsg?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (timeout != undefined) {
        setTimeout(() => reject(timeoutMsg), timeout);
      }

      this.register(resolve);
    });
  }
}

export class FutureValue<T> {
  value: T = null;
  callback: { (value? : T): any }[] = [];
  constructor() {
  }

  setValue(value : T): void {
    this.value = value;
    for (let callback of this.callback) {
      if (typeof callback === "function") {
        callback(this.value);
      }
    }
    this.callback = [];
  }

  // calls callback with value once it's available
  register(callback : { (value? : T): any }): void {
    this.callback.push(callback);
  }

  get(timeout?: number, timeoutMsg?: string): Promise<T> {
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
