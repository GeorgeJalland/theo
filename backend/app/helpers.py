import random
import bisect
import json
from typing import Type
from itertools import accumulate

class Random:
    # need to unit test this and add docstrings, also add print function or equivalent to see properties
    # need to restructure methods to be less modular so can read the logic better, at least one function which calls multiple others

    def __init__(self, max: int, exclude: list) -> None:
        self._max = max
        self._exclude = sorted(exclude)
        self._random_ranges = self._create_ranges()
        self._cumulative_probabilities = self._calculate_cumulative_probablities()

    def get_random_number(self):
        index = bisect.bisect(self._cumulative_probabilities, random.random())
        select_range = self._random_ranges[index]
        return random.randrange(*select_range)

    def _create_ranges(self) -> list[tuple[int, int]]:
        exclude = self._exclude
        random_ranges = []

        prev = 0
        for curr in exclude + [self._max + 1]:
            if curr - prev > 1:
                random_ranges.append((prev+1, curr))
            prev = curr

        return random_ranges

    def _calculate_cumulative_probablities(self) -> list[float]:
        probabilities = []
        total = self._max - len(self._exclude)
        for start, end in self._random_ranges:
            weight = end - start
            probabilities.append(weight / total)
        return list(accumulate(probabilities))
    
class SetQueue():
    """A queue object with constant time lookup

    Object maintains a queue and a set of the same values allowing queue FIFO properties
    as well as allow constant time, O(1), lookups using the set
    """
    def __init__(self, max_size: int, values_queue: list = list()):
        if len(values_queue) > max_size:
            raise ValueError("values_queue length must not exceed max_size")
        self.max_size = max_size
        self.values_set = set(values_queue)
        self.values_queue = values_queue

    @staticmethod
    def deserialise(json_string: str) -> Type["SetQueue"]:
        return SetQueue(**json.loads(json_string))

    def serialise(self) -> str:
        return json.dumps({"max_size": self.max_size, "values_queue": self.values_queue})
    
    def append(self, value: int) -> None:
        if len(self.values_set) >= self.max_size:
            self.pop()
        if value not in self.values_set:
            self.values_set.add(value)
            self.values_queue.append(value)

    def pop(self) -> int:
        popped_value = self.values_queue.pop(0)
        self.values_set.remove(popped_value)
        return popped_value

    def __len__(self):
        return len(self.values_set)

    def __contains__(self, value: int):
        return value in self.values_set

    def __repr__(self):
        return repr(self.values_queue)

if __name__ == "__main__":
    # randomGen = Random(max=6, exclude=[1, 2, 3])
    # print(f"ranges: {randomGen._random_ranges}")
    # print(f"cum: {randomGen._cumulative_probabilities}")
    # for i in range(10):
    #     print(f"random number: {randomGen.get_random_number()}")
    s = SetQueue(max_size=5, values_queue=[1,2,3,4,5])
    s.append(9)
    s.append(7)
    print(s)
    print(7 in s)
    x = s.serialise()
    print(x)
    t = SetQueue.deserialise(x)
    print(t)
    print(1 in t)
    print(len(t))
    print(t.pop())
    print(t)
    print(t.values_set)