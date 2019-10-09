

// add dynaimc getter
if (isUndefined(Object.getOwnPropertyDescriptor(model, 'locationOidView'))) {
  Object.defineProperty(model, 'locationOidView', {
    get() {
      return location.retailerId;
    }
  });
}


// display json
jsonstring = JSON.stringify(o, null, 2)
html = `<h6  style=" white-space: pre;"  ng-bind-html="jsonstring'> </h6>`
