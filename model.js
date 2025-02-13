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
        const requiredPairs = new Set();
        const selectedTestCases = new Set();
        
        this.independencePairs.forEach((pairs, variable) => {
            if (pairs.length > 0) {
                const firstPair = pairs[0];
                firstPair.indices.forEach(i => selectedTestCases.add(i));
                requiredPairs.add(`${variable}-${firstPair.indices.join('-')}`);
            }
        });
        
        this.minimalTestCases = Array.from(selectedTestCases).map(i => this.truthTable[i]);
        return this.minimalTestCases;
    }

    verifyCoverage() {
        const varCoverage = this.variables.every(variable => {
            const values = this.minimalTestCases.map(tc => tc[variable]);
            return values.includes(true) && values.includes(false);
        });
        
        const decisionCoverage = this.minimalTestCases.some(tc => tc.decision) && 
                               this.minimalTestCases.some(tc => !tc.decision);
        
        this.coverageValid = varCoverage && decisionCoverage;
        return this.coverageValid;
    }
}
