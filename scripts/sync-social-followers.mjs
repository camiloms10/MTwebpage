import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputFile = path.join(projectRoot, "data", "social-followers.json");

function env(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function integerEnv(name) {
	const value = env(name);
	if (!value) return null;
	const parsed = Number(value.replace(/,/g, ""));
	if (!Number.isFinite(parsed)) {
		throw new Error(`La variable ${name} no es un numero valido.`);
	}
	return Math.round(parsed);
}

async function fetchJson(url, options = {}) {
	const response = await fetch(url, options);
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Fallo ${response.status} en ${url}: ${body}`);
	}
	return response.json();
}

async function readExistingPayload() {
	try {
		const raw = await readFile(outputFile, "utf8");
		return JSON.parse(raw);
	} catch (error) {
		if (error && error.code === "ENOENT") {
			return {
				updatedAt: null,
				platforms: {}
			};
		}
		throw error;
	}
}

function ensurePlatform(payload, key, label) {
	const existing = payload.platforms[key] || {};
	payload.platforms[key] = {
		label: existing.label || label,
		followers: typeof existing.followers === "number" ? existing.followers : 0,
		source: existing.source || "manual",
		lastCheckedAt: existing.lastCheckedAt || null,
		status: existing.status || "unknown"
	};
	return payload.platforms[key];
}

async function syncYoutube() {
	const apiKey = env("YOUTUBE_API_KEY");
	const channelId = env("YOUTUBE_CHANNEL_ID");
	const handle = env("YOUTUBE_HANDLE");
	if (!apiKey || (!channelId && !handle)) return null;

	const url = new URL("https://www.googleapis.com/youtube/v3/channels");
	url.searchParams.set("part", "statistics");
	url.searchParams.set("key", apiKey);
	if (channelId) {
		url.searchParams.set("id", channelId);
	} else {
		url.searchParams.set("forHandle", handle);
	}

	const data = await fetchJson(url.toString());
	const item = Array.isArray(data.items) ? data.items[0] : null;
	const count = Number(item?.statistics?.subscriberCount);
	if (!Number.isFinite(count)) {
		throw new Error("YouTube no devolvio subscriberCount.");
	}

	return {
		followers: count,
		source: "youtube-api",
		detail: channelId ? `channel ${channelId}` : `handle ${handle}`
	};
}

async function syncFacebook() {
	const accessToken = env("META_ACCESS_TOKEN");
	const pageId = env("FACEBOOK_PAGE_ID");
	if (!accessToken || !pageId) return null;

	const url = new URL(`https://graph.facebook.com/${pageId}`);
	url.searchParams.set("fields", "fan_count");
	url.searchParams.set("access_token", accessToken);

	const data = await fetchJson(url.toString());
	const count = Number(data.fan_count);
	if (!Number.isFinite(count)) {
		throw new Error("Facebook no devolvio fan_count.");
	}

	return {
		followers: count,
		source: "meta-graph-api",
		detail: `page ${pageId}`
	};
}

async function syncInstagram() {
	const accessToken = env("META_ACCESS_TOKEN");
	const accountId = env("INSTAGRAM_BUSINESS_ACCOUNT_ID");
	if (!accessToken || !accountId) return null;

	const url = new URL(`https://graph.facebook.com/${accountId}`);
	url.searchParams.set("fields", "followers_count");
	url.searchParams.set("access_token", accessToken);

	const data = await fetchJson(url.toString());
	const count = Number(data.followers_count);
	if (!Number.isFinite(count)) {
		throw new Error("Instagram no devolvio followers_count.");
	}

	return {
		followers: count,
		source: "instagram-graph-api",
		detail: `account ${accountId}`
	};
}

async function syncX() {
	const bearerToken = env("X_BEARER_TOKEN");
	const userId = env("X_USER_ID");
	const screenName = env("X_SCREEN_NAME");
	if (!bearerToken || (!userId && !screenName)) return null;

	const endpoint = userId
		? `https://api.x.com/2/users/${encodeURIComponent(userId)}?user.fields=public_metrics`
		: `https://api.x.com/1.1/users/show.json?screen_name=${encodeURIComponent(screenName)}`;

	const data = await fetchJson(endpoint, {
		headers: {
			Authorization: `Bearer ${bearerToken}`
		}
	});

	const count = userId
		? Number(data?.data?.public_metrics?.followers_count)
		: Number(data?.followers_count);

	if (!Number.isFinite(count)) {
		throw new Error("X no devolvio followers_count.");
	}

	return {
		followers: count,
		source: userId ? "x-api-v2" : "x-api-v1.1",
		detail: userId ? `user ${userId}` : `@${screenName}`
	};
}

async function syncTikTok() {
	const accessToken = env("TIKTOK_ACCESS_TOKEN");
	if (!accessToken) return null;

	const url = new URL("https://open.tiktokapis.com/v2/user/info/");
	url.searchParams.set("fields", "open_id,union_id,display_name,username,follower_count");

	const data = await fetchJson(url.toString(), {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	const count = Number(data?.data?.user?.follower_count);
	if (!Number.isFinite(count)) {
		throw new Error("TikTok no devolvio follower_count.");
	}

	return {
		followers: count,
		source: "tiktok-display-api",
		detail: data?.data?.user?.username || data?.data?.user?.open_id || "authorized-user"
	};
}

function buildManualOverride(platformKey) {
	const variableName = `MANUAL_${platformKey.toUpperCase()}_FOLLOWERS`;
	const value = integerEnv(variableName);
	if (value === null) return null;
	return {
		followers: value,
		source: "manual-env",
		detail: variableName
	};
}

async function resolvePlatform(config) {
	const manual = buildManualOverride(config.key);
	if (manual) {
		return manual;
	}
	return config.sync();
}

function printResult(key, status, message) {
	console.log(`[${key}] ${status}: ${message}`);
}

async function main() {
	const payload = await readExistingPayload();
	const now = new Date().toISOString();
	const platforms = [
		{ key: "x", label: "X (Twitter)", sync: syncX },
		{ key: "facebook", label: "Facebook", sync: syncFacebook },
		{ key: "instagram", label: "Instagram", sync: syncInstagram },
		{ key: "tiktok", label: "TikTok", sync: syncTikTok },
		{ key: "youtube", label: "YouTube", sync: syncYoutube }
	];

	let updatedCount = 0;

	for (const platformConfig of platforms) {
		const platform = ensurePlatform(payload, platformConfig.key, platformConfig.label);

		try {
			const result = await resolvePlatform(platformConfig);
			if (!result) {
				platform.status = "skipped";
				printResult(platformConfig.key, "skip", "sin credenciales configuradas");
				continue;
			}

			platform.followers = result.followers;
			platform.source = result.source;
			platform.lastCheckedAt = now;
			platform.status = "ok";
			if (result.detail) {
				platform.detail = result.detail;
			}
			updatedCount += 1;
			printResult(platformConfig.key, "ok", `${result.followers} seguidores`);
		} catch (error) {
			platform.status = "error";
			platform.lastCheckedAt = now;
			platform.error = error.message;
			printResult(platformConfig.key, "error", error.message);
		}
	}

	if (updatedCount > 0) {
		payload.updatedAt = now;
	}

	await writeFile(outputFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
	console.log(`Actualizado ${outputFile}. Plataformas refrescadas: ${updatedCount}.`);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
