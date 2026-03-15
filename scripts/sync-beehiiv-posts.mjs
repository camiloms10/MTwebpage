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

function normalizePost(post) {
	return {
		id: post.id,
		slug: post.slug,
		title: post.title,
		excerpt: post.subtitle || post.preview_text || "",
		cover_image_url: post.thumbnail_url || post.cover_image_url || "images/pic01.jpg",
		author: post.authors && post.authors.length ? post.authors[0].name : "MadridTotal",
		published_at: post.publish_date || post.displayed_date || post.created,
		reading_time_minutes: post.reading_time || 4,
		tags: post.content_tags || [],
		web_url: post.web_url,
		content_html: post.content?.web || post.content?.free_web || "<p>Este post no incluyo contenido web expandido en la respuesta de Beehiiv.</p>"
	};
}

async function main() {
	const baseUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/posts`;
	const listData = await fetchJson(`${baseUrl}?limit=10&status=confirmed`);
	const posts = Array.isArray(listData.data) ? listData.data : [];

	const expandedPosts = await Promise.all(posts.map(async (post) => {
		const postData = await fetchJson(`${baseUrl}/${post.id}?expand[]=content&expand[]=authors`);
		return normalizePost(postData.data || post);
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
