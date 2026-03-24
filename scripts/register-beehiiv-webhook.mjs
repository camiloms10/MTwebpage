const apiKey = process.env.BEEHIIV_API_KEY;
const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
const baseUrl = process.env.BEEHIIV_WEBHOOK_BASE_URL;
const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;

if (!apiKey || !publicationId || !baseUrl || !sharedSecret) {
	console.error("Faltan BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID, BEEHIIV_WEBHOOK_BASE_URL o WEBHOOK_SHARED_SECRET.");
	process.exit(1);
}

const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
const webhookUrl = `${normalizedBaseUrl}/api/beehiiv-webhook?token=${encodeURIComponent(sharedSecret)}`;
const desiredEvents = ["post.sent", "post.updated"];

async function fetchJson(url, options = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			...(options.headers || {})
		}
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Beehiiv respondio ${response.status}: ${body}`);
	}

	return response.json();
}

async function main() {
	const listUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks`;
	const existing = await fetchJson(listUrl);
	const items = Array.isArray(existing.data) ? existing.data : [];

	const duplicate = items.find((item) => {
		if (item.url !== webhookUrl) return false;
		const eventTypes = Array.isArray(item.event_types) ? item.event_types.slice().sort().join(",") : "";
		return eventTypes === desiredEvents.slice().sort().join(",");
	});

	if (duplicate) {
		console.log(`Webhook ya existe: ${duplicate.id}`);
		return;
	}

	const created = await fetchJson(listUrl, {
		method: "POST",
		body: JSON.stringify({
			url: webhookUrl,
			event_types: desiredEvents,
			description: "Trigger GitHub sync when a Beehiiv post is sent or updated."
		})
	});

	console.log(`Webhook creado: ${created.data && created.data.id ? created.data.id : "sin id"}`);
	console.log(`URL: ${webhookUrl}`);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
