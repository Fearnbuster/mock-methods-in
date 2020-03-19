import { mockMethodsIn }
from '../index';

class GreatGrandParent {
  public ggpMemberVariable = 'Member variable';

  public ggpMemberFunction = () => {};

  ggpMethod() {}
};

class GrandParent extends GreatGrandParent {
  public gpMemberVariable = 'Member variable';

  public gpMemberFunction = () => {};

  gpMethod() {}
};

class Parent extends GrandParent {
  public pMemberVariable = 'Member variable';

  public pMemberFunction = () => {};

  pMethod() {}
};

class Child extends Parent {
  public MemberVariable = 'Member variable';

  public MemberFunction = () => {};

  Method() {}
};

describe(mockMethodsIn, () => {
  let child:  Child;

  beforeEach(() => {
    child = new Child();
  }); 


  it('should correctly mock the methods', () => {
    mockMethodsIn(child);

    expect(jest.isMockFunction(child.Method)).toBeTruthy();
    expect(jest.isMockFunction(child.pMethod)).toBeTruthy();
    expect(jest.isMockFunction(child.gpMethod)).toBeTruthy();
    expect(jest.isMockFunction(child.ggpMethod)).toBeTruthy();
  });

  it('should not mock method variable functions', () => {
    mockMethodsIn(child);

    expect(jest.isMockFunction(child.MemberFunction)).toBeFalsy();
    expect(jest.isMockFunction(child.pMemberFunction)).toBeFalsy();
    expect(jest.isMockFunction(child.gpMemberFunction)).toBeFalsy();
    expect(jest.isMockFunction(child.ggpMemberFunction)).toBeFalsy();
  });

  it('should not mock any method inherited from the global Object', () => {
    mockMethodsIn(child);

    const castChild = child as Object;

    expect(jest.isMockFunction(castChild.hasOwnProperty)).toBeFalsy();
    expect(jest.isMockFunction(castChild.isPrototypeOf)).toBeFalsy();
    expect(jest.isMockFunction(castChild.propertyIsEnumerable)).toBeFalsy();
    expect(jest.isMockFunction(castChild.toLocaleString)).toBeFalsy();
    expect(jest.isMockFunction(castChild.toString)).toBeFalsy();
    expect(jest.isMockFunction(castChild.valueOf)).toBeFalsy();
  });

  it('should not attempt to mock non-function properties', () => {
    mockMethodsIn(child);

    expect(jest.isMockFunction(child.MemberVariable)).toBeFalsy();
    expect(jest.isMockFunction(child.pMemberVariable)).toBeFalsy();
    expect(jest.isMockFunction(child.gpMemberVariable)).toBeFalsy();
    expect(jest.isMockFunction(child.ggpMemberVariable)).toBeFalsy();
  });

  it('should mock the given objects constructor by default', () => {
    mockMethodsIn(child, { shouldMockConstructor: true });

    const constructor = getConstructorFrom(child);

    expect(jest.isMockFunction(constructor)).toBeTruthy();
  });

  it('should not mock the given objects constructor if told to not do so', () => {
    mockMethodsIn(child, {
      shouldMockConstructor: false
    });

    const constructor = getConstructorFrom(child);

    expect(jest.isMockFunction(constructor)).toBeFalsy();
  });

  it('should not mock any keys that are excluded', () => {
    mockMethodsIn(
      child, {
        excludedKeys: [
          'gpMethod',
          'pMethod',
        ]
      } 
    );

    expect(jest.isMockFunction(child.ggpMethod)).toBeTruthy();
    expect(jest.isMockFunction(child.gpMethod)).toBeFalsy();
    expect(jest.isMockFunction(child.pMethod)).toBeFalsy();
    expect(jest.isMockFunction(child.Method)).toBeTruthy();
  });

  it('should not mock any functions that are excluded', () => {
    mockMethodsIn(
      child, {
        excludedMethods: [
          child.gpMethod,
          child.pMethod,
        ]
      } 
    );

    expect(jest.isMockFunction(child.ggpMethod)).toBeTruthy();
    expect(jest.isMockFunction(child.gpMethod)).toBeFalsy();
    expect(jest.isMockFunction(child.pMethod)).toBeFalsy();
    expect(jest.isMockFunction(child.Method)).toBeTruthy();
  });

  it('should mock only the methods that are above or at the given prototype in the inheritance chain', () => {
    mockMethodsIn(child, {
      proto: GrandParent.prototype
    });

    expect(jest.isMockFunction(child.Method)).toBeFalsy();
    expect(jest.isMockFunction(child.pMethod)).toBeFalsy();
    expect(jest.isMockFunction(child.gpMethod)).toBeTruthy();
    expect(jest.isMockFunction(child.ggpMethod)).toBeTruthy();

    expect(jest.isMockFunction(child.MemberFunction)).toBeFalsy();
    expect(jest.isMockFunction(child.pMemberFunction)).toBeFalsy();
    expect(jest.isMockFunction(child.gpMemberFunction)).toBeFalsy();
    expect(jest.isMockFunction(child.ggpMemberFunction)).toBeFalsy();
  });

  it('should not mock methods in the inheritance chain when told to not do so', () => {
    mockMethodsIn(child, {
      includeInheritanceChain: false
    });

    expect(jest.isMockFunction(child.Method)).toBeTruthy();
    expect(jest.isMockFunction(child.pMethod)).toBeFalsy();
    expect(jest.isMockFunction(child.gpMethod)).toBeFalsy();
    expect(jest.isMockFunction(child.ggpMethod)).toBeFalsy();
  });

  it('should stop before the exclusive inheritance hierarchy breakpoint', () => {
    mockMethodsIn(child, {
      inheritanceChainBreakpoint: GrandParent.prototype
    });

    expect(jest.isMockFunction(child.Method)).toBeTruthy();
    expect(jest.isMockFunction(child.pMethod)).toBeTruthy();
    expect(jest.isMockFunction(child.gpMethod)).toBeFalsy();
    expect(jest.isMockFunction(child.ggpMethod)).toBeFalsy();
  });

  it('should stop at the inclusive inheritance hierarchy breakpoint', () => {
    mockMethodsIn(child, {
      inheritanceChainBreakpoint: GrandParent.prototype,
      inclusiveBreakpoint: true
    });

    expect(jest.isMockFunction(child.Method)).toBeTruthy();
    expect(jest.isMockFunction(child.pMethod)).toBeTruthy();
    expect(jest.isMockFunction(child.gpMethod)).toBeTruthy();
    expect(jest.isMockFunction(child.ggpMethod)).toBeFalsy();
  });

  it('should mock the given prototype if told to do so', () => {
    mockMethodsIn(Child.prototype, {
      givenObjectIsPrototype: true
    });

    const newChild = new Child();

    expect(jest.isMockFunction(Child.prototype.Method)).toBeTruthy();
    expect(jest.isMockFunction(Child.prototype.pMethod)).toBeTruthy();
    expect(jest.isMockFunction(Child.prototype.gpMethod)).toBeTruthy();
    expect(jest.isMockFunction(Child.prototype.ggpMethod)).toBeTruthy();

    expect(jest.isMockFunction(newChild.Method)).toBeTruthy();
    expect(jest.isMockFunction(newChild.pMethod)).toBeTruthy();
    expect(jest.isMockFunction(newChild.gpMethod)).toBeTruthy();
    expect(jest.isMockFunction(newChild.ggpMethod)).toBeTruthy();
  });
});

function getConstructorFrom(obj: Object): any {
  return obj['constructor'];
};
