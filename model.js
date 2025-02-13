class MCDCModel {
    constructor() {
        this.variables = [];
        this.decisionFunction = null;
        this.truthTable = [];
        this.independencePairs = new Map();
        this.minimalTestCases = [];
        this.coverageValid = false;
    }

    generateTruthTable() {
        const combinations = [];
        const count = this.variables.length;
        const total = 2 ** count;

        for (let i = 0; i < total; i++) {
            const combination = {};
            for (let j = 0; j < count; j++) {
                combination[this.variables[j]] = Boolean((i >> (count - 1 - j)) & 1);
            }
            combination.decision = this.decisionFunction(...this.variables.map(v => combination[v]));
            combinations.push(combination);
        }
        this.truthTable = combinations;
        return combinations;
    }

    findIndependencePairs() {
        const pairsMap = new Map();
        
        this.variables.forEach(variable => {
            const pairs = [];
            
            for (let i = 0; i < this.truthTable.length; i++) {
                for (let j = i + 1; j < this.truthTable.length; j++) {
                    const tc1 = this.truthTable[i];
                    const tc2 = this.truthTable[j];
                    
                    if (this.isIndependentPair(tc1, tc2, variable)) {
                        pairs.push({
                            testCases: [tc1, tc2],
                            indices: [i, j]
                        });
                    }
                }
            }
            
            pairsMap.set(variable, pairs);
        });
        
        this.independencePairs = pairsMap;
        return pairsMap;
    }

    isIndependentPair(tc1, tc2, targetVar) {
        let onlyTargetChanged = false;
        let otherVarsSame = true;
        
        for (const varName of Object.keys(tc1)) {
            if (varName === 'decision') continue;
            
            if (varName === targetVar) {
                if (tc1[varName] !== tc2[varName]) {
                    onlyTargetChanged = true;
                }
            } else {
                if (tc1[varName] !== tc2[varName]) {
                    otherVarsSame = false;
                    break;
                }
            }
        }
        
        return onlyTargetChanged && 
               otherVarsSame && 
               tc1.decision !== tc2.decision;
    }

    findMinimumTestCases() {
        const maxTries = 500;
        const n = this.independencePairs.size;  // Number of variables in the boolean condition
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
                // Shuffle the array of pairs.
                const shuffledPairs = shuffle([...pairs]);
                let bestPair = null;
                let minNewTests = Infinity;
                // Loop through the pairs.
                for (const pair of shuffledPairs) {
                    // Count how many new test indices this pair would add.
                    const newTests = pair.indices.filter(i => !selectedTestCases.has(i)).length;
                    if (newTests < minNewTests) {
                        bestPair = pair;
                        minNewTests = newTests;
                        // Smart stopping: if no new tests are needed, we can break early.
                        if (minNewTests === 1) {
                            break;
                        }
                    }
                }
                if (bestPair) {
                    bestPair.indices.forEach(i => selectedTestCases.add(i));
                }
            });
    
            // Check if we've reached the optimal size.
            if (selectedTestCases.size === optimalSize) {
                bestSolution = selectedTestCases;
                break;
            }
            // Optionally, if this iteration yields a better (i.e. smaller) solution than any previous, we keep it.
            if (!bestSolution || selectedTestCases.size < bestSolution.size) {
                bestSolution = selectedTestCases;
            }
        }
    
        // Map the indices to the actual test cases.
        this.minimalTestCases = Array.from(bestSolution).map(i => this.truthTable[i]);
        return this.minimalTestCases;
    }
      

    verifyCoverage() {
        // Check for each variable if there's an independent pair that toggles it
        const allVariablesSatisfied = this.variables.every(variable => {
            let foundPair = false;
            const testCases = this.minimalTestCases;
                
            for (let i = 0; i < testCases.length; i++) {
                for (let j = i + 1; j < testCases.length; j++) {
                    const tc1 = testCases[i];
                    const tc2 = testCases[j];
                    
                    // Check that the target variable changes and decision outcome changes
                    if (tc1[variable] !== tc2[variable] && tc1.decision !== tc2.decision) {
                        // Ensure all other variables remain the same
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
        
        // Also check that overall decision coverage is present
        const decisionCoverage = this.minimalTestCases.some(tc => tc.decision) &&
                                 this.minimalTestCases.some(tc => !tc.decision);
        
        this.coverageValid = allVariablesSatisfied && decisionCoverage;
        return this.coverageValid;
    }    
}
