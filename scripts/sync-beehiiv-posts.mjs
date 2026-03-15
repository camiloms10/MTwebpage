import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiKey = process.env.BEEHIIV_API_KEY;
const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

if (!apiKey || !publicationId) {
	console.error("Faltan BEEHIIV_API_KEY o BEEHIIV_PUBLICATION_ID.");
	process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "data");
const outputFile = path.join(outputDir, "posts.json");

async function fetchJson(url) {
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json"
		}
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Beehiiv respondio ${response.status}: ${body}`);
	}

	return response.json();
}

async function fetchText(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`No se pudo leer ${url}: ${response.status}`);
	}
	return response.text();
}

function toIsoDate(value) {
	if (!value) return null;
	if (typeof value === "number") {
		return new Date(value * 1000).toISOString();
	}
	const numeric = Number(value);
	if (!Number.isNaN(numeric) && String(value).trim() !== "") {
		return new Date(numeric * 1000).toISOString();
	}
	return value;
}

function extractDivById(html, targetId) {
	const marker = `id="${targetId}"`;
	const start = html.indexOf(marker);
	if (start === -1) return null;

	const openStart = html.lastIndexOf("<div", start);
	if (openStart === -1) return null;

	const firstClose = html.indexOf(">", openStart);
	if (firstClose === -1) return null;

	let depth = 1;
	let cursor = firstClose + 1;

	while (depth > 0 && cursor < html.length) {
		const nextOpen = html.indexOf("<div", cursor);
		const nextClose = html.indexOf("</div>", cursor);

		if (nextClose === -1) return null;

		if (nextOpen !== -1 && nextOpen < nextClose) {
			depth += 1;
			cursor = html.indexOf(">", nextOpen);
			if (cursor === -1) return null;
			cursor += 1;
			continue;
		}

		depth -= 1;
		if (depth === 0) {
			return html.slice(firstClose + 1, nextClose).trim();
		}
		cursor = nextClose + 6;
	}

	return null;
}

async function fetchPostContentFallback(post) {
	if (!post.web_url) return null;
	const html = await fetchText(post.web_url);
	return extractDivById(html, "content-blocks");
}

function normalizePost(post) {
	return {
		id: post.id,
		slug: post.slug,
		title: post.title,
		excerpt: post.subtitle || post.preview_text || "",
		cover_image_url: post.thumbnail_url || post.cover_image_url || "images/pic01.jpg",
		author: post.authors && post.authors.length ? (post.authors[0].name || post.authors[0]) : "Madrid Total",
		published_at: toIsoDate(post.publish_date || post.displayed_date || post.created),
		reading_time_minutes: post.reading_time || 4,
		tags: post.content_tags || [],
		web_url: post.web_url,
		content_html: post.content?.web || post.content?.free_web || null
	};
}

async function main() {
	const baseUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/posts`;
	const listData = await fetchJson(`${baseUrl}?limit=10&status=confirmed`);
	const posts = Array.isArray(listData.data) ? listData.data : [];

	const expandedPosts = await Promise.all(posts.map(async (post) => {
		const postData = await fetchJson(`${baseUrl}/${post.id}?expand[]=content&expand[]=authors`);
		const normalized = normalizePost(postData.data || post);
		if (!normalized.content_html) {
			normalized.content_html = await fetchPostContentFallback(normalized);
		}
		if (!normalized.content_html) {
			normalized.content_html = "<p>No pudimos recuperar el cuerpo completo de este post desde Beehiiv.</p>";
		}
		return normalized;
	}));

	const payload = {
		publication: {
			name: "EN FRIO",
			tagline: "Sincronizado desde Beehiiv"
		},
		posts: expandedPosts
	};

	await mkdir(outputDir, { recursive: true });
	await writeFile(outputFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
	console.log(`Guardado ${outputFile} con ${expandedPosts.length} posts.`);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
