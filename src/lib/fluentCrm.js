// Server-only. Adds/updates a contact in the shared FluentCRM (same WP/CRM
// installation used by next-city). List ids: 3 = users, 4 = vendors.
export async function addToFluentCrm(email, name, listId, additionalFields = null, detachListId = null) {
  try {
    const { fluentUser, fluentPassword } = JSON.parse(process.env.FLUENTCRM_PRIVATE_KEYS);

    let payload = {
      email,
      first_name: name,
      last_name: '',
      status: 'subscribed',
      lists: listId ? [parseInt(listId, 10)] : [],
      custom_values: { display_name: name },
    };

    if (detachListId) {
      payload.detach_lists = [parseInt(detachListId, 10)];
    }

    if (additionalFields) {
      payload.custom_values = { display_name: name, ...additionalFields };
    }

    const response = await fetch(`${process.env.FLUENTCRM_WP_DOMAIN}/wp-json/fluent-crm/v2/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${fluentUser}:${fluentPassword}`).toString('base64'),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add to FluentCRM contact list:', error);
    return { success: false, error: error.message };
  }
}
