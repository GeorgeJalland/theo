import random
import bisect
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

if __name__ == "__main__":
    randomGen = Random(max=6, exclude=[1, 2, 3])
    print(f"ranges: {randomGen._random_ranges}")
    print(f"cum: {randomGen._cumulative_probabilities}")
    for i in range(10):
        print(f"random number: {randomGen.get_random_number()}")
