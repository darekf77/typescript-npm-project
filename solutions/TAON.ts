
// Firedev.createContext({
//      imports:[childContext, UserControllers, User],
//      database: true,
//      database:  { custom config } ,
//      database:  {
//        // custom config
//      },
//      onDatabaseReady:async ({ isInsideChildContext, repoBy })=> {

//     }
//  });

// https://github.com/typestack/typedi
// https://github.com/typestack/class-transformer
// https://github.com/typestack/class-validator
// https://github.com/felixfbecker/iterare#readme
// https://blog.bitsrc.io/typescripts-reflect-metadata-what-it-is-and-how-to-use-it-fb7b19cfc7e2


export namespace peffectInject {


  // Define your class
  class MyClassForInject {
    constructor(public hola: string) { }
  }

  // Define the inject function using generics to infer the instance type
  export function inject<T>(ctor: new (...args: any[]) => T): T {
    // Create an instance of the passed class
    return new ctor(); // Here, we're providing a default value for the constructor argument
  }

  // Using the inject function
  const myClassInstance = inject(MyClassForInject);
  myClassInstance.hola;

  // At this point, myClassInstance is inferred to be of type MyClass
  console.log(myClassInstance.hola); // Output: "Default Name"
}




export namespace PerfectClassClone {


  console.clear();
  // Original class

  class MyClass {
    context = 'default-context';
    static static_context = 'default-context';

    constructor() {
      console.log(this.context);
    }

    greet() {
      console.log(`Hello from ${this.context}`);
      // also allowed static props
      const MyClassFun = this.constructor as typeof MyClass;
      console.log(`Hello from ${MyClassFun.static_context}`);
    }
  }

  // Function to clone a class and create a new extended class
  function clone<T extends { new(...args: any[]): any }>(BaseClass: T): T {
    // Return a new class that extends the base class
    return class extends BaseClass {
      // You can override prototype properties or methods here if needed
      // static properties override allowed
    };
  }

  // Cloning the class
  const MyClassExtended = clone(MyClass);

  // Overriding prototype property on the cloned class
  MyClassExtended.prototype.context = 'extended-context';

  // Testing the original and extended class
  const originalInstance = new MyClass(); // Output: default-context
  const extendedInstance = new MyClassExtended(); // Output: extended-context

  originalInstance.greet(); // Output: Hello from default-context
  extendedInstance.greet(); // Output: Hello from extended-context

  // #endregion



  // Sample classes for demonstration
}


export namespace PerfectContext {


  class User {
    constructor(heloo: string) { }
    name = 'Default User';
  }

  class UserControllers {
    control() {
      console.log("Controlling users");
    }
  }

  // The createContext function takes a config object and uses generics to infer types
  export function createContext<T, C, E>(config: { imports?: T, controllers?: C, entites?: E }) {
    return {
      imports: config.imports, // Maintain the same import structure
      enties: config.entites,
      controllers: config.controllers,
    };
  }

  // Create the context with inferred types
  export const UserContext = createContext({
    imports: { User, UserControllers },
    entites: { User },
    controllers: { UserControllers },
  });



  // Now you can use the correct types from UserContext
  console.log(UserContext.imports.User); // User class
  console.log(UserContext.imports.UserControllers); // UserControllers class

  // Example of creating instances from the context
  const userInstance = new UserContext.imports.User('heelellele');
  const uu = new UserContext.enties.User('huhuh')

  const userControllersInstance = new UserContext.imports.UserControllers();

  // Injecting to another function
  function inject<T>(constructor: new () => T): T {
    return new constructor();
  }

  const injectedUserControllers = inject(UserContext.imports.UserControllers);

  injectedUserControllers.control(); // Should print "Controlling users"

}


export namespace PerfectClassTypes {

  // Define two simple classes
  class User {
    helo() {
      console.log("Hello from User!");
    }
  }

  class Session {
    key() {
      console.log("Session key");
    }
  }

  // Define the context object that holds class constructors
  const ctx = { User, Session };

  // Define a function with appropriate TypeScript types
  function getInstances<T extends Record<string, new (...args: any[]) => any>>(obj: T): {
    [K in keyof T]: InstanceType<T[K]>;
  } {
    const instances = {} as {
      [K in keyof T]: InstanceType<T[K]>;
    };

    // Create instances for each key in the object
    for (const key in obj) {
      const Constructor = obj[key];
      if (typeof Constructor === 'function') {
        instances[key] = new Constructor() as InstanceType<T[typeof key]>;
      }
    }

    return instances;
  }

  // Use the function to get instances
  const instances = getInstances(ctx);

  // Now the types are correct
  instances.User.helo(); // Output: "Hello from User!"
  instances.Session.key(); // Output: "Session key"

  // TypeScript correctly recognizes the types
  const userType: User = instances.User; // This should work without errors
  const sessionType: Session = instances.Session; // This should also work



}


export namespace PerfectSIngleton {
  class Singleton<T> {
    private static instances = new Map<any, any>();

    public static getInstance<T>(ctor: new (...args: any[]) => T): T {
      if (!Singleton.instances.has(ctor)) {
        Singleton.instances.set(ctor, new ctor());
      }
      return Singleton.instances.get(ctor) as T;
    }
  }

}
