document.getElementById('mainForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const expression = document.getElementById('expressionInput').value.trim();

    if (!expression) {
        showError('Please enter a boolean expression');
        return;
    }

    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 text-gray-600">
        Calculating MC/DC coverage for: <strong>${expression}</strong>
        <div class="mt-4 animate-pulse">Processing...</div>
        </div>
    `;
    resultContainer.classList.remove('hidden');

    try {
        const parsed = parseExpression(expression);
        const truthTable = generateTruthTable(parsed.variables, parsed.decisionFunction);
        const independencePairs = findIndependencePairs(truthTable, parsed.variables);
        const minTestCases = findMinimumTestCases(independencePairs, truthTable);
        const coverageValid = verifyCoverage(minTestCases, parsed.variables, truthTable);

        resultContainer.innerHTML = '';
        
        // Create expandable sections
        const createSection = (title, contentFn, expanded = false) => {
            const section = document.createElement('div');
            section.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
            
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center cursor-pointer';
            header.innerHTML = `
                <h3 class="text-lg font-semibold">${title}</h3>
                <svg class="transform transition-transform h-5 w-5 text-gray-600" 
                    style="transform: ${expanded ? 'rotate(180deg)' : 'none'}">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            `;
            
            const content = document.createElement('div');
            content.className = expanded ? 'mt-4' : 'hidden mt-4';
            contentFn(content);
            
            header.addEventListener('click', () => {
                content.classList.toggle('hidden');
                header.querySelector('svg').classList.toggle('rotate-180');
            });
            
            section.appendChild(header);
            section.appendChild(content);
            resultContainer.appendChild(section);
        };

        // Minimal Test Cases
        createSection('Minimal Test Cases', content => {
            if (minTestCases.length === 0) {
                content.innerHTML = `<p class="text-red-500">No valid test cases found</p>`;
                return;
            }
            
            const list = document.createElement('div');
            list.className = 'space-y-2';
            
            minTestCases.forEach((testCase, index) => {
                const div = document.createElement('div');
                div.className = 'bg-gray-50 p-3 rounded-md';
                div.innerHTML = `
                    <span class="font-mono text-sm">Test ${index + 1}:</span>
                    ${parsed.variables.map(v => `
                        <span class="ml-2 px-2 py-1 bg-white rounded border">
                            ${v} = ${testCase[v] ? 'true' : 'false'}
                        </span>
                    `).join('')}
                    <span class="ml-2 px-2 py-1 ${testCase.decision ? 'bg-green-100' : 'bg-red-100'}">
                        Decision: ${testCase.decision}
                    </span>
                `;
                list.appendChild(div);
            });
            content.appendChild(list);
        }, true);

        // Truth Table
        createSection('Truth Table', content => {
            displayTruthTable(truthTable, content);
        });

        // Independence Pairs
        createSection('Independence Pairs', content => {
            const container = document.createElement('div');
            container.className = 'space-y-4';
            
            parsed.variables.forEach(variable => {
                const variablePairs = independencePairs.get(variable);
                const card = document.createElement('div');
                card.className = 'bg-gray-50 p-4 rounded-md';
                
                card.innerHTML = `
                    <h4 class="font-medium mb-2">Variable: ${variable}</h4>
                    ${variablePairs.length === 0 ? 
                        '<p class="text-red-500">No independence pairs found</p>' : 
                        variablePairs.map(pair => `
                            <div class="ml-4 mb-3 last:mb-0">
                                <div class="flex items-center space-x-4">
                                    <span class="text-sm text-gray-600">Pair:</span>
                                    ${pair.testCases.map(tc => `
                                        <div class="bg-white p-2 rounded border">
                                            ${Object.entries(tc).map(([k, v]) => 
                                                k !== 'decision' ? `
                                                <span class="px-1 ${v ? 'text-green-600' : 'text-red-600'}">
                                                    ${k}: ${v}
                                                </span>` : ''
                                            ).join('')}
                                        </div>
                                    `).join('<span class="text-gray-400">→</span>')}
                                </div>
                            </div>
                        `).join('')
                    }
                `;
                container.appendChild(card);
            });
            content.appendChild(container);
        });

        // Coverage Verification
        createSection('Coverage Verification', content => {
            const status = coverageValid ? 
                '<span class="text-green-600">✓ All coverage requirements met</span>' :
                '<span class="text-red-600">✗ Coverage requirements not met</span>';
            
            content.innerHTML = `
                <div class="bg-gray-50 p-4 rounded-md">
                    <div class="font-medium mb-2">Verification Status:</div>
                    <div>${status}</div>
                </div>
            `;
        }, true);

        resultContainer.classList.remove('hidden');

    } catch (error) {
        showError(error.message);
    }
});

// Truth Table Functions
function generateTruthTable(variables, decisionFunction) {
    const combinations = [];
    const count = variables.length;
    const total = 2 ** count;

    for (let i = 0; i < total; i++) {
        const combination = {};
        for (let j = 0; j < count; j++) {
            combination[variables[j]] = Boolean((i >> (count - 1 - j)) & 1);
        }
        combination.decision = decisionFunction(...variables.map(v => combination[v]));
        combinations.push(combination);
    }
    return combinations;
}

function displayTruthTable(table, container) {
    const variables = Object.keys(table[0]).filter(k => k !== 'decision');
    const tableEl = document.createElement('table');
    tableEl.className = 'min-w-full divide-y divide-gray-200';
    
    tableEl.innerHTML = `
        <thead class="bg-gray-50">
            <tr>
                ${variables.map(v => `<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">${v}</th>`).join('')}
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Decision</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            ${table.map((row, i) => `
                <tr class="${i % 2 ? 'bg-gray-50' : ''}">
                    ${variables.map(v => `
                        <td class="px-4 py-3 text-sm font-mono text-gray-600">${row[v] ? 'true' : 'false'}</td>
                    `).join('')}
                    <td class="px-4 py-3 text-sm font-mono ${row.decision ? 'text-green-600' : 'text-red-600'}">
                        ${row.decision ? 'true' : 'false'}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(tableEl);
}

// Independence Pairs Finder
function findIndependencePairs(truthTable, variables) {
    const pairsMap = new Map();
    
    variables.forEach(variable => {
        const pairs = [];
        
        // Compare all possible pairs of test cases
        for (let i = 0; i < truthTable.length; i++) {
            for (let j = i + 1; j < truthTable.length; j++) {
                const tc1 = truthTable[i];
                const tc2 = truthTable[j];
                
                if (isIndependentPair(tc1, tc2, variable)) {
                    pairs.push({
                        testCases: [tc1, tc2],
                        indices: [i, j]
                    });
                }
            }
        }
        
        pairsMap.set(variable, pairs);
    });
    
    return pairsMap;
}

function isIndependentPair(tc1, tc2, targetVar) {
    let onlyTargetChanged = false;
    let otherVarsSame = true;
    
    // Check if only the target variable changes
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

// Minimum Test Case Solver
function findMinimumTestCases(independencePairs, truthTable) {
    const requiredPairs = new Set();
    const selectedTestCases = new Set();
    
    // Select one pair per variable (greedy algorithm)
    independencePairs.forEach((pairs, variable) => {
        if (pairs.length > 0) {
            const firstPair = pairs[0];
            firstPair.indices.forEach(i => selectedTestCases.add(i));
            requiredPairs.add(`${variable}-${firstPair.indices.join('-')}`);
        }
    });
    
    // Convert indices to actual test cases
    return Array.from(selectedTestCases).map(i => truthTable[i]);
}

// Coverage Verifier
function verifyCoverage(testCases, variables, truthTable) {
    // Check all variables have both true/false values
    const varCoverage = variables.every(variable => {
        const values = testCases.map(tc => tc[variable]);
        return values.includes(true) && values.includes(false);
    });
    
    // Check decision has both outcomes
    const decisionCoverage = testCases.some(tc => tc.decision) && 
                           testCases.some(tc => !tc.decision);
    
    return varCoverage && decisionCoverage;
}


function showError(message) {
  const input = document.getElementById('expressionInput');
  input.classList.add('border-red-500');
  input.focus();

  const errorDiv = document.createElement('div');
  errorDiv.className = 'text-red-600 text-sm mt-2';
  errorDiv.textContent = message;

  input.parentNode.appendChild(errorDiv);
  setTimeout(() => {
    input.classList.remove('border-red-500');
    errorDiv.remove();
  }, 3000);
}
