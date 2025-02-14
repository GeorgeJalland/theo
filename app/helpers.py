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
    
class BoundedSet:
    def __init__(self, max_size: int, values_set: set = set(), values_ordered_list: list = list()):
        self.max_size = max_size
        self.values_set = values_set
        self.values_ordered_list = values_ordered_list

    # @staticmethod
    # def deserialise(json_string: str) -> Type["BoundedSet"]:
    #     return BoundedSet(**json.loads(json_string))

    # def serialise(self):
    #     test = dict(max_size=self.max_size, set = self.values_set, list = self.values_ordered_list)
    #     return json.dumps(test)
    
    def add(self, value):
        if len(self.values_set) >= self.max_size:
            self.values_set.remove(self.values_ordered_list.pop(0))
        if value not in self.values_set:
            self.values_set.add(value)
            self.values_ordered_list.append(value)

    def __contains__(self, value):
        return value in self.values_set

    def __repr__(self):
        return repr(self.values_set) + repr(self.values_ordered_list)

if __name__ == "__main__":
    # randomGen = Random(max=6, exclude=[1, 2, 3])
    # print(f"ranges: {randomGen._random_ranges}")
    # print(f"cum: {randomGen._cumulative_probabilities}")
    # for i in range(10):
    #     print(f"random number: {randomGen.get_random_number()}")
    pass
