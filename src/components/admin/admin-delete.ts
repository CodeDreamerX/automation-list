interface AdminDeleteOptions {
  buttonSelector: string;
  idAttribute: string;
  nameAttribute: string;
  endpoint: string;
  entityFallbackName: string;
  errorFallbackMessage: string;
  requestKey?: string;
}

export function initAdminDeleteButtons(options: AdminDeleteOptions) {
  const {
    buttonSelector,
    idAttribute,
    nameAttribute,
    endpoint,
    entityFallbackName,
    errorFallbackMessage,
    requestKey = 'id',
  } = options;

  const deleteButtons = document.querySelectorAll(buttonSelector);

  deleteButtons.forEach(function (button) {
    button.addEventListener('click', async function () {
      const id = button.getAttribute(idAttribute);
      const name = button.getAttribute(nameAttribute) || entityFallbackName;

      if (!id) return;

      if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
        return;
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [requestKey]: id }),
        });

        const data = await response.json().catch(function () {
          return null;
        });

        if (!response.ok || !data?.success) {
          alert(`Error: ${data?.error || errorFallbackMessage}`);
          return;
        }

        window.location.reload();
      } catch (error) {
        console.error('Error deleting entity:', error);
        alert(`Error: ${errorFallbackMessage}. Please try again.`);
      }
    });
  });
}
