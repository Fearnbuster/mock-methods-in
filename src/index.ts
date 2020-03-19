
type Options = {
  excludedKeys?: string[],
  excludedMethods?: any[],
  includeInheritanceChain?: boolean,
  inclusiveBreakpoint?: boolean,
  inheritanceChainBreakpoint?: Object,
  givenObjectIsPrototype?: boolean,
  proto?: Object,
  shouldMockConstructor?: boolean, 
};

/**
 * Will mock all methods within the given object based on the given options
 * @param obj 
 * @param options
 * @param options.excludedKeys - The keys of the methods that should not be mocked
 * @param options.excludedMethods - The methods that should not be mocked
 * @param options.givenObjectIsPrototype - Indicates whether or not the 
 * 'obj' parameter is a prototype or an instance. This makes it possible
 * to mock the methods on the prototype itself, causing all instances that
 * are created from it later to have mocked methods
 * @param options.includeInheritanceChain - Whether or not the parent class methods should
 * be mocked
 * @param options.inheritanceChainBreakpoint - The prototype at which the 
 * algorithm should stop marching up the prototype chain (will default to
 * the global Object type)
 * @param options.proto - The prototype that contain the methods that are 
 * to be mocked (defaults to the prototype of the given object) 
 * @param options.shouldMockConstructor - Whether or not the constructor should
 * be mocked
 */
export function mockMethodsIn(obj: Object, options?: Options): void {
  new MethodMocker(obj, options).mockMethods();
};

class MethodMocker {
  private obj: Object;

  private excludedKeys: string[];
  private excludedMethods: any[];
  private includeInheritanceChain: boolean;
  private inclusiveBreakpoint: boolean;
  private inheritanceChainBreakpoint: Object | null;
  private givenObjectIsAPrototype: boolean;
  private proto: Object;
  private shouldMockConstructor: boolean;

  constructor(obj: Object, options?: Options) {
    const {
      excludedKeys = [],
      excludedMethods = [],
      includeInheritanceChain = true,
      inclusiveBreakpoint = false,
      inheritanceChainBreakpoint = null,
      givenObjectIsPrototype = false,
      proto = this.proto = Reflect.getPrototypeOf(obj),
      shouldMockConstructor = false
    } = options || {};

    this.obj = obj;
    this.excludedKeys = excludedKeys;
    this.excludedMethods = excludedMethods;
    this.includeInheritanceChain = includeInheritanceChain;
    this.inclusiveBreakpoint = inclusiveBreakpoint;
    this.inheritanceChainBreakpoint = inheritanceChainBreakpoint;
    this.givenObjectIsAPrototype = givenObjectIsPrototype;
    this.shouldMockConstructor = shouldMockConstructor;

    if (this.givenObjectIsAPrototype) {
      this.proto = this.obj;
    }
    else {
      this.proto = proto;
    }
  }

  mockMethods() {
    if (!this.isAtLastIteration()) {
      
      const nextPrototype = Reflect.getPrototypeOf(this.proto);

      // Recursively create method mockers for each layer in the 
      // inheritance chain: 
      new MethodMocker(this.obj, {
        excludedKeys: this.excludedKeys,
        excludedMethods: this.excludedMethods,
        includeInheritanceChain: this.includeInheritanceChain,
        inclusiveBreakpoint: this.inclusiveBreakpoint,
        inheritanceChainBreakpoint: this.inheritanceChainBreakpoint || undefined,
        proto: nextPrototype,
        shouldMockConstructor: this.shouldMockConstructor
      }).mockMethods();
    }
  
    const keys = Object.getOwnPropertyNames(this.proto);
    this.mockUsingGivenKeys(keys);
  };

  private mockUsingGivenKeys(keys: string[]) {
    const castObject = this.obj as any;

    for (const key of keys) {
      if (this.shouldSkipConstructor(key)) {
        continue;
      }
  
      const property = castObject[key];
  
      if (typeof property === 'function') {
        if (this.methodShouldBeSkipped(key, property)) {
          continue;
        }
        // Catch all errors that are thrown for attempting to 
        // set read-only attributes
        try {
          castObject[key] = jest.fn(property);
        }
        catch(error) {
          continue;
        }
      }
    }
  }
  
  private shouldSkipConstructor(key: string | number | symbol): boolean {
    return (!this.shouldMockConstructor && key === 'constructor')
  }
  
  private methodShouldBeSkipped(key: string, property: any): boolean {
    if (!!this.excludedKeys.find((excludedKey) => {
      return excludedKey === key;
    })) {
      return true;
    }

    return !!this.excludedMethods.find((excludedMethod) => {
      return excludedMethod === property;
    });
  }

  /**
   * Checks if the recursive method mocking function should
   * stop calling itself
   */
  private isAtLastIteration() {
    if (!this.includeInheritanceChain) return true;

    if (this.breakpointReached()) return true;

    return this.isAtTopEndOfInheritanceChain();
  }

  private breakpointReached(): boolean {
    const nextPrototype = Reflect.getPrototypeOf(this.proto);

    if (this.inclusiveBreakpoint) {
      if (this.inheritanceChainBreakpoint === this.proto) return true;
    }
    else {
      if (this.inheritanceChainBreakpoint === nextPrototype) return true;
    }

    return false;
  }

  private isAtTopEndOfInheritanceChain(): boolean {
    // The top most prototype is always the global Object prototype,
    // after that, trying to get the prototype will result in undefined/null.
    // Therefore, if we check the prototype that is two iterations ahead, and
    // find that it is undefined/null, we know that we should stop iterating, 
    // because the methods of Object should not be mocked 
    return (Reflect.getPrototypeOf(Reflect.getPrototypeOf(this.proto)) === null);
  }
};

export function clearAllMockedMethodsIn(obj: Object): void {
  const keys = Reflect.ownKeys(obj);
  const objCast = obj as any;

  for (const key of keys) {
    const property = objCast[key];

    if (jest.isMockFunction(property)) {
      (property as jest.Mock).mockClear();
    }
  };
};
