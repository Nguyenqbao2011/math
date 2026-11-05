/**
 * Math & Statistics Engine
 * Pure mathematical calculations for Descriptive Statistics and Basic Expression Evaluation
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StatsEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Parse a string of numbers separated by commas, spaces, tabs, or newlines.
   * Filters out invalid numbers and whitespace.
   * @param {string} input 
   * @returns {number[]}
   */
  function parseNumberList(input) {
    if (!input || typeof input !== 'string') return [];
    
    // Split by comma, whitespace, newline, semicolon
    const tokens = input.split(/[\s,;\n\r\t]+/);
    const numbers = [];

    for (let token of tokens) {
      token = token.trim();
      if (!token) continue;
      const num = Number(token);
      if (!isNaN(num) && isFinite(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  }

  /**
   * Compute comprehensive descriptive statistics on an array of numbers.
   * @param {number[]} numbers 
   * @returns {Object}
   */
  function calculateStats(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return {
        count: 0,
        sum: 0,
        mean: 0,
        median: 0,
        mode: [],
        min: 0,
        max: 0,
        range: 0,
        popVariance: 0,
        popStdDev: 0,
        sampleVariance: 0,
        sampleStdDev: 0,
        sorted: []
      };
    }

    const n = numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += numbers[i];
    }
    const mean = sum / n;

    // Median (Trung vị)
    let median = 0;
    const mid = Math.floor(n / 2);
    if (n % 2 !== 0) {
      median = sorted[mid];
    } else {
      median = (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Quartiles (Tứ phân vị) - Exclusive median method
    function medianOf(arr) {
      const len = arr.length;
      const m = Math.floor(len / 2);
      if (len % 2 !== 0) return arr[m];
      return (arr[m - 1] + arr[m]) / 2;
    }

    let q1 = 0, q2 = median, q3 = 0;
    if (n >= 2) {
      const lowerHalf = sorted.slice(0, mid);
      const upperHalf = n % 2 !== 0 ? sorted.slice(mid + 1) : sorted.slice(mid);
      q1 = medianOf(lowerHalf);
      q3 = medianOf(upperHalf);
    } else {
      q1 = sorted[0];
      q3 = sorted[0];
    }
    const iqr = q3 - q1;

    // Mode (Yếu vị)
    const frequencyMap = new Map();
    let maxFreq = 0;
    for (let num of sorted) {
      const freq = (frequencyMap.get(num) || 0) + 1;
      frequencyMap.set(num, freq);
      if (freq > maxFreq) {
        maxFreq = freq;
      }
    }

    const mode = [];
    if (maxFreq > 1 || n === 1) {
      for (let [num, freq] of frequencyMap.entries()) {
        if (freq === maxFreq) {
          mode.push(num);
        }
      }
    }

    // Variance & Standard Deviation
    let sumSqDiff = 0;
    for (let i = 0; i < n; i++) {
      const diff = numbers[i] - mean;
      sumSqDiff += diff * diff;
    }

    const popVariance = sumSqDiff / n;
    const popStdDev = Math.sqrt(popVariance);

    const sampleVariance = n > 1 ? sumSqDiff / (n - 1) : 0;
    const sampleStdDev = Math.sqrt(sampleVariance);

    return {
      count: n,
      sum,
      mean,
      median,
      mode,
      q1,
      q2,
      q3,
      iqr,
      min,
      max,
      range,
      popVariance,
      popStdDev,
      sampleVariance,
      sampleStdDev,
      sorted
    };
  }

  /**
   * Safely evaluate a basic math expression string
   * Handles: +, -, *, /, %, ^ (power), sqrt(x), parentheses
   * @param {string} expr 
   * @returns {number}
   */
  function evaluateBasic(expr) {
    if (!expr || typeof expr !== 'string') return 0;
    
    // Clean and replace operations
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/sqrt\s*\(([^)]+)\)/gi, 'Math.sqrt($1)')
      .replace(/\^/g, '**')
      .replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    // Only allow safe characters: numbers, operators, parens, Math.sqrt, decimals, spaces
    const safeRegex = /^[\d\s+\-*/().%Math.sqrt,]+$/;
    if (!safeRegex.test(sanitized)) {
      throw new Error("Biểu thức chứa ký tự không hợp lệ");
    }

    try {
      const fn = new Function(`'use strict'; return (${sanitized});`);
      const result = fn();
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error("Kết quả không xác định");
      }
      return result;
    } catch (e) {
      throw new Error("Lỗi cú pháp biểu thức");
    }
  }

  return {
    parseNumberList,
    calculateStats,
    evaluateBasic
  };
}));
