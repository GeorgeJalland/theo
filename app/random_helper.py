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
        self._weights = self._calculate_weights()
        self._cumulative_probabilities = self._calculate_cumulative_probablities()

    def get_random_number(self):
        return self._get_random_number_from_random_range()

    def _create_ranges(self) -> list[tuple[int, int]]:
        exclude = self._exclude
        random_ranges = []

        prev = 0
        for curr in exclude + [self._max + 1]:
            if curr - prev > 1:
                random_ranges.append((prev+1, curr-1))
            prev = curr

        return random_ranges

    def _calculate_weights(self) -> list[int]:
        weights = []
        for start, end in self._random_ranges:
            weights.append(end - start + 1)
        return weights

    def _calculate_cumulative_probablities(self) -> list[float]:
        probabilities = []
        for weight in self._weights:
            probabilities.append(weight / (self._max - len(self._exclude)))
        return list(accumulate(probabilities))
    
    def _get_random_number_from_random_range(self) -> int:
        return random.randint(*self._get_random_range())
    
    def _get_random_range(self) -> tuple[int, int]:
        index = bisect.bisect(self._cumulative_probabilities, random.random())
        return self._random_ranges[index]

if __name__ == "__main__":
    randomGen = Random(max=6, exclude=[1, 2, 3])
    print(f"ranges: {randomGen._random_ranges}")
    print(f"cum: {randomGen._cumulative_probabilities}")
    print(f"weights: {randomGen._weights}")
    for i in range(10):
        print(f"random number: {randomGen.get_random_number()}")
