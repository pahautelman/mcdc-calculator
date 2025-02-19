class MCDCModel {
    constructor() {
      this.variables = [];
      this.decisionFunction = null;
      this.truthTable = [];
      this.independencePairs = new Map();
      this.minimalTestCases = [];
      this.coverageValid = false;
      this.optimalSolution = false;
    }
  
    generateTruthTable() {
      const combinations = [];
      const count = this.variables.length;
      const total = 2 ** count;
      // Cache the variable names for performance.
      const vars = this.variables;
  
      for (let i = 0; i < total; i++) {
        const combination = {};
        // Build truth values for each variable using bitwise operations.
        for (let j = 0; j < count; j++) {
          // Extract bit (most significant bit first).
          combination[vars[j]] = Boolean((i >> (count - 1 - j)) & 1);
        }
        // Instead of mapping over variables each time, we use the order in 'vars'
        const args = vars.map(v => combination[v]);
        combination.decision = this.decisionFunction(...args);
        combinations.push(combination);
      }
      this.truthTable = combinations;
      return combinations;
    }
  
    findIndependencePairs() {
      const pairsMap = new Map();
      const vars = this.variables;
      const truthTable = this.truthTable;
  
      // For each target variable, group rows by the values of all other variables.
      for (const target of vars) {
        const otherVars = vars.filter(v => v !== target);
        const groups = new Map();
        const pairs = [];
  
        // Group rows by the pattern of other variables.
        truthTable.forEach((row, index) => {
          // Create a key based on the other variables' values.
          const key = otherVars.map(v => (row[v] ? '1' : '0')).join('');
          if (!groups.has(key)) {
            groups.set(key, {});
          }
          // Save the row and its index under a key based on the target's boolean value.
          groups.get(key)[row[target] ? 'true' : 'false'] = { row, index };
        });
  
        // For each group, if both values for the target exist, check the decision outcome.
        groups.forEach(group => {
          if (group.true && group.false) {
            const { row: rowTrue, index: indexTrue } = group.true;
            const { row: rowFalse, index: indexFalse } = group.false;
            if (rowTrue.decision !== rowFalse.decision) {
              pairs.push({
                testCases: [rowTrue, rowFalse],
                indices: [indexTrue, indexFalse]
              });
            }
          }
        });
  
        pairsMap.set(target, pairs);
      }
  
      this.independencePairs = pairsMap;
      return pairsMap;
    }
  
    findMinimumTestCases(maxTries = 10) {
        const n = this.independencePairs.size; // Number of variables in the boolean condition
        const optimalSize = n + 1;
        let bestSolution = null;
    
        // Helper: Fisher–Yates shuffle.
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
    
        for (let attempt = 0; attempt < maxTries; attempt++) {
            const selectedTestCases = new Set();
    
            // Get the variables, sorting by number of pairs (most restricted first)
            const sortedVars = shuffle(Array.from(this.independencePairs.entries()))
            .sort(([, pairsA], [, pairsB]) => pairsA.length - pairsB.length);
    
            // For each variable, shuffle its pairs and pick the pair that adds the fewest new test cases.
            sortedVars.forEach(([variable, pairs]) => {
                if (pairs.length === 0) {
                    return;
                }
                const shuffledPairs = shuffle([...pairs]);
                let bestPair = null;
                let minNewTests = Infinity;
                for (const pair of shuffledPairs) {
                    const newTests = pair.indices.filter(i => !selectedTestCases.has(i)).length;
                    if (newTests < minNewTests) {
                    bestPair = pair;
                    minNewTests = newTests;
                    if (minNewTests === 1) {
                        break;
                    }
                    }
                }
                if (bestPair) {
                    bestPair.indices.forEach(i => selectedTestCases.add(i));
                }
            });
    
            if (selectedTestCases.size === optimalSize) {
                bestSolution = selectedTestCases;
                break;
            }
            if (!bestSolution || selectedTestCases.size < bestSolution.size) {
                bestSolution = selectedTestCases;
            }
        }
    
        this.minimalTestCases = Array.from(bestSolution).map(i =>
            Object.assign({}, this.truthTable[i], { index: i })
        );
        return this.minimalTestCases;
    }
  
    verifyCoverage() {
      const allVariablesSatisfied = this.variables.every(variable => {
        let foundPair = false;
        const testCases = this.minimalTestCases;
  
        for (let i = 0; i < testCases.length; i++) {
          for (let j = i + 1; j < testCases.length; j++) {
            const tc1 = testCases[i];
            const tc2 = testCases[j];
            if (tc1[variable] !== tc2[variable] && tc1.decision !== tc2.decision) {
              const othersUnchanged = this.variables.every(varName => {
                if (varName === variable) return true;
                return tc1[varName] === tc2[varName];
              });
              if (othersUnchanged) {
                foundPair = true;
                break;
              }
            }
          }
          if (foundPair) break;
        }
        return foundPair;
      });
  
      const decisionCoverage = this.minimalTestCases.some(tc => tc.decision) &&
                               this.minimalTestCases.some(tc => !tc.decision);
  
      this.coverageValid = allVariablesSatisfied && decisionCoverage;
      this.optimalSolution = this.minimalTestCases.length === this.variables.length + 1;
  
      return { coverageValid: this.coverageValid, optimalSolution: this.optimalSolution };
    }
  }
  