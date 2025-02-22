# python-generate-init-assignments README

This extension is designed to automatically generate `self.xxx = xxx` assignments in the `__init__` method of Python classes based on the method's parameters. It simplifies the process of initializing instance variables, especially for classes with many parameters.

## Features

### Automatic Initialization Assignment Generation
When the command is invoked, the extension reads the current Python file's context and identifies the `__init__` method of the class where the cursor is located. It then generates `self.xxx = xxx` assignments for all parameters in the `__init__` method, excluding `self`, `*args`, and `**kwargs`.

### Support for Complex Parameter Types
The extension handles various parameter types, including:
- Simple parameters (e.g., `a`, `b`)
- Typed parameters (e.g., `b: int`)
- Default values (e.g., `c=1`, `d: int = 1`)
- Complex default values (e.g., `e="1=(2,3=){#[:}]"`, `f=(2, 3)`)
- Multi-line parameter definitions

### Context-Aware
The extension only generates assignments when the cursor is inside an `__init__` method. It ignores other methods and non-`__init__` contexts.

### Example Usage

#### Input
```python
class ExampleClass1:
    def __init__(self, a, b:int, c=1, d:int=1, *args, **kwargs):
        pass
```

#### Output
```python
class ExampleClass1:
    def __init__(self, a, b:int, c=1, d:int=1, *args, **kwargs):
        self.a = a
        self.b = b
        self.c = c
        self.d = d
        pass
```

#### Input (Multi-line Parameters)
```python
class ExampleClass2:
    def __init__(
            self, 
            a, b:int, 
            c=1, #d:int=1, 
            *args, **kwargs
    ):
        pass
```

#### Output
```python
class ExampleClass2:
    def __init__(
            self, 
            a, b:int, 
            c=1, #d:int=1, 
            *args, **kwargs
    ):
        self.a = a
        self.b = b
        self.c = c
        pass
```

#### Input (Complex Default Values)
```python
class ExampleClass3:
    def __init__(
            self, 
            aa, ba:int, 
            ca:Callable[[Tuple[int,int]], int], 
            da="1=(2,3=){#[:}]", # some comments
            ea=(2,3), # some comments
            *args, **kwargs
    ):
        pass
```

#### Output
```python
class ExampleClass3:
    def __init__(
            self, 
            aa, ba:int, 
            ca:Callable[[Tuple[int,int]], int], 
            da="1=(2,3=){#[:}]", # ??? 
            ea=(2,3), # ???
            *args, **kwargs
    ):
        self.aa = aa
        self.ba = ba
        self.ca = ca
        self.da = da
        self.ea = ea
        pass
```

## Installation
1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
3. Search for "python-generate-init-assignments".
4. Click the Install button.

## Usage
1. Open a Python file in Visual Studio Code.
2. Place the cursor inside the `__init__` method of a class.
3. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
4. Search for and select the command `Generate Init Assignments`.
5. The extension will automatically generate `self.xxx = xxx` assignments for all parameters in the `__init__` method.

> ### Note
> - The extension does not handle nested classes or functions within the `__init__` method.
