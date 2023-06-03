
1. javascript won't look for global if there is local defined

```
 var x = 21;
var girl = function () {
    console.log(x);
    var x = 20;
};
girl (); - > UNDEFINED
```
