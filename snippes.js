

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

// make sure $viewValue is positive interger
const parsed = parseInt($viewValue);
if (isNaN(parsed)) {
  if (isString($viewValue)) {
    model.noOfTellersToCreate = $viewValue.replace(/\D+/g, '');
  }
} else {
  if (parsed === 0) {
    model.noOfTellersToCreate = void 0;
    $viewValue = void 0;
  }
  if (parsed < 0) {
    model.noOfTellersToCreate = Math.abs(parsed);
    $viewValue == Math.abs(parsed);
  }
  if (parsed > MAX_CLERKS_TO_ADD) {
    model.noOfTellersToCreate = MAX_CLERKS_TO_ADD;
  }
