class MCDCView {
    constructor() {
        this.form = document.getElementById('mainForm');
        this.editorContainer = document.getElementById('editorContainer');
        this.resultContainer = document.getElementById('resultContainer');
        this.initializeEditor();
        this.setupEventListeners();
    }

    initializeEditor() {
        this.editor = CodeMirror(this.editorContainer, {
            lineNumbers: true,
            placeholder: "Enter expression (e.g., (A and B) or not C)",
            extraKeys: {
                "Enter": (cm) => {
                    const cursor = cm.getCursor();
                    const line = cm.getLine(cursor.line);
                    const indent = line.match(/^\s*/)[0];
                    cm.replaceSelection("\n" + indent);
                }
            },
            autoCloseBrackets: true,
            viewportMargin: Infinity,
            inputStyle: 'textarea',
            spellcheck: false,
        });
    }

    setupEventListeners() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const expression = this.editor.getValue().trim();
            
            if (!expression) {
                this.showError('Please enter a boolean expression');
                return;
            }

            this.showLoading();
            try {
                await this.onSubmit(expression);
            } catch (error) {
                this.showError(error.message);
            }
        });
    }

    setSubmitHandler(handler) {
        this.onSubmit = handler;
    }

    showLoading() {
        this.resultContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6 text-gray-600">
                Calculating MC/DC coverage...
                <div class="mt-4 animate-pulse">Processing...</div>
            </div>
        `;
        this.resultContainer.classList.remove('hidden');
    }

    showError(message) {
        this.editorContainer.classList.add('border-red-500');
        this.editorContainer.focus();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-600 text-sm mt-2';
        errorDiv.textContent = message;

        this.editorContainer.parentNode.appendChild(errorDiv);
        setTimeout(() => {
            this.editorContainer.classList.remove('border-red-500');
            errorDiv.remove();
        }, 5000);
    }

    displayResults(results) {
        this.resultContainer.innerHTML = '';
        
        this.createSection('Minimal Test Cases', 
            content => this.renderMinimalTestCases(content, results.minimalTestCases, results.variables), 
            true
        );
        
        this.createSection('Truth Table', 
            content => this.renderTruthTable(content, results.truthTable)
        );
        
        this.createSection('Independence Pairs', 
            content => this.renderIndependencePairs(content, results.independencePairs, results.variables)
        );
        
        this.createSection('Coverage Verification', 
            content => this.renderCoverageVerification(content, results.coverageValid), 
            true
        );

        this.resultContainer.classList.remove('hidden');
    }

    createSection(title, contentFn, expanded = false) {
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
        this.resultContainer.appendChild(section);
    }

    renderMinimalTestCases(container, testCases, variables) {
        if (testCases.length === 0) {
            container.innerHTML = `<p class="text-red-500">No valid test cases found</p>`;
            return;
        }
        
        const list = document.createElement('div');
        list.className = 'space-y-2';
        
        testCases.forEach((testCase, index) => {
            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-3 rounded-md';
            div.innerHTML = `
                <span class="font-mono text-sm">Test ${index + 1}:</span>
                ${variables.map(v => `
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
        container.appendChild(list);    
    }

    renderTruthTable(container, table) {
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

    renderIndependencePairs(container, pairs, variables) {
        const pairsContainer = document.createElement('div');
        pairsContainer.className = 'space-y-4';
        
        variables.forEach(variable => {
            const variablePairs = pairs.get(variable) || [];
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
                                        ${Object.entries(tc)
                                            .filter(([k]) => k !== 'decision')
                                            .map(([k, v]) => `
                                                <span class="px-1 ${v ? 'text-green-600' : 'text-red-600'}">
                                                    ${k}: ${v}
                                                </span>
                                            `).join('')}
                                    </div>
                                `).join('<span class="text-gray-400">→</span>')}
                            </div>
                        </div>
                    `).join('')
                }
            `;
            pairsContainer.appendChild(card);
        });
        container.appendChild(pairsContainer);
    }

    renderCoverageVerification(container, isValid) {
        const status = isValid ? 
            '<span class="text-green-600">✓ All coverage requirements met</span>' :
            '<span class="text-red-600">✗ Coverage requirements not met</span>';
        
        container.innerHTML = `
            <div class="bg-gray-50 p-4 rounded-md">
                <div class="font-medium mb-2">Verification Status:</div>
                <div>${status}</div>
            </div>
        `;
    }
}
