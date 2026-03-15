(function () {
	var postsUrl = "data/posts.json";

	function formatDate(value) {
		if (!value) return "";
		var date = new Date(value);
		return new Intl.DateTimeFormat("es-MX", {
			day: "numeric",
			month: "long",
			year: "numeric"
		}).format(date);
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function renderFeed(data) {
		var status = document.getElementById("newsletter-status");
		var featured = document.getElementById("newsletter-featured");
		var list = document.getElementById("newsletter-list");

		if (!status || !featured || !list) return;

		var posts = Array.isArray(data.posts) ? data.posts.slice() : [];
		if (!posts.length) {
			status.textContent = "Todavia no hay publicaciones sincronizadas.";
			return;
		}

		status.hidden = true;

		var primary = posts[0];
		var secondary = posts.slice(1);

		featured.hidden = false;
		featured.innerHTML = [
			'<div class="featured-media" style="background-image: linear-gradient(180deg, rgba(9, 12, 17, 0.18), rgba(9, 12, 17, 0.72)), url(\'' + escapeHtml(primary.cover_image_url) + '\');"></div>',
			'<div class="featured-copy">',
			'<p class="featured-meta">' + escapeHtml(formatDate(primary.published_at)) + ' · ' + escapeHtml(primary.reading_time_minutes) + ' min</p>',
			'<h3>' + escapeHtml(primary.title) + '</h3>',
			'<p>' + escapeHtml(primary.excerpt) + '</p>',
			'<div class="card-tags">' + (primary.tags || []).map(function (tag) {
				return '<span>' + escapeHtml(tag) + '</span>';
			}).join("") + '</div>',
			'<div class="newsletter-card-actions">',
			'<a class="button primary" href="newsletter-post.html?slug=' + encodeURIComponent(primary.slug) + '">Leer dentro de Madrid Total</a>',
			'<a class="newsletter-inline-link" href="' + escapeHtml(primary.web_url) + '" target="_blank" rel="noopener noreferrer">Abrir original</a>',
			'</div>',
			'</div>'
		].join("");

		list.innerHTML = secondary.map(function (post) {
			return [
				'<article class="newsletter-card">',
				'<a class="newsletter-card-image" href="newsletter-post.html?slug=' + encodeURIComponent(post.slug) + '" style="background-image: linear-gradient(180deg, rgba(12, 17, 24, 0.05), rgba(12, 17, 24, 0.72)), url(\'' + escapeHtml(post.cover_image_url) + '\');"></a>',
				'<div class="newsletter-card-body">',
				'<p class="featured-meta">' + escapeHtml(formatDate(post.published_at)) + ' · ' + escapeHtml(post.reading_time_minutes) + ' min</p>',
				'<h3><a href="newsletter-post.html?slug=' + encodeURIComponent(post.slug) + '">' + escapeHtml(post.title) + '</a></h3>',
				'<p>' + escapeHtml(post.excerpt) + '</p>',
				'<div class="card-tags">' + (post.tags || []).map(function (tag) {
					return '<span>' + escapeHtml(tag) + '</span>';
				}).join("") + '</div>',
				'</div>',
				'</article>'
			].join("");
		}).join("");
	}

	function renderArticle(data) {
		var status = document.getElementById("article-status");
		var article = document.getElementById("newsletter-article");
		if (!status || !article) return;

		var params = new URLSearchParams(window.location.search);
		var slug = params.get("slug");
		var posts = Array.isArray(data.posts) ? data.posts : [];
		var post = posts.find(function (entry) {
			return entry.slug === slug;
		});

		if (!post) {
			status.innerHTML = 'No encontramos ese articulo. <a href="newsletter.html">Volver al newsletter</a>.';
			return;
		}

		status.hidden = true;
		article.hidden = false;

		var externalLink = document.getElementById("article-external-link");
		if (externalLink) externalLink.href = post.web_url;

		article.className = "newsletter-article";
		article.innerHTML = [
			'<header class="article-header">',
			'<p class="eyebrow">EN FRIO</p>',
			'<h1>' + escapeHtml(post.title) + '</h1>',
			'<p class="article-meta">' + escapeHtml(formatDate(post.published_at)) + ' · ' + escapeHtml(post.author || "Madrid Total") + ' · ' + escapeHtml(post.reading_time_minutes) + ' min</p>',
			'<p class="article-excerpt">' + escapeHtml(post.excerpt) + '</p>',
			'<div class="article-cover"><img src="' + escapeHtml(post.cover_image_url) + '" alt="' + escapeHtml(post.title) + '"></div>',
			'</header>',
			'<div class="article-body">' + (post.content_html || "") + '</div>',
			'<div class="newsletter-card-actions">',
			'<a class="button ghost-light" href="newsletter.html">Volver al archivo</a>',
			'<a class="button primary" href="' + escapeHtml(post.web_url) + '" target="_blank" rel="noopener noreferrer">Abrir original</a>',
			'</div>'
		].join("");

		document.title = "Madrid Total | " + post.title;
	}

	fetch(postsUrl)
		.then(function (response) {
			if (!response.ok) throw new Error("No se pudo cargar el feed");
			return response.json();
		})
		.then(function (data) {
			renderFeed(data);
			renderArticle(data);
		})
		.catch(function () {
			var feedStatus = document.getElementById("newsletter-status");
			var articleStatus = document.getElementById("article-status");
			if (feedStatus) feedStatus.textContent = "No pudimos cargar el feed local.";
			if (articleStatus) articleStatus.textContent = "No pudimos cargar este articulo.";
		});
})();
