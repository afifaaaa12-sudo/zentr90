By definition, a **prime number** is a natural number greater than 1 that has exactly two factors: **1 and itself**.

Here is a JavaScript function that checks if a number is prime. If it is prime, it returns an array containing its factors (`1` and the number); otherwise, it returns `false`.

```javascript
function getPrimeFactors(num) {
    // 1. Numbers less than or equal to 1 are not prime
    if (num <= 1) return false;

    // 2. Optimization: Check for 2 separately
    if (num === 2) return [1, 2];

    // 3. Check for divisibility from 2 up to the square root of the number
    // We only need to check up to the square root for efficiency
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) {
            // If it is divisible by any number here, it's not prime
            return false; 
        }
    }

    // 4. If no divisors were found, it is prime
    return [1, num];
}

// --- Examples ---
console.log(getPrimeFactors(7));   // Output: [1, 7]
console.log(getPrimeFactors(13));  // Output: [1, 13]
console.log(getPrimeFactors(10));  // Output: false
console.log(getPrimeFactors(1));   // Output: false
console.log(getPrimeFactors(2));   // Output: [1, 2]
```

### How it works:
1.  **Input Validation:** It first checks if the number is less than or equal to 1, as prime numbers must be greater than 1.
2.  **The Loop:** It loops from 2 up to the square root of the number (`Math.sqrt(num)`). 
    *   *Why square root?* If a number $n$ has a factor larger than its square root, it must also have a corresponding factor smaller than its square root. This makes the code much faster for large numbers.
3.  **Divisibility Check:** If `num % i === 0` is true at any point, it means the number has a divisor other than 1 and itself, so it returns `false`.
4.  **The Result:** If the loop finishes without finding a divisor, the number is prime, and the function returns the factors `[1, num]`.

### Usage Tip:
Since an array is "truthy" and `false` is "falsy" in JavaScript, you can use this function directly in an `if` statement:

```javascript
let result = getPrimeFactors(17);

if (result) {
    console.log("It is prime! Factors are: " + result.join(", "));
} else {
    console.log("It is not a prime number.");
}
```