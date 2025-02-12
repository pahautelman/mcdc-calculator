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
    // Display parsing results
    resultContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">Parsed Successfully</h3>
        <p class="text-gray-600">Variables: ${parsed.variables.join(', ')}</p>
        <p class="text-gray-600">Sample Evaluation (All true): 
          ${parsed.decisionFunction(...parsed.variables.map(() => true))}
        </p>
      </div>
    `;
  } catch (error) {
    showError(error.message);
  }
});

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
