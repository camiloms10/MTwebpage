module.exports = async function handler(request, response) {
	response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

	if (request.method === "OPTIONS") {
		return response.status(200).end();
	}

	if (request.method !== "POST") {
		return response.status(405).json({ error: "Method not allowed." });
	}

	const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;
	const expectedToken = typeof sharedSecret === "string" ? sharedSecret.trim() : "";
	const receivedToken = String(request.query && request.query.token || "").trim();

	if (!expectedToken) {
		return response.status(500).json({ error: "Missing webhook secret." });
	}

	if (!receivedToken || receivedToken !== expectedToken) {
		return response.status(401).json({ error: "Unauthorized." });
	}

	const event = request.body || {};
	const eventType = String(event.event_type || "").trim();
	const allowedEvents = new Set(["post.sent", "post.updated"]);

	if (!allowedEvents.has(eventType)) {
		return response.status(200).json({
			ok: true,
			ignored: true,
			message: `Ignored event: ${eventType || "unknown"}`
		});
	}

	const githubToken = process.env.GITHUB_ACTIONS_TRIGGER_TOKEN;
	const repoOwner = process.env.GITHUB_REPO_OWNER;
	const repoName = process.env.GITHUB_REPO_NAME;
	const workflowFile = process.env.GITHUB_BEEHIIV_WORKFLOW_FILE || "sync-beehiiv.yml";
	const workflowRef = process.env.GITHUB_BEEHIIV_WORKFLOW_REF || "main";

	if (!githubToken || !repoOwner || !repoName) {
		return response.status(500).json({ error: "Missing GitHub dispatch configuration." });
	}

	const dispatchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;
	const dispatchResponse = await fetch(dispatchUrl, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${githubToken}`,
			Accept: "application/vnd.github+json",
			"Content-Type": "application/json",
			"User-Agent": "madrid-total-beehiiv-webhook"
		},
		body: JSON.stringify({
			ref: workflowRef,
			inputs: {
				event_type: eventType,
				post_id: event.data && event.data.id ? String(event.data.id) : "",
				post_slug: event.data && event.data.slug ? String(event.data.slug) : ""
			}
		})
	});

	if (!dispatchResponse.ok) {
		const body = await dispatchResponse.text();
		return response.status(502).json({
			error: "GitHub workflow dispatch failed.",
			detail: body
		});
	}

	return response.status(200).json({
		ok: true,
		message: `Workflow triggered for ${eventType}.`
	});
};
