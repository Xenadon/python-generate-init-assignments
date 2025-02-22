from typing import Callable, Tuple


class ExampleClass:
    def __init__(self):
        # Expected: Nothing generated 
        pass

class ExampleClass1:
    def __init__(self, a, b:int, c=1, d:int=1, *args, **kwargs):
        # Expected:
        # self.a = a
        # self.b = b
        # self.c = c
        # self.d = d
        pass
        
    def a(self, a=1, b=2):
        # Expected not to generated here
        pass        

class ExampleClass2:
    # Expected not to generated here
    def __init__(
            self, 
            a, b:int, 
            c=1, #d:int=1, 
            *args, **kwargs
    ):
        # Expected:
        # self.a = a
        # self.b = b
        # self.c = c
        pass

class ExampleClass3:

    def __init__( # some comments
            self, 
            aa, ba:int, 
            ca:Callable[[Tuple[int,int]], int], 
            da="1=(2,3=){#[:}]", # some comments 
            ea=(2,3), # some comments
            *args, **kwargs
    ): # some comments
        
        # Expected:
        # self.aa = aa
        # self.ba = ba
        # self.ca = ca
        # self.da = da
        # self.ea = ea
        pass
