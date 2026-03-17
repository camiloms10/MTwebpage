const API_BASE = "https://api.beehiiv.com/v2";

module.exports = async function handler(request, response) {
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	response.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (request.method === "OPTIONS") {
		return response.status(200).end();
	}

	if (request.method !== "POST") {
		return response.status(405).json({ error: "Method not allowed." });
	}

	const apiKey = process.env.BEEHIIV_API_KEY;
	const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

	if (!apiKey || !publicationId) {
		return response.status(500).json({ error: "Missing Beehiiv configuration." });
	}

	const email = String(request.body && request.body.email || "").trim();
	const source = String(request.body && request.body.source || "website").trim();

	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return response.status(400).json({ error: "Email invalido." });
	}

	const referringSite = request.headers.origin || request.headers.referer || "https://madridtotal.mx";

	const beehiivResponse = await fetch(`${API_BASE}/publications/${publicationId}/subscriptions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			email: email,
			reactivate_existing: true,
			send_welcome_email: true,
			utm_source: "Madrid Total",
			utm_medium: "website",
			utm_campaign: source,
			referring_site: referringSite,
			tier: "free"
		})
	});

	const payload = await beehiivResponse.json().catch(function () {
		return {};
	});

	if (!beehiivResponse.ok) {
		const message = payload && payload.errors && payload.errors[0] && payload.errors[0].message
			? payload.errors[0].message
			: payload.message || "Beehiiv subscription failed.";
		return response.status(beehiivResponse.status).json({ error: message });
	}

	return response.status(200).json({
		ok: true,
		message: "Listo. Revisa tu correo para confirmar la suscripcion."
	});
};
